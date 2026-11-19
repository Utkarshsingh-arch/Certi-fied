import QRCode from "qrcode";

/**
 * Generates the verification URL for a given certificate ID.
 */
export function getVerificationUrl(certificateId: string): string {
  const baseUrl =
    (import.meta.env.VITE_APP_BASE_URL as string) ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");
  return `${baseUrl.replace(/\/$/, "")}/verify/${encodeURIComponent(certificateId)}`;
}

/**
 * Generates a high-resolution QR code data URL (PNG) for a verification link.
 */
export async function generateQrCodeDataUrl(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#0f172a", // deep navy
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}
