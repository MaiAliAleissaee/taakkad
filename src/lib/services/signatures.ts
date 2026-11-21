/**
 * Digital signature extension point.
 * The prototype only derives a demo key fingerprint (SHA-256 via Web Crypto) so the
 * registry has a slot for keys. It is NOT a certificate and proves nothing on its own.
 * A future implementation can register real public keys and verify message signatures.
 */
export interface SignatureService {
  fingerprint(material: string): Promise<string>;
}

export interface MessageSignatureVerifier {
  /** Future: verify a detached signature for a message against the org's registered key. */
  verify(orgId: string, payload: string, signature: string): Promise<boolean>;
}

export const demoSignatureService: SignatureService = {
  async fingerprint(material: string) {
    const bytes = new TextEncoder().encode(material);
    let hex: string[];
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0").toUpperCase());
    } else {
      hex = Array.from(bytes.slice(0, 16)).map((b) => b.toString(16).padStart(2, "0").toUpperCase());
    }
    return `SHA256:${hex.slice(0, 12).join(":")}`;
  },
};
