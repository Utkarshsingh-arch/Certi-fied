import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Hash,
  Building2,
  Calendar,
  Wallet,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  getCertificateRecord,
  getInstitutionRecord,
  getContractAddress,
} from "../blockchain/ethereum";
import { calculateDocumentHash, truncateHex } from "../services/cryptoHash";
import { CertificateRecord, Institution, VerificationResult, VerificationStatus } from "../types";
import { StatusBadge } from "../components/StatusBadge";

export const VerificationPage: React.FC = () => {
  const { certificateId: routeCertId } = useParams<{ certificateId?: string }>();
  const navigate = useNavigate();

  const [inputCertId, setInputCertId] = useState<string>(routeCertId || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedFileHash, setComputedFileHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (routeCertId) {
      setInputCertId(routeCertId);
    }
  }, [routeCertId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        setErrorMsg("Please upload a valid PDF certificate file.");
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
      setResult(null);

      // Pre-calculate hash on selection
      try {
        const arrayBuffer = await file.arrayBuffer();
        const hash = await calculateDocumentHash(arrayBuffer);
        setComputedFileHash(hash);
      } catch (err) {
        console.error("Error hashing file:", err);
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const certIdToVerify = inputCertId.trim();

    if (!certIdToVerify) {
      setErrorMsg("Please enter or scan a Certificate ID.");
      return;
    }

    if (!selectedFile) {
      setErrorMsg("Please upload the original certificate PDF document to verify its cryptographic integrity.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setResult(null);

    try {
      // 1. Calculate document SHA-256 hash using Web Crypto API
      const arrayBuffer = await selectedFile.arrayBuffer();
      const currentDocHash = await calculateDocumentHash(arrayBuffer);
      setComputedFileHash(currentDocHash);

      // 2. Query Smart Contract for certificate record
      const certRecord: CertificateRecord | null = await getCertificateRecord(certIdToVerify);

      // CASE D: NOT FOUND
      if (!certRecord || !certRecord.exists) {
        setResult({
          status: "NOT_FOUND",
          computedHash: currentDocHash,
          details: `The certificate ID "${certIdToVerify}" does not exist in the UniChain consortium smart contract registry.`,
        });
        setIsVerifying(false);
        return;
      }

      // Query issuing institution
      const instRecord: Institution | null = await getInstitutionRecord(certRecord.issuer);

      const hashesMatch =
        certRecord.documentHash.toLowerCase() === currentDocHash.toLowerCase();

      // CASE C: REVOKED (checked before or alongside validity; revoked certificates are never valid)
      if (certRecord.revoked) {
        setResult({
          status: "REVOKED",
          certificate: certRecord,
          institution: instRecord || undefined,
          computedHash: currentDocHash,
          details: `This certificate was explicitly revoked by ${
            instRecord?.name || certRecord.issuer
          } on ${new Date(certRecord.revocationTimestamp * 1000).toLocaleString()}. Even with an intact document hash, revoked credentials are non-verifiable.`,
        });
      } else if (!hashesMatch) {
        // CASE B: TAMPERED
        setResult({
          status: "TAMPERED",
          certificate: certRecord,
          institution: instRecord || undefined,
          computedHash: currentDocHash,
          details:
            "CRITICAL INTEGRITY FAILURE: The cryptographic SHA-256 fingerprint of the uploaded document does not match the immutable fingerprint stored on-chain. This file has been altered, forged, or edited after initial issuance.",
        });
      } else {
        // CASE A: VALID
        setResult({
          status: "VALID",
          certificate: certRecord,
          institution: instRecord || undefined,
          computedHash: currentDocHash,
          details:
            "CRYPTOGRAPHICALLY VERIFIED: The uploaded document perfectly matches the on-chain SHA-256 cryptographic fingerprint, issued by an authorized consortium member institution.",
        });
      }
    } catch (err: any) {
      console.error("Verification process error:", err);
      setErrorMsg(err?.message || "Failed to query the blockchain registry. Ensure local node is running.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setComputedFileHash(null);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Zero-Trust Cryptographic Verification
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Verify Academic Certificate
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto">
          Authenticate credentials directly against the UniChain smart contract. No login or wallet required for public verification.
        </p>
      </div>

      {/* Verification Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <form onSubmit={handleVerify} className="p-6 sm:p-8 space-y-6">
          {/* Certificate ID input */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Certificate Identifier (ID)
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputCertId}
                onChange={(e) => setInputCertId(e.target.value)}
                placeholder="e.g. UC-2026-RahulSharma-001 or 0x..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Extracted automatically when opened via QR code, or enter manually.
            </p>
          </div>

          {/* PDF Upload */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Upload Original Certificate PDF
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-emerald-500 transition bg-slate-50">
              <div className="space-y-2 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-400" />
                <div className="flex text-sm text-slate-600">
                  <label
                    htmlFor="pdf-upload"
                    className="relative cursor-pointer font-semibold text-emerald-600 hover:text-emerald-500 focus-within:outline-none"
                  >
                    <span>Upload PDF document</span>
                    <input
                      id="pdf-upload"
                      name="pdf-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedFile ? (
                    <span className="font-semibold text-slate-800">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    "Official UniChain issued PDF certificate"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Computed hash preview if file selected */}
          {computedFileHash && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-700 mb-1">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span>Uploaded Document SHA-256 Digest (Client Web Crypto):</span>
              </div>
              <div className="font-mono text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                {computedFileHash}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isVerifying || !inputCertId.trim() || !selectedFile}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Querying Registry Smart Contract...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Verify Authenticity</span>
                </>
              )}
            </button>

            {(selectedFile || result) && (
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Verification Result Display */}
      {result && (
        <div
          className={`rounded-2xl border p-6 sm:p-8 shadow-md transition-all ${
            result.status === "VALID"
              ? "bg-emerald-50/50 border-emerald-300"
              : result.status === "TAMPERED"
              ? "bg-rose-50/50 border-rose-300"
              : result.status === "REVOKED"
              ? "bg-amber-50/50 border-amber-300"
              : "bg-slate-50 border-slate-300"
          }`}
        >
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Registry Verification Verdict
              </div>
              <StatusBadge status={result.status} className="text-sm px-4 py-1.5" />
            </div>

            {result.certificate && (
              <div className="text-right text-xs text-slate-500">
                <div>Registry Block Timestamp:</div>
                <div className="font-mono font-semibold text-slate-800">
                  {new Date(result.certificate.issueTimestamp * 1000).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Explanation Text */}
          <div className="py-4 text-sm text-slate-700 leading-relaxed font-medium">
            {result.details}
          </div>

          {/* Metadata Cards */}
          {result.certificate && (
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/80">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Issuing Academic Institution:</span>
                </div>
                <div className="font-bold text-slate-900 text-base">
                  {result.institution?.name || "Registered Consortium University"}
                </div>
                <div className="text-xs font-mono text-slate-500 mt-1">
                  Issuer Wallet: {truncateHex(result.certificate.issuer, 10, 8)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Issuance Record:</span>
                </div>
                <div className="text-sm text-slate-800 font-semibold">
                  {new Date(result.certificate.issueTimestamp * 1000).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Revocation Status:{" "}
                  {result.certificate.revoked ? (
                    <span className="text-amber-700 font-bold">Revoked</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">Good Standing</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hash Comparison Box */}
          <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Cryptographic Fingerprint Audit
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-0.5">Uploaded File SHA-256 Digest:</div>
              <div className="font-mono text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-800 break-all">
                {result.computedHash}
              </div>
            </div>

            {result.certificate && (
              <div>
                <div className="text-xs text-slate-500 mb-0.5">On-Chain Registered Document Hash:</div>
                <div
                  className={`font-mono text-xs p-2 rounded border break-all ${
                    result.computedHash?.toLowerCase() ===
                    result.certificate.documentHash.toLowerCase()
                      ? "bg-emerald-50/50 border-emerald-300 text-emerald-900"
                      : "bg-rose-50/50 border-rose-300 text-rose-900 font-bold"
                  }`}
                >
                  {result.certificate.documentHash}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
