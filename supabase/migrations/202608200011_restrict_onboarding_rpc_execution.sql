-- Restore the intended authenticated-only boundary for onboarding RPCs.
-- PostgreSQL grants function execution to PUBLIC by default, so revoke both
-- PUBLIC and the explicit anon role before granting the authenticated role.
revoke all on function public.create_organisation_with_membership(text, text) from public;
revoke all on function public.create_organisation_with_membership(text, text) from anon;
grant execute on function public.create_organisation_with_membership(text, text) to authenticated;

revoke all on function public.accept_organisation_invite(text) from public;
revoke all on function public.accept_organisation_invite(text) from anon;
grant execute on function public.accept_organisation_invite(text) to authenticated;
