import type { ChannelType, TrustState } from "@/lib/domain/types";

/** Convenience classification only; registry and detection rules remain unchanged. */
export function recognizeChannel(raw: string): ChannelType | undefined {
  const value = raw.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
  if (/^@[\w.]+$/.test(value)) return "social";
  if (/^\+?[\d\s().-]{7,}$/.test(value) && /^\+?\d{7,15}$/.test(value.replace(/[\s().-]/g, ""))) return "phone";
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(url.hostname) && !/\s/.test(value)) return "website";
  } catch { /* uncertain input stays manually classified */ }
  return undefined;
}

export function registryPresentation(state: TrustState) {
  return { registeredChannel: state === "verified", messageAuthenticated: false as const };
}