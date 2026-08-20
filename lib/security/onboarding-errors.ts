export type OnboardingActionError = {
  code?: string;
  message?: string;
};

export function onboardingErrorMessage(error: OnboardingActionError | null): string {
  if (error?.message === "invalid_onboarding_state") {
    return "This account already belongs to an organisation. Continue to your workspace, or sign out and use a different account.";
  }
  if (error?.message === "invalid_organisation_name") {
    return "Enter an organisation name between 2 and 200 characters.";
  }
  if (error?.code === "42501") {
    return "Organisation setup is not available for this account. Sign in again; if the problem continues, contact an organisation administrator.";
  }
  if (error?.code === "PGRST202" || error?.code === "42883") {
    return "Organisation setup is temporarily unavailable because the database is not ready. Contact an organisation administrator.";
  }
  return "The organisation could not be created. Nothing was changed; try again or contact an organisation administrator.";
}
