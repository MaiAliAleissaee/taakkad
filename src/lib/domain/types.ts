/**
 * Core domain model for TRUST ZERO AI.
 * All data in this prototype is fictional. Optional fields allow `undefined`
 * so a future backend repository can map nullable columns directly.
 */
export type Bi = { en: string; ar: string };

export type OrgType = "government" | "bank" | "business";
export type OrgStatus = "verified" | "pending" | "suspended";
export type ChannelType = "email" | "sms" | "phone" | "website" | "social" | "other";
export type ChannelStatus = "pending" | "verified" | "rejected" | "inactive" | "revoked";
/** Explicit demo persona, never an authenticated production identity. Not persisted. */
export type DemoActor = { role: "viewer" | "org_admin" | "verifier"; orgId?: string };
export type ChannelAction = "add" | "edit" | "submit" | "approve" | "reject" | "deactivate" | "revoke" | "remove";
export interface ChannelAuditEvent {
  id: string;
  orgId: string;
  channelId: string;
  action: ChannelAction | "seed" | "organization_verified" | "organization_suspended" | "organization_removed";
  actor: string;
  at: string;
  type: ChannelType;
  value: string;
  previousValue?: string;
  status: ChannelStatus;
  note: string;
}

export interface Channel {
  id: string;
  type: ChannelType;
  value: string;
  status?: ChannelStatus;
  addedAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface Organization {
  id: string;
  name: Bi;
  type: OrgType;
  domains: string[];
  channels: Channel[];
  status: OrgStatus;
  registeredAt: string;
  verifiedAt?: string | undefined;
  contactEmail: string;
  /** Demo key fingerprint. Placeholder for a future public-key / signature registry. */
  keyFingerprint: string;
}

export type TrustState = "verified" | "unverified" | "suspicious";

export interface SampleMessage {
  id: string;
  channel: ChannelType;
  sender: string;
  claimedOrgId?: string | undefined;
  subject?: Bi | undefined;
  body: Bi;
  url?: string | undefined;
  receivedAt: string;
}

export type AlertStatus = "new" | "investigating" | "escalated" | "confirmed" | "false_positive";
export type Severity = "critical" | "high" | "medium" | "low";
export type IndicatorType = "domain" | "url" | "ip" | "sms_sender" | "phone" | "social_handle" | "email";

export interface Indicator {
  type: IndicatorType;
  value: string;
}

export type EvidenceKind = "message" | "whois" | "dns" | "screenshot" | "report";

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  description: Bi;
  capturedAt: string;
}

export interface CaseNote {
  id: string;
  at: string;
  author: string;
  text: string;
}

export type AlertSource = "simulated_detection" | "public_report" | "lookalike_scan";

export interface ImpersonationAlert {
  id: string;
  caseId: string;
  /** Permanent year-specific display number; caseId remains the legacy reference. */
  reportNumber?: string | undefined;
  title: Bi;
  summary: Bi;
  targetOrgId?: string | undefined;
  severity: Severity;
  riskScore: number;
  status: AlertStatus;
  source: AlertSource;
  detectedAt: string;
  assignee?: string | undefined;
  indicators: Indicator[];
  evidence: Evidence[];
  notes: CaseNote[];
}

export type LookalikeStatus = "monitoring" | "flagged" | "takedown_requested" | "cleared";
export type LookalikeTechnique = "substitution" | "keyword" | "typo" | "combo" | "tld_swap";

export interface LookalikeDomain {
  id: string;
  domain: string;
  targetDomain: string;
  targetOrgId: string;
  technique: LookalikeTechnique;
  similarity: number;
  firstSeen: string;
  registrar: string;
  status: LookalikeStatus;
  source: "seed" | "simulated_scan";
}

export interface DemoState {
  version: number;
  organizations: Organization[];
  messages: SampleMessage[];
  alerts: ImpersonationAlert[];
  lookalikes: LookalikeDomain[];
  channelAudit?: ChannelAuditEvent[];
}
