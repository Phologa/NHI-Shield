-- Phase 1 hardening: human-readable member profiles and audited membership/invite mutations.
-- This migration is versioned only. Do not apply it remotely without an explicit deployment decision.

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.sync_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null then return new; end if;
  insert into public.user_profiles (user_id, full_name, email)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), lower(new.email))
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

create trigger sync_user_profile_after_auth_change
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_user_profile();

insert into public.user_profiles (user_id, full_name, email)
select id, nullif(trim(raw_user_meta_data ->> 'full_name'), ''), lower(email)
from auth.users
where email is not null
on conflict (user_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  updated_at = now();

alter table public.user_profiles enable row level security;
create policy "members read profiles in their organisations"
on public.user_profiles for select using (
  user_id = auth.uid() or exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.organisation_id = mine.organisation_id
    where mine.user_id = auth.uid() and theirs.user_id = user_profiles.user_id
  )
);

-- Membership rows can be read by members, but all mutations now pass through the
-- security-definer functions below so validation and audit are atomic.
drop policy if exists "admins manage memberships" on public.memberships;

create or replace function public.create_organisation_with_membership(org_name text, org_slug text default null)
returns public.organisations language plpgsql security definer set search_path = public as $$
declare created_org public.organisations;
begin
  if auth.uid() is null or exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'invalid_onboarding_state';
  end if;
  if length(trim(org_name)) < 2 then raise exception 'invalid_organisation_name'; end if;
  insert into public.organisations(name) values (trim(org_name)) returning * into created_org;
  insert into public.memberships(user_id, organisation_id, role) values (auth.uid(), created_org.id, 'organisation_admin');
  insert into public.audit_events(organisation_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (created_org.id, auth.uid(), 'organisation_created', 'organisation', created_org.id, '{}'::jsonb);
  return created_org;
end;
$$;

create or replace function public.accept_organisation_invite(invite_hash text)
returns public.memberships language plpgsql security definer set search_path = public as $$
declare invite public.organisation_invites; result public.memberships;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into invite from public.organisation_invites where token_hash = invite_hash for update;
  if invite.id is null or invite.revoked_at is not null or invite.expires_at <= now() or invite.use_count >= invite.max_uses then
    raise exception 'invalid_invite';
  end if;
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'already_member';
  end if;
  if invite.invited_email is not null and lower(invite.invited_email) <> lower(coalesce((select email from auth.users where id = auth.uid()), '')) then
    raise exception 'invite_email_mismatch';
  end if;
  insert into public.memberships(user_id, organisation_id, role)
  values (auth.uid(), invite.organisation_id, invite.role) returning * into result;
  update public.organisation_invites set use_count = use_count + 1 where id = invite.id;
  insert into public.audit_events(organisation_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (invite.organisation_id, auth.uid(), 'invite_accepted', 'organisation_invite', invite.id, jsonb_build_object('role', invite.role));
  return result;
end;
$$;

create or replace function public.create_organisation_invite(
  target_org uuid, invite_hash text, intended_role public.membership_role,
  invited_address text, expiry timestamptz, allowed_uses integer
) returns uuid language plpgsql security definer set search_path = public as $$
declare created_id uuid;
begin
  if not public.is_org_admin(target_org) then raise exception 'forbidden'; end if;
  if intended_role not in ('viewer', 'security_analyst') then raise exception 'invalid_invite_role'; end if;
  if expiry <= now() or expiry > now() + interval '30 days' then raise exception 'invalid_expiry'; end if;
  if allowed_uses < 1 or allowed_uses > 100 then raise exception 'invalid_use_limit'; end if;
  insert into public.organisation_invites(organisation_id, token_hash, role, created_by, expires_at, max_uses, invited_email)
  values (target_org, invite_hash, intended_role, auth.uid(), expiry, allowed_uses, nullif(lower(trim(invited_address)), ''))
  returning id into created_id;
  insert into public.audit_events(organisation_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (target_org, auth.uid(), 'invite_created', 'organisation_invite', created_id,
    jsonb_build_object('role', intended_role, 'max_uses', allowed_uses, 'email_restricted', invited_address is not null));
  return created_id;
end;
$$;

create or replace function public.revoke_organisation_invite(target_org uuid, invite_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_org_admin(target_org) then raise exception 'forbidden'; end if;
  update public.organisation_invites set revoked_at = now()
  where organisation_id = target_org and id = invite_id and revoked_at is null and expires_at > now() and use_count < max_uses;
  if not found then raise exception 'invite_not_revocable'; end if;
  insert into public.audit_events(organisation_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (target_org, auth.uid(), 'invite_revoked', 'organisation_invite', invite_id, '{}'::jsonb);
end;
$$;

create or replace function public.set_organisation_member_role(target_org uuid, target_user uuid, intended_role public.membership_role)
returns void language plpgsql security definer set search_path = public as $$
declare current_role public.membership_role;
begin
  if not public.is_org_admin(target_org) then raise exception 'forbidden'; end if;
  if intended_role = 'platform_admin' then raise exception 'platform_role_forbidden'; end if;
  select role into current_role from public.memberships where organisation_id = target_org and user_id = target_user for update;
  if current_role is null or current_role = 'platform_admin' then raise exception 'member_not_manageable'; end if;
  if target_user = auth.uid() and intended_role <> current_role then raise exception 'self_role_change_forbidden'; end if;
  update public.memberships set role = intended_role where organisation_id = target_org and user_id = target_user;
  insert into public.audit_events(organisation_id, actor_user_id, action, entity_type, metadata)
  values (target_org, auth.uid(), 'member_role_changed', 'membership', jsonb_build_object('target_user_id', target_user, 'previous_role', current_role, 'role', intended_role));
end;
$$;

create or replace function public.remove_organisation_member(target_org uuid, target_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare current_role public.membership_role;
begin
  if not public.is_org_admin(target_org) then raise exception 'forbidden'; end if;
  if target_user = auth.uid() then raise exception 'self_removal_forbidden'; end if;
  select role into current_role from public.memberships where organisation_id = target_org and user_id = target_user for update;
  if current_role is null or current_role = 'platform_admin' then raise exception 'member_not_manageable'; end if;
  delete from public.memberships where organisation_id = target_org and user_id = target_user;
  insert into public.audit_events(organisation_id, actor_user_id, action, entity_type, metadata)
  values (target_org, auth.uid(), 'member_removed', 'membership', jsonb_build_object('target_user_id', target_user, 'previous_role', current_role));
end;
$$;

drop policy if exists "admins create invites" on public.organisation_invites;
drop policy if exists "admins update invites" on public.organisation_invites;

revoke all on public.user_profiles from anon;
revoke insert, update, delete on public.user_profiles from authenticated;
grant select on public.user_profiles to authenticated;
revoke all on function public.create_organisation_invite(uuid, text, public.membership_role, text, timestamptz, integer) from public;
revoke all on function public.revoke_organisation_invite(uuid, uuid) from public;
revoke all on function public.set_organisation_member_role(uuid, uuid, public.membership_role) from public;
revoke all on function public.remove_organisation_member(uuid, uuid) from public;
grant execute on function public.create_organisation_invite(uuid, text, public.membership_role, text, timestamptz, integer) to authenticated;
grant execute on function public.revoke_organisation_invite(uuid, uuid) to authenticated;
grant execute on function public.set_organisation_member_role(uuid, uuid, public.membership_role) to authenticated;
grant execute on function public.remove_organisation_member(uuid, uuid) to authenticated;
