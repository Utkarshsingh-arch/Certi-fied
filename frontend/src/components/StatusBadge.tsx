import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import { VerificationStatus } from "../types";

interface StatusBadgeProps {
  status: VerificationStatus | "ACTIVE" | "SUSPENDED";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  switch (status) {
    case "VALID":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 ${className}`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          VERIFIED — AUTHENTIC CERTIFICATE
        </span>
      );
    case "TAMPERED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 ${className}`}
        >
          <XCircle className="w-4 h-4 text-rose-600" />
          VERIFICATION FAILED — DOCUMENT HASH MISMATCH
        </span>
      );
    case "REVOKED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 ${className}`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          CERTIFICATE REVOKED
        </span>
      );
    case "NOT_FOUND":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 ${className}`}
        >
          <HelpCircle className="w-4 h-4 text-slate-500" />
          CERTIFICATE NOT FOUND
        </span>
      );
    case "ACTIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Active
        </span>
      );
    case "SUSPENDED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          Suspended
        </span>
      );
    default:
      return null;
  }
};
