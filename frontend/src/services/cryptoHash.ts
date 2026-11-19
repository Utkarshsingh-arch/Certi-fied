/**
 * Cryptographic utility service using browser native Web Crypto API
 */

/**
 * Calculates SHA-256 hash of an ArrayBuffer or Uint8Array.
 * Returns a 0x-prefixed 64-character hex string (bytes32 compatible).
 */
export async function calculateDocumentHash(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = data instanceof Uint8Array ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data;
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hexString}`;
}

/**
 * Formats a hex address or hash for human-readable display (e.g. 0x1234...5678)
 */
export function truncateHex(hex: string, startChars = 8, endChars = 6): string {
  if (!hex) return "";
  if (hex.length <= startChars + endChars) return hex;
  return `${hex.slice(0, startChars)}...${hex.slice(-endChars)}`;
}
