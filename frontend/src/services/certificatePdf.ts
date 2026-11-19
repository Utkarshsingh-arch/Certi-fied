import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { CertificateFormData } from "../types";
import { generateQrCodeDataUrl, getVerificationUrl } from "./qrCode";

export interface GeneratePdfOptions {
  formData: CertificateFormData;
  universityName: string;
  issuerWallet: string;
  certificateId: string;
}

/**
 * Generates an official, beautifully styled academic certificate PDF with embedded QR code.
 * Returns the exact Uint8Array bytes of the generated PDF.
 */
export async function generateCertificatePdf(options: GeneratePdfOptions): Promise<Uint8Array> {
  const { formData, universityName, issuerWallet, certificateId } = options;

  // Create a new PDF document in Landscape A4 (841.89 x 595.28 points)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  // Embed standard fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Elegant colors
  const primaryNavy = rgb(15 / 255, 23 / 255, 42 / 255);       // #0f172a
  const accentGold = rgb(197 / 255, 160 / 255, 89 / 255);      // #c5a059
  const accentEmerald = rgb(22 / 255, 163 / 255, 74 / 255);    // #16a34a
  const mutedGray = rgb(100 / 255, 116 / 255, 139 / 255);      // #64748b
  const borderLight = rgb(226 / 255, 232 / 255, 240 / 255);   // #e2e8f0

  // 1. Double Border
  // Outer decorative border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: accentGold,
    borderWidth: 3,
  });

  // Inner border
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: borderLight,
    borderWidth: 1,
  });

  // Corner flourishes (squares at corners)
  const cornerSize = 14;
  page.drawRectangle({ x: 23, y: height - 37, width: cornerSize, height: cornerSize, color: accentGold });
  page.drawRectangle({ x: width - 37, y: height - 37, width: cornerSize, height: cornerSize, color: accentGold });
  page.drawRectangle({ x: 23, y: 23, width: cornerSize, height: cornerSize, color: accentGold });
  page.drawRectangle({ x: width - 37, y: 23, width: cornerSize, height: cornerSize, color: accentGold });

  // 2. Header & Consortium Badge
  const consortiumText = "UNICHAIN CONSORTIUM BLOCKCHAIN REGISTRY";
  const consortiumTextWidth = fontBold.widthOfTextAtSize(consortiumText, 9);
  page.drawText(consortiumText, {
    x: (width - consortiumTextWidth) / 2,
    y: height - 58,
    size: 9,
    font: fontBold,
    color: accentEmerald,
  });

  // University Name
  const uniNameUpper = universityName.toUpperCase();
  const uniNameWidth = fontTimes.widthOfTextAtSize(uniNameUpper, 24);
  page.drawText(uniNameUpper, {
    x: (width - uniNameWidth) / 2,
    y: height - 92,
    size: 24,
    font: fontTimes,
    color: primaryNavy,
  });

  // Subtitle
  const subtitle = "CERTIFICATE OF DEGREE COMPLETION";
  const subtitleWidth = fontBold.widthOfTextAtSize(subtitle, 15);
  page.drawText(subtitle, {
    x: (width - subtitleWidth) / 2,
    y: height - 122,
    size: 15,
    font: fontBold,
    color: accentGold,
  });

  // Decorative divider line
  page.drawLine({
    start: { x: width / 2 - 120, y: height - 134 },
    end: { x: width / 2 + 120, y: height - 134 },
    thickness: 1.5,
    color: accentGold,
  });

  // 3. Body Text
  const thisCertifies = "This is to certify that";
  const thisCertifiesWidth = fontOblique.widthOfTextAtSize(thisCertifies, 13);
  page.drawText(thisCertifies, {
    x: (width - thisCertifiesWidth) / 2,
    y: height - 170,
    size: 13,
    font: fontOblique,
    color: mutedGray,
  });

  // Student Name
  const studentNameUpper = formData.studentName.toUpperCase();
  const studentNameWidth = fontBold.widthOfTextAtSize(studentNameUpper, 28);
  page.drawText(studentNameUpper, {
    x: (width - studentNameWidth) / 2,
    y: height - 212,
    size: 28,
    font: fontBold,
    color: primaryNavy,
  });

  // Roll Number
  const rollText = `Student Identification / Roll No: ${formData.studentRollNumber}`;
  const rollTextWidth = fontRegular.widthOfTextAtSize(rollText, 11);
  page.drawText(rollText, {
    x: (width - rollTextWidth) / 2,
    y: height - 235,
    size: 11,
    font: fontRegular,
    color: mutedGray,
  });

  // Fulfillment text
  const fulfillment = "has successfully completed the prescribed curriculum and fulfilled all academic requirements for the award of";
  const fulfillmentWidth = fontRegular.widthOfTextAtSize(fulfillment, 11);
  page.drawText(fulfillment, {
    x: (width - fulfillmentWidth) / 2,
    y: height - 268,
    size: 11,
    font: fontRegular,
    color: mutedGray,
  });

  // Degree / Course Name
  const degreeUpper = formData.courseName.toUpperCase();
  const degreeWidth = fontBold.widthOfTextAtSize(degreeUpper, 20);
  page.drawText(degreeUpper, {
    x: (width - degreeWidth) / 2,
    y: height - 302,
    size: 20,
    font: fontBold,
    color: primaryNavy,
  });

  // Graduation Year
  const yearText = `Class of ${formData.graduationYear}`;
  const yearTextWidth = fontBold.widthOfTextAtSize(yearText, 13);
  page.drawText(yearText, {
    x: (width - yearTextWidth) / 2,
    y: height - 326,
    size: 13,
    font: fontBold,
    color: accentGold,
  });

  // 4. Generate & Embed QR Code
  const verificationUrl = getVerificationUrl(certificateId);
  const qrDataUrl = await generateQrCodeDataUrl(verificationUrl);
  const qrImage = await pdfDoc.embedPng(qrDataUrl);
  const qrSize = 96;

  page.drawImage(qrImage, {
    x: 60,
    y: 54,
    width: qrSize,
    height: qrSize,
  });

  // QR label
  page.drawText("Scan to verify on-chain", {
    x: 60,
    y: 42,
    size: 7.5,
    font: fontRegular,
    color: mutedGray,
  });

  // 5. Digital Registration & Verification Details (Bottom Center & Right)
  const issueDateStr = formData.issueDate || new Date().toISOString().split("T")[0];

  // Details box
  page.drawText("AUTHENTICITY & BLOCKCHAIN REGISTRATION METADATA", {
    x: 180,
    y: 132,
    size: 8,
    font: fontBold,
    color: accentEmerald,
  });

  page.drawText(`Certificate ID: ${certificateId}`, {
    x: 180,
    y: 114,
    size: 9,
    font: fontBold,
    color: primaryNavy,
  });

  page.drawText(`Issue Date: ${issueDateStr}`, {
    x: 180,
    y: 98,
    size: 8.5,
    font: fontRegular,
    color: mutedGray,
  });

  page.drawText(`Issuing Institutional Wallet: ${issuerWallet}`, {
    x: 180,
    y: 82,
    size: 8,
    font: fontRegular,
    color: mutedGray,
  });

  page.drawText("Registry Smart Contract: Immutable SHA-256 Digest on UniChain Consortium Network", {
    x: 180,
    y: 66,
    size: 7.5,
    font: fontOblique,
    color: mutedGray,
  });

  // Signatures on right
  page.drawLine({
    start: { x: width - 210, y: 84 },
    end: { x: width - 60, y: 84 },
    thickness: 1,
    color: mutedGray,
  });

  const signTitle = "Registrar / Authorized Signatory";
  const signTitleWidth = fontRegular.widthOfTextAtSize(signTitle, 9);
  page.drawText(signTitle, {
    x: width - 210 + (150 - signTitleWidth) / 2,
    y: 70,
    size: 9,
    font: fontRegular,
    color: mutedGray,
  });

  const uniSign = universityName;
  const uniSignWidth = fontBold.widthOfTextAtSize(uniSign, 9);
  page.drawText(uniSign, {
    x: width - 210 + (150 - uniSignWidth) / 2,
    y: 56,
    size: 9,
    font: fontBold,
    color: primaryNavy,
  });

  // Save and return the exact PDF bytes
  return await pdfDoc.save();
}

/**
 * Triggers a download of the PDF in the browser.
 */
export function downloadPdf(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
