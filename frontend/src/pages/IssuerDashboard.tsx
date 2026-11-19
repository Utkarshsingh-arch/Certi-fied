import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Award,
  FilePlus,
  ShieldCheck,
  ShieldAlert,
  Download,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  History,
  CheckCircle,
  Hash,
  XCircle,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  issueCertificateOnChain,
  revokeCertificateOnChain,
  getIssuedCertificateHistory,
} from "../blockchain/ethereum";
import { generateCertificatePdf, downloadPdf } from "../services/certificatePdf";
import { calculateDocumentHash, truncateHex } from "../services/cryptoHash";
import { CertificateFormData } from "../types";

export const IssuerDashboard: React.FC = () => {
  const { address, isConnected, isIssuer, institution, connectWallet } = useWallet();

  // Form state
  const [formData, setFormData] = useState<CertificateFormData>({
    studentName: "",
    studentRollNumber: "",
    courseName: "",
    graduationYear: new Date().getFullYear().toString(),
  });

  const [customCertId, setCustomCertId] = useState<string>("");
  const [isIssuing, setIsIssuing] = useState<boolean>(false);
  const [issuedResult, setIssuedResult] = useState<{
    certificateId: string;
    documentHash: string;
    txHash: string;
    pdfBytes: Uint8Array;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [revokingCertId, setRevokingCertId] = useState<string | null>(null);

  // Generate a clean default certificate ID
  const generateNewCertId = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `UC-${new Date().getFullYear()}-${randomSuffix}`;
  };

  useEffect(() => {
    setCustomCertId(generateNewCertId());
  }, []);

  const loadHistory = useCallback(async () => {
    if (!address) return;
    setIsLoadingHistory(true);
    try {
      const history = await getIssuedCertificateHistory(address);
      setHistoryList(history);
    } catch (err) {
      console.error("Error loading certificate history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && isIssuer && address) {
      loadHistory();
    }
  }, [isConnected, isIssuer, address, loadHistory]);

  const handleFillDemoData = () => {
    setFormData({
      studentName: "Rahul Sharma",
      studentRollNumber: "PU-2026-CSE-104",
      courseName: "Bachelor of Technology in Computer Science & Engineering",
      graduationYear: "2026",
    });
    setCustomCertId(`UC-2026-RAHUL-${Math.floor(100 + Math.random() * 900)}`);
    setErrorMsg(null);
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !institution) {
      setErrorMsg("Please connect an authorized university wallet first.");
      return;
    }

    if (!formData.studentName.trim() || !formData.studentRollNumber.trim() || !formData.courseName.trim()) {
      setErrorMsg("Please fill out all student and credential fields.");
      return;
    }

    const certId = customCertId.trim() || generateNewCertId();
    setIsIssuing(true);
    setErrorMsg(null);
    setIssuedResult(null);

    try {
      // Step 1: Generate PDF with embedded QR code
      const pdfBytes = await generateCertificatePdf({
        formData,
        universityName: institution.name,
        issuerWallet: address,
        certificateId: certId,
      });

      // Step 2: Compute SHA-256 hash of final PDF bytes using Web Crypto API
      const docHash = await calculateDocumentHash(pdfBytes);

      // Step 3: Record on blockchain via MetaMask transaction
      const { txHash } = await issueCertificateOnChain(certId, docHash);

      // Step 4: Success - download and display
      setIssuedResult({
        certificateId: certId,
        documentHash: docHash,
        txHash,
        pdfBytes,
      });

      // Auto trigger download for user convenience
      downloadPdf(pdfBytes, `${certId}-${formData.studentName.replace(/\s+/g, "_")}.pdf`);

      // Refresh history
      await loadHistory();

      // Reset ID for next issuance
      setCustomCertId(generateNewCertId());
    } catch (err: any) {
      console.error("Issuance failed:", err);
      // Clean up common MetaMask rejection errors
      if (err?.code === "ACTION_REJECTED" || err?.message?.includes("user rejected")) {
        setErrorMsg("Transaction was rejected in MetaMask.");
      } else {
        setErrorMsg(err?.reason || err?.message || "Failed to commit certificate to blockchain.");
      }
    } finally {
      setIsIssuing(false);
    }
  };

  const handleRevoke = async (certId: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently REVOKE certificate "${certId}"? This action is recorded on the blockchain and cannot be undone.`
    );
    if (!confirmed) return;

    setRevokingCertId(certId);
    try {
      await revokeCertificateOnChain(certId);
      await loadHistory();
    } catch (err: any) {
      console.error("Revocation failed:", err);
      alert(err?.reason || err?.message || "Failed to revoke certificate on blockchain.");
    } finally {
      setRevokingCertId(null);
    }
  };

  // 1. If not connected
  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">University Issuer Portal</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm">
            Please connect your authorized institutional MetaMask wallet to issue and manage academic certificates.
          </p>
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
          >
            Connect University Wallet
          </button>
        </div>
      </div>
    );
  }

  // 2. If connected but NOT an authorized issuer
  if (!isIssuer) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-rose-900 mb-2">Access Denied: Unauthorized Account</h2>
          <p className="text-rose-700 mb-4 text-sm max-w-md mx-auto">
            The connected wallet (<span className="font-mono text-xs">{address}</span>) has not been granted the{" "}
            <code className="bg-rose-100 px-1 py-0.5 rounded font-mono font-bold">ISSUER_ROLE</code> on the UniChain
            consortium smart contract.
          </p>
          <div className="bg-white p-4 rounded-xl border border-rose-200 text-left max-w-lg mx-auto text-xs text-slate-700 space-y-2">
            <div className="font-bold text-slate-900">How to proceed for the demonstration:</div>
            <div>
              1. In MetaMask, switch to one of the pre-authorized demonstration accounts:
            </div>
            <ul className="list-disc pl-5 font-mono text-[11px] text-slate-600 space-y-1">
              <li>Presidency University: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8</li>
              <li>ABC University: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC</li>
            </ul>
            <div>
              2. Or switch to the Consortium Admin account (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) to register your current wallet.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Institution Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{institution?.name}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Active Consortium Issuer
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500 mt-1">
              Wallet Address: {address}
            </div>
          </div>
        </div>

        <button
          onClick={handleFillDemoData}
          className="self-start md:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition"
        >
          &bull; Autofill Demo Student (Rahul Sharma)
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Certificate Issuance Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <FilePlus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Issue New Academic Certificate</h2>
          </div>

          <form onSubmit={handleIssueCertificate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Student Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Roll / Registration No.
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PU-2026-CSE-104"
                  value={formData.studentRollNumber}
                  onChange={(e) => setFormData({ ...formData, studentRollNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Graduation Year
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Degree / Course Program
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bachelor of Technology in Computer Science & Engineering"
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Unique Certificate ID
              </label>
              <input
                type="text"
                required
                value={customCertId}
                onChange={(e) => setCustomCertId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Deterministically converted to <code className="text-[10px] bg-slate-100 px-1">bytes32</code> for on-chain uniqueness.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isIssuing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isIssuing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing & Mining Blockchain Transaction...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Generate Certificate & Commit On-Chain</span>
                </>
              )}
            </button>
          </form>

          {/* Success Callout */}
          {issuedResult && (
            <div className="mt-6 p-5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Certificate Successfully Issued on Blockchain!</span>
              </div>

              <div className="text-xs text-slate-700 space-y-1 font-mono">
                <div>
                  <span className="font-semibold text-slate-500">Certificate ID:</span> {issuedResult.certificateId}
                </div>
                <div className="break-all">
                  <span className="font-semibold text-slate-500">Document Hash (SHA-256):</span> {issuedResult.documentHash}
                </div>
                <div className="break-all">
                  <span className="font-semibold text-slate-500">Transaction Hash:</span> {issuedResult.txHash}
                </div>
              </div>

              <button
                onClick={() =>
                  downloadPdf(
                    issuedResult.pdfBytes,
                    `${issuedResult.certificateId}-${formData.studentName.replace(/\s+/g, "_")}.pdf`
                  )
                }
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Generated PDF Again</span>
              </button>
            </div>
          )}
        </div>

        {/* Certificate Issuance History */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Issuance History</h2>
            </div>
            <button
              onClick={loadHistory}
              disabled={isLoadingHistory}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Refresh Event Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? "animate-spin" : ""}`} />
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Historical events emitted directly by the smart contract for this university wallet.
          </p>

          {historyList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {isLoadingHistory ? "Querying smart contract events..." : "No certificates issued by this wallet yet."}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {historyList.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                    item.isRevoked
                      ? "bg-amber-50/60 border-amber-200"
                      : "bg-slate-50 border-slate-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800 break-all">
                      {truncateHex(item.certificateId, 12, 8)}
                    </span>
                    {item.isRevoked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Revoked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono break-all">
                    Hash: {truncateHex(item.documentHash, 14, 8)}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                    <span>
                      {item.timestamp ? new Date(item.timestamp * 1000).toLocaleDateString() : "Registered"}
                    </span>

                    {!item.isRevoked && (
                      <button
                        onClick={() => handleRevoke(item.certificateId)}
                        disabled={revokingCertId === item.certificateId}
                        className="text-rose-600 hover:text-rose-800 font-semibold transition"
                      >
                        {revokingCertId === item.certificateId ? "Revoking..." : "Revoke Certificate"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
