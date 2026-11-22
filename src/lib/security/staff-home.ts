import { canAccessSecurity } from "./access";
import { isVerificationOfficer } from "@/lib/organizations/schema";

// Officers land on organization review first; Security Dashboard stays one click away in the same session.
export function staffHome(roles: string[]): "/organizations" | "/security" | null {
  if (isVerificationOfficer(roles)) return "/organizations";
  if (canAccessSecurity(roles)) return "/security";
  return null;
}
