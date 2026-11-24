/** Saved browser references are hints, never authorization. */
export function publicWorkspaceTarget(saved: string | null, userId: string | undefined, ready: boolean, securityAccess: boolean) {
  return ready && securityAccess && userId && saved === userId ? userId : null;
}