import { canAccessSecurity } from "./access";
import { isVerificationOfficer } from "@/lib/organizations/schema";

// Officers land on their dedicated review dashboard; Security Dashboard stays one click away in the same session.
export function staffHome(roles: string[]): "/officer" | "/security" | null {
  if (isVerificationOfficer(roles)) return "/officer";
  if (canAccessSecurity(roles)) return "/security";
  return null;
}
