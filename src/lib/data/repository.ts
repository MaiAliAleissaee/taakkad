import type {
  AlertStatus, DemoState, ImpersonationAlert, LookalikeDomain, LookalikeStatus, Organization, OrgStatus,
} from "@/lib/domain/types";

/**
 * Data access contract. The prototype implements it with browser storage
 * (local-store.ts); a backend implementation can replace it without touching pages.
 */
export interface TrustRepository {
  getState(): DemoState;
  addOrganization(org: Organization): void;
  setOrganizationStatus(id: string, status: OrgStatus): void;
  deleteOrganization(id: string): void;
  addAlert(alert: Omit<ImpersonationAlert, "id" | "caseId">): ImpersonationAlert;
  updateAlert(id: string, patch: Partial<Pick<ImpersonationAlert, "status" | "assignee">>): void;
  addAlertNote(id: string, author: string, text: string): void;
  setLookalikeStatus(id: string, status: LookalikeStatus): void;
  addLookalikes(items: LookalikeDomain[]): void;
  reset(): void;
}

export type { AlertStatus };
