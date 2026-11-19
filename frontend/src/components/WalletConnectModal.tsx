import React from "react";
import { X, Wallet, ShieldCheck, Building2, UserCheck, AlertTriangle, ExternalLink, Sparkles } from "lucide-react";
import { DEMO_ACCOUNTS } from "../blockchain/ethereum";
import { truncateHex } from "../services/cryptoHash";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectMetaMask: () => Promise<void>;
  onSelectDemoAccount: (key: keyof typeof DEMO_ACCOUNTS) => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  onConnectMetaMask,
  onSelectDemoAccount,
  isConnecting,
  error,
}) => {
  if (!isOpen) return null;

  const hasMetaMask = typeof window !== "undefined" && Boolean(window.ethereum);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Connect Institutional Wallet</h3>
              <p className="text-xs text-slate-500">Select connection method for the demo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Option 1: MetaMask Extension */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Option 1: Browser Extension
            </div>
            <button
              onClick={onConnectMetaMask}
              disabled={isConnecting}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center font-bold text-orange-600">
                  🦊
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                    MetaMask Extension
                  </div>
                  <div className="text-xs text-slate-500">
                    {hasMetaMask ? "Detected in your browser" : "Extension not detected"}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition">
                {isConnecting ? "Connecting..." : "Connect →"}
              </span>
            </button>

            {!hasMetaMask && (
              <p className="mt-1.5 text-[11px] text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                MetaMask not found. You can install it or use the Instant Demo Wallets below!
              </p>
            )}
          </div>

          {/* Option 2: Instant Demo Accounts (Real Hardhat Transactions) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Option 2: Instant Demo Accounts
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Real Blockchain
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              One-click connect to test accounts. Submits genuine signed transactions to the Hardhat smart contract.
            </p>

            <div className="space-y-2">
              {/* Presidency University */}
              <button
                onClick={() => onSelectDemoAccount("presidencyUni")}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Presidency University</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {truncateHex(DEMO_ACCOUNTS.presidencyUni.address, 8, 6)} &bull; Issuer Role
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600">Select</span>
              </button>

              {/* ABC University */}
              <button
                onClick={() => onSelectDemoAccount("abcUni")}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">ABC University</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {truncateHex(DEMO_ACCOUNTS.abcUni.address, 8, 6)} &bull; Cross-Verifier
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600">Select</span>
              </button>

              {/* Consortium Admin */}
              <button
                onClick={() => onSelectDemoAccount("admin")}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 text-left transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Consortium Administrator</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {truncateHex(DEMO_ACCOUNTS.admin.address, 8, 6)} &bull; Admin Role
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-purple-600">Select</span>
              </button>

              {/* Unregistered */}
              <button
                onClick={() => onSelectDemoAccount("unregistered")}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition flex items-center justify-between text-slate-600"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs">🚫</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-700">Unregistered Account</div>
                    <div className="text-[10px] text-slate-400 font-mono">Test unauthorized rejection</div>
                  </div>
                </div>
                <span className="text-xs text-slate-500">Test</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
