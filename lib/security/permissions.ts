export const permissions = [
  "view_security_data", "investigate_incident", "propose_remediation",
  "approve_remediation", "execute_remediation", "manage_organisation", "manage_security_inventory",
] as const;
export type Permission = (typeof permissions)[number];
export type Role = "platform_admin" | "organisation_admin" | "security_analyst" | "viewer";

export function roleLabel(role: Role): string {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const rolePermissions: Record<Role, readonly Permission[]> = {
  platform_admin: permissions,
  organisation_admin: ["view_security_data", "investigate_incident", "propose_remediation", "approve_remediation", "execute_remediation", "manage_organisation", "manage_security_inventory"],
  security_analyst: ["view_security_data", "investigate_incident", "propose_remediation", "manage_security_inventory"],
  viewer: ["view_security_data"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function canAccessOrganisation(membershipOrganisationId: string | null, requestedOrganisationId: string): boolean {
  return membershipOrganisationId === requestedOrganisationId;
}
