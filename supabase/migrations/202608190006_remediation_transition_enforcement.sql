-- Require every authenticated remediation status change to use the audited
-- transition_remediation RPC introduced in migration 005.
drop policy if exists "admins update remediation" on public.remediation_actions;
revoke update on table public.remediation_actions from authenticated;
