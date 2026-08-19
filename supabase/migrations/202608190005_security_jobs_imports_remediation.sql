-- Local-only readiness migration. Review and apply manually after 004.
create table public.import_runs (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  entity_type text not null check (entity_type in ('machine_identities','credentials','resources','access_relationships')),
  row_count integer not null check (row_count between 1 and 1000), created_count integer not null default 0,
  updated_count integer not null default 0, status text not null check (status in ('completed','failed')),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique (organisation_id, id)
);
alter table public.import_runs enable row level security;
create policy "members read import runs" on public.import_runs for select using (public.is_org_member(organisation_id));
create policy "managers create import runs" on public.import_runs for insert with check (public.can_manage_security(organisation_id) and created_by=auth.uid());

create or replace function public.import_security_csv(target_entity text, import_rows jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare item jsonb; target_org uuid; created_count integer := 0; updated_count integer := 0; affected integer;
begin
  if auth.uid() is null or target_entity not in ('machine_identities','credentials','resources','access_relationships')
    or jsonb_typeof(import_rows) <> 'array' or jsonb_array_length(import_rows) not between 1 and 1000 then raise exception 'invalid_import'; end if;
  target_org := (import_rows->0->>'organisation_id')::uuid;
  if not public.can_manage_security(target_org) or exists (
    select 1 from jsonb_array_elements(import_rows) value where (value->>'organisation_id')::uuid <> target_org
  ) then raise exception 'forbidden_import'; end if;

  for item in select value from jsonb_array_elements(import_rows) loop
    if target_entity = 'machine_identities' then
      insert into public.machine_identities (organisation_id,name,identity_type,provider,external_id,environment,owner_name,owner_email,privilege_level,status,description,source_type)
      values (target_org,item->>'name',(item->>'identity_type')::public.machine_identity_type,nullif(item->>'provider',''),nullif(item->>'external_id',''),(item->>'environment')::public.security_environment,nullif(item->>'owner_name',''),nullif(item->>'owner_email',''),(item->>'privilege_level')::public.privilege_level,(item->>'status')::public.machine_identity_status,nullif(item->>'description',''),'csv_import')
      on conflict (organisation_id,provider,external_id) do update set name=excluded.name, identity_type=excluded.identity_type, environment=excluded.environment, owner_name=excluded.owner_name, owner_email=excluded.owner_email, privilege_level=excluded.privilege_level, status=excluded.status, description=excluded.description, source_type='csv_import';
    elsif target_entity = 'resources' then
      insert into public.resources (organisation_id,name,resource_type,provider,external_id,environment,sensitivity,description)
      values (target_org,item->>'name',(item->>'resource_type')::public.resource_type,nullif(item->>'provider',''),nullif(item->>'external_id',''),(item->>'environment')::public.security_environment,(item->>'sensitivity')::public.resource_sensitivity,nullif(item->>'description',''))
      on conflict (organisation_id,provider,external_id) do update set name=excluded.name, resource_type=excluded.resource_type, environment=excluded.environment, sensitivity=excluded.sensitivity, description=excluded.description;
    elsif target_entity = 'access_relationships' then
      insert into public.access_relationships (organisation_id,machine_identity_id,resource_id,access_level,privileged,source)
      values (target_org,(item->>'machine_identity_id')::uuid,(item->>'resource_id')::uuid,item->>'access_level',(item->>'privileged')::boolean,'csv_import')
      on conflict (organisation_id,machine_identity_id,resource_id,access_level) do update set privileged=excluded.privileged, source='csv_import', last_observed_at=now();
    else
      if not exists (select 1 from public.credentials where organisation_id=target_org and machine_identity_id=(item->>'machine_identity_id')::uuid and label=item->>'label' and credential_type=(item->>'credential_type')::public.credential_type) then
        insert into public.credentials (organisation_id,machine_identity_id,credential_type,label,status,last_rotated_at,expires_at,fingerprint_reference)
        values (target_org,(item->>'machine_identity_id')::uuid,(item->>'credential_type')::public.credential_type,item->>'label',(item->>'status')::public.credential_status,nullif(item->>'last_rotated_at','')::timestamptz,nullif(item->>'expires_at','')::timestamptz,nullif(item->>'fingerprint_reference',''));
      else
        update public.credentials set status=(item->>'status')::public.credential_status,last_rotated_at=nullif(item->>'last_rotated_at','')::timestamptz,expires_at=nullif(item->>'expires_at','')::timestamptz,fingerprint_reference=nullif(item->>'fingerprint_reference','') where organisation_id=target_org and machine_identity_id=(item->>'machine_identity_id')::uuid and label=item->>'label' and credential_type=(item->>'credential_type')::public.credential_type;
      end if;
    end if;
    get diagnostics affected = row_count; created_count := created_count + affected;
  end loop;
  insert into public.import_runs(organisation_id,entity_type,row_count,created_count,status,created_by) values(target_org,target_entity,jsonb_array_length(import_rows),created_count,'completed',auth.uid());
  insert into public.audit_events(organisation_id,actor_user_id,action,entity_type,metadata) values(target_org,auth.uid(),'csv_import_completed',target_entity,jsonb_build_object('rows',jsonb_array_length(import_rows),'created_or_updated',created_count));
  return jsonb_build_object('processed',jsonb_array_length(import_rows));
end; $$;
revoke execute on function public.import_security_csv(text,jsonb) from public;
grant execute on function public.import_security_csv(text,jsonb) to authenticated;

create or replace function public.transition_remediation(action_id uuid, target_status public.remediation_status, note text default null)
returns public.remediation_actions language plpgsql security definer set search_path=public as $$
declare current_action public.remediation_actions; result public.remediation_actions;
begin
  select * into current_action from public.remediation_actions where id=action_id for update;
  if current_action.id is null or not public.is_org_admin(current_action.organisation_id) then raise exception 'not_found'; end if;
  if target_status='approved' and current_action.proposed_by=auth.uid() then raise exception 'separation_of_duties'; end if;
  if not ((current_action.status='proposed' and target_status in ('approved','cancelled')) or (current_action.status='approved' and target_status in ('manual_action_required','executing','cancelled')) or (current_action.status in ('manual_action_required','executing') and target_status in ('succeeded','failed','cancelled'))) then raise exception 'invalid_transition'; end if;
  update public.remediation_actions set status=target_status, approved_by=case when target_status='approved' then auth.uid() else approved_by end, approved_at=case when target_status='approved' then now() else approved_at end, completed_at=case when target_status in ('succeeded','failed','cancelled') then now() else null end, completion_note=coalesce(nullif(trim(note),''),completion_note) where id=action_id and status=current_action.status returning * into result;
  if result.id is null then raise exception 'stale_transition'; end if;
  insert into public.audit_events(organisation_id,actor_user_id,action,entity_type,entity_id,metadata) values(result.organisation_id,auth.uid(),'remediation_status_changed','remediation_action',result.id,jsonb_build_object('from',current_action.status,'to',target_status));
  return result;
end; $$;
revoke execute on function public.transition_remediation(uuid,public.remediation_status,text) from public;
grant execute on function public.transition_remediation(uuid,public.remediation_status,text) to authenticated;

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  run_key text not null, status text not null check (status in ('running','completed','failed')), findings_created integer not null default 0,
  incidents_created integer not null default 0, error_summary text, started_at timestamptz not null default now(), completed_at timestamptz,
  unique(organisation_id,run_key), unique(organisation_id,id)
);
alter table public.incidents add column detection_key text;
create unique index incidents_active_detection_key on public.incidents(organisation_id,detection_key) where status<>'resolved' and detection_key is not null;
create unique index activity_request_id_unique on public.activity_events(organisation_id,source,request_id) where request_id is not null;
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, title text not null default 'Security conversation', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organisation_id,id)
);
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  conversation_id uuid not null, user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check(role in ('user','assistant')), content text not null check(char_length(content) between 1 and 12000),
  citations jsonb not null default '[]', actions jsonb not null default '[]', created_at timestamptz not null default now(), unique(organisation_id,id),
  foreign key(organisation_id,conversation_id) references public.ai_conversations(organisation_id,id) on delete cascade
);
create table public.notification_outbox (
 id uuid primary key default gen_random_uuid(),organisation_id uuid not null references public.organisations(id) on delete cascade,
 event_type text not null,recipient text,payload jsonb not null default '{}',status text not null default 'configuration_required' check(status in ('configuration_required','pending','sent','failed')),
 attempt_count integer not null default 0,last_error text,created_at timestamptz not null default now(),sent_at timestamptz,unique(organisation_id,id)
);
create trigger ai_conversations_touch_updated_at before update on public.ai_conversations for each row execute function public.touch_updated_at();
do $$ declare table_name text; begin foreach table_name in array array['analysis_runs','ai_conversations','ai_messages','notification_outbox'] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('create policy %I on public.%I for select using (public.is_org_member(organisation_id))',table_name||'_members_read',table_name);
end loop; end $$;
create policy "users create own conversations" on public.ai_conversations for insert with check(public.is_org_member(organisation_id) and user_id=auth.uid());
create policy "users update own conversations" on public.ai_conversations for update using(user_id=auth.uid() and public.is_org_member(organisation_id)) with check(user_id=auth.uid() and public.is_org_member(organisation_id));
create policy "users create own messages" on public.ai_messages for insert with check(public.is_org_member(organisation_id) and user_id=auth.uid() and exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.organisation_id=ai_messages.organisation_id and c.user_id=auth.uid()));
