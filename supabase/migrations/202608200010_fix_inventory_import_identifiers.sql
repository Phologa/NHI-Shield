-- Correct PL/pgSQL variable/column ambiguity in the Phase 2 inventory import.
-- Migration 008 remains immutable.
create or replace function public.import_security_inventory_csv(import_rows jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare item jsonb; target_org uuid; target_identity_id uuid; target_resource_id uuid; processed integer := 0; relationship_count integer := 0; credential_count integer := 0;
begin
  if auth.uid() is null or jsonb_typeof(import_rows) <> 'array' or jsonb_array_length(import_rows) not between 1 and 1000 then raise exception 'invalid_import'; end if;
  target_org := (import_rows->0->>'organisation_id')::uuid;
  if not public.can_manage_security(target_org) or exists (select 1 from jsonb_array_elements(import_rows) value where (value->>'organisation_id')::uuid <> target_org) then raise exception 'forbidden_import'; end if;

  for item in select value from jsonb_array_elements(import_rows) loop
    insert into public.machine_identities(organisation_id,name,identity_type,provider,external_id,environment,owner_name,owner_email,privilege_level,status,description,source_type,last_seen_at,ownership_conflict)
    values(target_org,item->>'name',(item->>'identity_type')::public.machine_identity_type,item->>'provider',item->>'external_id',(item->>'environment')::public.security_environment,nullif(item->>'owner_name',''),nullif(item->>'owner_email',''),(item->>'privilege_level')::public.privilege_level,(item->>'status')::public.machine_identity_status,nullif(item->>'description',''),'csv_import',nullif(item->>'last_seen_at','')::timestamptz,false)
    on conflict(organisation_id,provider,external_id) do update set name=excluded.name,identity_type=excluded.identity_type,environment=excluded.environment,owner_name=excluded.owner_name,owner_email=excluded.owner_email,privilege_level=excluded.privilege_level,status=excluded.status,description=excluded.description,source_type='csv_import',last_seen_at=excluded.last_seen_at,ownership_conflict=machine_identities.ownership_conflict or (machine_identities.owner_name is distinct from excluded.owner_name)
    returning id into target_identity_id;

    target_resource_id := null;
    if nullif(item->>'resource_external_id','') is not null then
      insert into public.resources(organisation_id,name,resource_type,provider,external_id,environment,sensitivity,description,provenance)
      values(target_org,item->>'resource_name',(item->>'resource_type')::public.resource_type,item->>'resource_provider',item->>'resource_external_id',(item->>'resource_environment')::public.security_environment,(item->>'resource_sensitivity')::public.resource_sensitivity,nullif(item->>'resource_description',''),'observed')
      on conflict(organisation_id,provider,external_id) do update set name=excluded.name,resource_type=excluded.resource_type,environment=excluded.environment,sensitivity=excluded.sensitivity,description=excluded.description,provenance='observed'
      returning id into target_resource_id;
      insert into public.access_relationships(organisation_id,machine_identity_id,resource_id,access_level,privileged,source,provenance,last_observed_at)
      values(target_org,target_identity_id,target_resource_id,item->>'access_level',(item->>'access_privileged')::boolean,'csv_import','observed',now())
      on conflict(organisation_id,machine_identity_id,resource_id,access_level) do update set privileged=excluded.privileged,source='csv_import',provenance='observed',last_observed_at=now();
      relationship_count := relationship_count + 1;
    end if;

    if nullif(item->>'credential_label','') is not null then
      if exists(select 1 from public.credentials where organisation_id=target_org and machine_identity_id=target_identity_id and label=item->>'credential_label' and credential_type=(item->>'credential_type')::public.credential_type) then
        update public.credentials set status=(item->>'credential_status')::public.credential_status,last_rotated_at=nullif(item->>'credential_last_rotated_at','')::timestamptz,expires_at=nullif(item->>'credential_expires_at','')::timestamptz,provenance='observed' where organisation_id=target_org and machine_identity_id=target_identity_id and label=item->>'credential_label' and credential_type=(item->>'credential_type')::public.credential_type;
      else
        insert into public.credentials(organisation_id,machine_identity_id,credential_type,label,status,last_rotated_at,expires_at,provenance)
        values(target_org,target_identity_id,(item->>'credential_type')::public.credential_type,item->>'credential_label',(item->>'credential_status')::public.credential_status,nullif(item->>'credential_last_rotated_at','')::timestamptz,nullif(item->>'credential_expires_at','')::timestamptz,'observed');
      end if;
      credential_count := credential_count + 1;
    end if;
    processed := processed + 1;
  end loop;
  insert into public.import_runs(organisation_id,entity_type,row_count,created_count,status,analysis_status,created_by) values(target_org,'security_inventory',processed,processed,'completed','ready',auth.uid());
  insert into public.audit_events(organisation_id,actor_user_id,action,entity_type,metadata) values(target_org,auth.uid(),'csv_inventory_import_completed','import_run',jsonb_build_object('rows',processed,'relationships',relationship_count,'credentials',credential_count,'provenance','observed'));
  return jsonb_build_object('processed',processed,'relationships',relationship_count,'credentials',credential_count,'analysis_status','ready');
end;
$$;

revoke execute on function public.import_security_inventory_csv(jsonb) from public;
grant execute on function public.import_security_inventory_csv(jsonb) to authenticated;
