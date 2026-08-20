-- Correct a PostgreSQL CURRENT_ROLE keyword collision in the Phase 1
-- membership-management functions. Migration 007 remains immutable.
create or replace function public.set_organisation_member_role(target_org uuid, target_user uuid, intended_role public.membership_role)
returns void language plpgsql security definer set search_path = public as $$
declare existing_role public.membership_role;
begin
  if not public.is_org_admin(target_org) then raise exception 'forbidden'; end if;
  if intended_role = 'platform_admin' then raise exception 'platform_role_forbidden'; end if;
  select role into existing_role from public.memberships where organisation_id = target_org and user_id = target_user for update;
  if existing_role is null or existing_role = 'platform_admin' then raise exception 'member_not_manageable'; end if;
  if target_user = auth.uid() and intended_role <> existing_role then raise exception 'self_role_change_forbidden'; end if;
  update public.memberships set role = intended_role where organisation_id = target_org and user_id = target_user;
  insert into public.audit_events(organisation_id, actor_user_id, action, entity_type, metadata)
  values (target_org, auth.uid(), 'member_role_changed', 'membership', jsonb_build_object('target_user_id', target_user, 'previous_role', existing_role, 'role', intended_role));
end;
$$;

create or replace function public.remove_organisation_member(target_org uuid, target_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare existing_role public.membership_role;
begin
  if not public.is_org_admin(target_org) then raise exception 'forbidden'; end if;
  if target_user = auth.uid() then raise exception 'self_removal_forbidden'; end if;
  select role into existing_role from public.memberships where organisation_id = target_org and user_id = target_user for update;
  if existing_role is null or existing_role = 'platform_admin' then raise exception 'member_not_manageable'; end if;
  delete from public.memberships where organisation_id = target_org and user_id = target_user;
  insert into public.audit_events(organisation_id, actor_user_id, action, entity_type, metadata)
  values (target_org, auth.uid(), 'member_removed', 'membership', jsonb_build_object('target_user_id', target_user, 'previous_role', existing_role));
end;
$$;

revoke all on function public.set_organisation_member_role(uuid, uuid, public.membership_role) from public;
revoke all on function public.remove_organisation_member(uuid, uuid) from public;
grant execute on function public.set_organisation_member_role(uuid, uuid, public.membership_role) to authenticated;
grant execute on function public.remove_organisation_member(uuid, uuid) to authenticated;
