import type {
  AlertStatus, DemoActor, DemoState, ImpersonationAlert, LookalikeDomain, LookalikeStatus, Organization, OrgStatus,
} from "@/lib/domain/types";
import type { ChannelCommand } from "@/lib/services/channels";

/**
 * Data access contract. The prototype implements it with browser storage
 * (local-store.ts); a backend implementation can replace it without touching pages.
 */
export interface TrustRepository {
  getState(): DemoState;
  addOrganization(org: Organization): void;
  setOrganizationStatus(id: string, status: OrgStatus, actor: DemoActor): void;
  deleteOrganization(id: string, actor: DemoActor): void;
  channelCommand(actor: DemoActor, command: ChannelCommand): void;
  addAlert(alert: Omit<ImpersonationAlert, "id" | "caseId">): ImpersonationAlert;
  updateAlert(id: string, patch: Partial<Pick<ImpersonationAlert, "status" | "assignee">>): void;
  addAlertNote(id: string, author: string, text: string): void;
  setLookalikeStatus(id: string, status: LookalikeStatus): void;
  addLookalikes(items: LookalikeDomain[]): void;
  reset(): void;
}

export type { AlertStatus };
