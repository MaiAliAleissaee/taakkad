import type { Organization } from "@/lib/domain/types";

/** The caller must supply only the database's genuine projection, never local demo state. */
export function publicOrganizations(records: Organization[]): Organization[] {
  return records.filter(org => org.status === "verified").map(org => ({
    ...org, contactEmail: "", channels: org.channels.filter(channel => channel.status === "verified"),
  }));
}