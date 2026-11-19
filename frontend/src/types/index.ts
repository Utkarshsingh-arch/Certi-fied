export interface Institution {
  name: string;
  wallet: string;
  isRegistered: boolean;
  isActive: boolean;
}

export interface CertificateRecord {
  certificateId: string;
  documentHash: string;
  issuer: string;
  issueTimestamp: number;
  revocationTimestamp: number;
  exists: boolean;
  revoked: boolean;
}

export interface CertificateFormData {
  studentName: string;
  studentRollNumber: string;
  courseName: string;
  graduationYear: string;
  issueDate?: string;
}

export type VerificationStatus =
  | "IDLE"
  | "VERIFYING"
  | "VALID"
  | "TAMPERED"
  | "REVOKED"
  | "NOT_FOUND";

export interface VerificationResult {
  status: VerificationStatus;
  certificate?: CertificateRecord;
  institution?: Institution;
  computedHash?: string;
  details?: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  isAdmin: boolean;
  isIssuer: boolean;
  institution: Institution | null;
  error: string | null;
}
