create extension if not exists "pgcrypto";
create type public.invite_status as enum ('active','revoked','expired','exhausted');
create type public.incident_status as enum ('open','investigating','contained','resolved');

create table public.organisation_invites (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  token_hash text not null unique, role public.membership_role not null default 'viewer', created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), expires_at timestamptz not null, max_uses integer not null default 1 check (max_uses between 1 and 1000),
  use_count integer not null default 0 check (use_count >= 0), revoked_at timestamptz, invited_email text,
  unique (organisation_id, id)
);
create table public.activity_events (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  machine_identity_id uuid not null, resource_id uuid, action text not null, outcome text not null, source text not null default 'manual',
  occurred_at timestamptz not null, request_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique (organisation_id, id),
  foreign key (organisation_id, machine_identity_id) references public.machine_identities(organisation_id, id) on delete cascade,
  foreign key (organisation_id, resource_id) references public.resources(organisation_id, id) on delete set null
);
create table public.incidents (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  title text not null, description text not null, severity public.finding_severity not null, status public.incident_status not null default 'open',
  machine_identity_id uuid, resource_id uuid, opened_at timestamptz not null default now(), last_activity_at timestamptz not null default now(), resolved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organisation_id, id),
  foreign key (organisation_id, machine_identity_id) references public.machine_identities(organisation_id, id) on delete cascade,
  foreign key (organisation_id, resource_id) references public.resources(organisation_id, id) on delete cascade
);
create table public.incident_events (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  incident_id uuid not null, activity_event_id uuid, finding_id uuid, event_type text not null, note text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique (organisation_id, id),
  foreign key (organisation_id, incident_id) references public.incidents(organisation_id, id) on delete cascade,
  foreign key (organisation_id, activity_event_id) references public.activity_events(organisation_id, id) on delete set null,
  foreign key (organisation_id, finding_id) references public.findings(organisation_id, id) on delete set null
);
create index organisation_invites_org_idx on public.organisation_invites (organisation_id, created_at desc);
create index activity_events_org_time_idx on public.activity_events (organisation_id, occurred_at desc);
create index incidents_org_status_idx on public.incidents (organisation_id, status, last_activity_at desc);
create index incident_events_org_incident_idx on public.incident_events (organisation_id, incident_id, created_at desc);
create trigger incidents_touch_updated_at before update on public.incidents for each row execute function public.touch_updated_at();

create or replace function public.create_organisation_with_membership(org_name text, org_slug text default null)
returns public.organisations language plpgsql security definer set search_path = public as $$
declare created_org public.organisations;
begin
  if auth.uid() is null or exists (select 1 from public.memberships where user_id = auth.uid()) then raise exception 'invalid_onboarding_state'; end if;
  if length(trim(org_name)) < 2 then raise exception 'invalid_organisation_name'; end if;
  insert into public.organisations(name) values (trim(org_name)) returning * into created_org;
  insert into public.memberships(user_id, organisation_id, role) values (auth.uid(), created_org.id, 'organisation_admin');
  return created_org;
end; $$;

create or replace function public.accept_organisation_invite(invite_hash text)
returns public.memberships language plpgsql security definer set search_path = public as $$
declare invite public.organisation_invites; result public.memberships;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.memberships where user_id = auth.uid() and organisation_id = (select organisation_id from public.organisation_invites where token_hash = invite_hash)) then raise exception 'already_member'; end if;
  select * into invite from public.organisation_invites where token_hash = invite_hash for update;
  if invite.id is null or invite.revoked_at is not null or invite.expires_at <= now() or invite.use_count >= invite.max_uses then raise exception 'invalid_invite'; end if;
  if invite.invited_email is not null and lower(invite.invited_email) <> lower(coalesce((select email from auth.users where id = auth.uid()), '')) then raise exception 'invite_email_mismatch'; end if;
  insert into public.memberships(user_id, organisation_id, role) values (auth.uid(), invite.organisation_id, invite.role) returning * into result;
  update public.organisation_invites set use_count = use_count + 1 where id = invite.id;
  return result;
end; $$;

revoke execute on function public.create_organisation_with_membership(text, text) from public;
revoke execute on function public.accept_organisation_invite(text) from public;
grant execute on function public.create_organisation_with_membership(text, text) to authenticated;
grant execute on function public.accept_organisation_invite(text) to authenticated;

alter table public.organisation_invites enable row level security;
alter table public.activity_events enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_events enable row level security;
create policy "members read invites" on public.organisation_invites for select using (public.is_org_member(organisation_id));
create policy "admins create invites" on public.organisation_invites for insert with check (public.is_org_admin(organisation_id) and created_by = auth.uid() and role in ('viewer', 'security_analyst'));
create policy "admins update invites" on public.organisation_invites for update using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));
create policy "members read activity" on public.activity_events for select using (public.is_org_member(organisation_id));
create policy "managers create activity" on public.activity_events for insert with check (public.can_manage_security(organisation_id));
create policy "members read incidents" on public.incidents for select using (public.is_org_member(organisation_id));
create policy "analysts create incidents" on public.incidents for insert with check (public.can_manage_security(organisation_id));
create policy "analysts update incidents" on public.incidents for update using (public.can_manage_security(organisation_id)) with check (public.can_manage_security(organisation_id));
create policy "members read incident events" on public.incident_events for select using (public.is_org_member(organisation_id));
create policy "analysts create incident events" on public.incident_events for insert with check (public.can_manage_security(organisation_id));
