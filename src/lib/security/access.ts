export const STAFF_ROLES = ["security_analyst", "security_supervisor", "organization_verification_officer", "organization_administrator", "public_visitor"] as const;
export type StaffRole = typeof STAFF_ROLES[number];
export function canAccessSecurity(roles: readonly string[]): boolean {
  return roles.includes("security_analyst") || roles.includes("security_supervisor");
}