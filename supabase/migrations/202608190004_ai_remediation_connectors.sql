create type public.remediation_status as enum ('proposed','approved','manual_action_required','executing','succeeded','failed','cancelled');
create type public.connector_status as enum ('not_configured','configured','syncing','ready','error','disabled');

create table public.remediation_actions (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  finding_id uuid, incident_id uuid, title text not null, rationale text not null, action_type text not null,
  execution_mode text not null default 'manual' check (execution_mode in ('manual','connector')),
  status public.remediation_status not null default 'proposed', proposed_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id), approved_at timestamptz, completed_at timestamptz, completion_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organisation_id, id),
  foreign key (organisation_id, finding_id) references public.findings(organisation_id, id) on delete set null,
  foreign key (organisation_id, incident_id) references public.incidents(organisation_id, id) on delete set null
);
create table public.connector_configurations (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  connector_type text not null, display_name text not null, status public.connector_status not null default 'not_configured',
  configuration jsonb not null default '{}'::jsonb, last_synced_at timestamptz, last_error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organisation_id, connector_type), unique (organisation_id, id)
);
create table public.notification_preferences (
  organisation_id uuid primary key references public.organisations(id) on delete cascade,
  high_severity_enabled boolean not null default true, incident_enabled boolean not null default true,
  email_recipient text, updated_at timestamptz not null default now()
);
create index remediation_org_status_idx on public.remediation_actions(organisation_id, status, created_at desc);
create trigger remediation_touch_updated_at before update on public.remediation_actions for each row execute function public.touch_updated_at();
create trigger connectors_touch_updated_at before update on public.connector_configurations for each row execute function public.touch_updated_at();

alter table public.remediation_actions enable row level security;
alter table public.connector_configurations enable row level security;
alter table public.notification_preferences enable row level security;
create policy "members read remediation" on public.remediation_actions for select using (public.is_org_member(organisation_id));
create policy "analysts propose remediation" on public.remediation_actions for insert with check (public.can_manage_security(organisation_id) and proposed_by = auth.uid() and status = 'proposed');
create policy "admins update remediation" on public.remediation_actions for update using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));
create policy "members read connectors" on public.connector_configurations for select using (public.is_org_member(organisation_id));
create policy "admins manage connectors" on public.connector_configurations for all using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));
create policy "members read notification preferences" on public.notification_preferences for select using (public.is_org_member(organisation_id));
create policy "admins manage notification preferences" on public.notification_preferences for all using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));
