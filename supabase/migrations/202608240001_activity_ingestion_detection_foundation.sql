-- Local-only operational activity ingestion and incident timeline hardening.
-- Review and apply manually after 202608200011; do not apply automatically.

alter table public.import_runs drop constraint if exists import_runs_entity_type_check;
alter table public.import_runs add constraint import_runs_entity_type_check
  check (entity_type in ('security_inventory','machine_identities','credentials','resources','access_relationships','activity_events'));

alter table public.activity_events drop constraint if exists activity_events_outcome_check;
alter table public.activity_events add constraint activity_events_outcome_check check (outcome in ('allowed','denied','error'));
alter table public.activity_events drop constraint if exists activity_events_action_length_check;
alter table public.activity_events add constraint activity_events_action_length_check check (char_length(trim(action)) between 1 and 200);
alter table public.activity_events drop constraint if exists activity_events_source_length_check;
alter table public.activity_events add constraint activity_events_source_length_check check (char_length(trim(source)) between 1 and 100);
alter table public.activity_events drop constraint if exists activity_events_request_id_length_check;
alter table public.activity_events add constraint activity_events_request_id_length_check
  check (request_id is null or char_length(trim(request_id)) between 1 and 200);
drop index if exists public.incident_events_activity_detection_unique;
create unique index incident_events_activity_detection_unique
  on public.incident_events(organisation_id, incident_id, activity_event_id)
  where activity_event_id is not null and event_type = 'detection_rule';

create or replace function public.import_activity_events_csv(import_rows jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare item jsonb; target_org uuid; processed integer := 0; created integer := 0; affected integer := 0;
begin
  if auth.uid() is null or jsonb_typeof(import_rows) <> 'array'
    or jsonb_array_length(import_rows) not between 1 and 1000 then raise exception 'invalid_import'; end if;
  target_org := (import_rows->0->>'organisation_id')::uuid;
  if not public.can_manage_security(target_org) or exists (
    select 1 from jsonb_array_elements(import_rows) value
    where (value->>'organisation_id')::uuid <> target_org
  ) then raise exception 'forbidden_import'; end if;

  for item in select value from jsonb_array_elements(import_rows) loop
    if nullif(trim(item->>'request_id'),'') is null then raise exception 'missing_request_id'; end if;
    if (item->>'occurred_at')::timestamptz > now() + interval '5 minutes' then raise exception 'future_activity'; end if;
    insert into public.activity_events(
      organisation_id,machine_identity_id,resource_id,action,outcome,source,occurred_at,request_id,metadata
    ) values (
      target_org,(item->>'machine_identity_id')::uuid,nullif(item->>'resource_id','')::uuid,
      trim(item->>'action'),item->>'outcome',trim(item->>'source'),(item->>'occurred_at')::timestamptz,
      trim(item->>'request_id'),'{}'::jsonb
    )
    on conflict (organisation_id,source,request_id) where request_id is not null do nothing;
    get diagnostics affected = row_count;
    created := created + affected;
    processed := processed + 1;
  end loop;

  insert into public.import_runs(organisation_id,entity_type,row_count,created_count,status,analysis_status,created_by)
    values(target_org,'activity_events',processed,created,'completed','ready',auth.uid());
  insert into public.audit_events(organisation_id,actor_user_id,action,entity_type,metadata)
    values(target_org,auth.uid(),'activity_csv_ingestion_completed','activity_event',jsonb_build_object('rows',processed,'created',created,'duplicates',processed-created,'idempotency_key','source+request_id'));
  return jsonb_build_object('processed',processed,'created',created,'duplicates',processed-created);
end;
$$;

revoke all on function public.import_activity_events_csv(jsonb) from public;
revoke all on function public.import_activity_events_csv(jsonb) from anon;
grant execute on function public.import_activity_events_csv(jsonb) to authenticated;
