create type public.machine_identity_type as enum ('service_account','application','workload','api_client','bot','automation','cicd','ai_agent','other');
create type public.security_environment as enum ('production','staging','development','test','unknown');
create type public.machine_identity_status as enum ('active','inactive','suspended','unknown');
create type public.privilege_level as enum ('low','standard','high','critical','unknown');
create type public.identity_source_type as enum ('manual','csv_import','connector');
create type public.credential_type as enum ('certificate','api_key_metadata','token_metadata','ssh_key_metadata','secret_metadata','other');
create type public.credential_status as enum ('active','expired','revoked','unknown');
create type public.resource_type as enum ('database','api','storage','cloud_resource','repository','application','queue','infrastructure','other');
create type public.resource_sensitivity as enum ('low','medium','high','critical','unknown');
create type public.finding_severity as enum ('low','medium','high','critical');
create type public.finding_status as enum ('open','acknowledged','resolved');
create type public.ingestion_source_status as enum ('configured','active','paused','error');

create table public.machine_identities (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200), identity_type public.machine_identity_type not null,
  provider text, external_id text, description text, environment public.security_environment not null default 'unknown',
  owner_name text, owner_email text, status public.machine_identity_status not null default 'unknown',
  privilege_level public.privilege_level not null default 'unknown', source_type public.identity_source_type not null default 'manual',
  first_seen_at timestamptz, last_seen_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organisation_id, id), unique (organisation_id, provider, external_id)
);

create table public.credentials (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  machine_identity_id uuid not null, credential_type public.credential_type not null, label text not null check (char_length(trim(label)) between 1 and 200),
  status public.credential_status not null default 'unknown', issued_at timestamptz, last_rotated_at timestamptz, expires_at timestamptz,
  last_observed_at timestamptz, fingerprint_reference text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organisation_id, id), foreign key (organisation_id, machine_identity_id) references public.machine_identities(organisation_id, id) on delete cascade
);

create table public.resources (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200), resource_type public.resource_type not null, provider text, external_id text,
  environment public.security_environment not null default 'unknown', sensitivity public.resource_sensitivity not null default 'unknown', description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organisation_id, id), unique (organisation_id, provider, external_id)
);

create table public.access_relationships (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  machine_identity_id uuid not null, resource_id uuid not null, access_level text not null check (char_length(trim(access_level)) between 1 and 120),
  privileged boolean not null default false, source text not null default 'manual', first_observed_at timestamptz, last_observed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organisation_id, id),
  unique (organisation_id, machine_identity_id, resource_id, access_level),
  foreign key (organisation_id, machine_identity_id) references public.machine_identities(organisation_id, id) on delete cascade,
  foreign key (organisation_id, resource_id) references public.resources(organisation_id, id) on delete cascade
);

create table public.findings (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  machine_identity_id uuid, resource_id uuid, finding_type text not null, title text not null, description text not null,
  severity public.finding_severity not null, status public.finding_status not null default 'open', risk_score integer not null check (risk_score between 0 and 100),
  confidence integer not null check (confidence between 0 and 100), first_detected_at timestamptz not null, last_detected_at timestamptz not null,
  resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organisation_id, id),
  unique (organisation_id, finding_type, machine_identity_id, resource_id),
  foreign key (organisation_id, machine_identity_id) references public.machine_identities(organisation_id, id) on delete cascade,
  foreign key (organisation_id, resource_id) references public.resources(organisation_id, id) on delete cascade
);

create table public.finding_evidence (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  finding_id uuid not null, evidence_type text not null, summary text not null, structured_data jsonb not null default '{}'::jsonb, source text not null,
  observed_at timestamptz not null, created_at timestamptz not null default now(), unique (organisation_id, id),
  foreign key (organisation_id, finding_id) references public.findings(organisation_id, id) on delete cascade
);

create table public.ingestion_sources (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null, source_type public.identity_source_type not null, provider text, status public.ingestion_source_status not null default 'configured',
  last_sync_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organisation_id, id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null, action text not null, entity_type text not null, entity_id uuid,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique (organisation_id, id)
);

create index machine_identities_org_updated_idx on public.machine_identities (organisation_id, updated_at desc);
create index credentials_org_identity_idx on public.credentials (organisation_id, machine_identity_id);
create index resources_org_updated_idx on public.resources (organisation_id, updated_at desc);
create index access_relationships_org_idx on public.access_relationships (organisation_id, machine_identity_id, resource_id);
create index findings_org_status_idx on public.findings (organisation_id, status, severity);
create index finding_evidence_org_finding_idx on public.finding_evidence (organisation_id, finding_id, observed_at desc);
create index audit_events_org_created_idx on public.audit_events (organisation_id, created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger machine_identities_touch_updated_at before update on public.machine_identities for each row execute function public.touch_updated_at();
create trigger credentials_touch_updated_at before update on public.credentials for each row execute function public.touch_updated_at();
create trigger resources_touch_updated_at before update on public.resources for each row execute function public.touch_updated_at();
create trigger access_relationships_touch_updated_at before update on public.access_relationships for each row execute function public.touch_updated_at();
create trigger findings_touch_updated_at before update on public.findings for each row execute function public.touch_updated_at();
create trigger ingestion_sources_touch_updated_at before update on public.ingestion_sources for each row execute function public.touch_updated_at();

create or replace function public.can_manage_security(target_org uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships where user_id = auth.uid() and organisation_id = target_org and role in ('platform_admin','organisation_admin','security_analyst'));
$$;

do $$ declare table_name text; begin
  foreach table_name in array array['machine_identities','credentials','resources','access_relationships','findings','finding_evidence','ingestion_sources','audit_events'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select using (public.is_org_member(organisation_id))', table_name || '_members_read', table_name);
    execute format('create policy %I on public.%I for insert with check (public.can_manage_security(organisation_id))', table_name || '_managers_insert', table_name);
    execute format('create policy %I on public.%I for update using (public.can_manage_security(organisation_id)) with check (public.can_manage_security(organisation_id))', table_name || '_managers_update', table_name);
    execute format('create policy %I on public.%I for delete using (public.is_org_admin(organisation_id))', table_name || '_admins_delete', table_name);
  end loop;
end $$;