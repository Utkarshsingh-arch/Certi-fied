import React, { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Building2,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  Power,
  Users,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  getAllInstitutions,
  registerInstitutionOnChain,
  setInstitutionActiveOnChain,
} from "../blockchain/ethereum";
import { Institution } from "../types";
import { truncateHex } from "../services/cryptoHash";
import { StatusBadge } from "../components/StatusBadge";

export const AdminDashboard: React.FC = () => {
  const { address, isConnected, isAdmin, connectWallet, selectDemoAccount } = useWallet();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newInstName, setNewInstName] = useState<string>("");
  const [newInstWallet, setNewInstWallet] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [togglingWallet, setTogglingWallet] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchInstitutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getAllInstitutions();
      setInstitutions(list);
    } catch (err) {
      console.error("Failed to load institutions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim() || !newInstWallet.trim()) {
      setMessage({ type: "error", text: "Please enter both university name and wallet address." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const txHash = await registerInstitutionOnChain(newInstWallet.trim(), newInstName.trim());
      setMessage({
        type: "success",
        text: `Institution "${newInstName}" successfully registered! Transaction: ${truncateHex(txHash, 10, 8)}`,
      });
      setNewInstName("");
      setNewInstWallet("");
      await fetchInstitutions();
    } catch (err: any) {
      console.error("Registration error:", err);
      setMessage({
        type: "error",
        text: err?.reason || err?.message || "Failed to register institution on blockchain.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (inst: Institution) => {
    const actionName = inst.isActive ? "SUSPEND" : "ACTIVATE";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionName} "${inst.name}"? Suspended universities cannot issue new certificates.`
    );
    if (!confirmed) return;

    setTogglingWallet(inst.wallet);
    setMessage(null);

    try {
      await setInstitutionActiveOnChain(inst.wallet, !inst.isActive);
      await fetchInstitutions();
      setMessage({
        type: "success",
        text: `Successfully updated status for ${inst.name}.`,
      });
    } catch (err: any) {
      console.error("Status update error:", err);
      setMessage({
        type: "error",
        text: err?.reason || err?.message || "Failed to update institution status.",
      });
    } finally {
      setTogglingWallet(null);
    }
  };

  // If disconnected
  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <UserCheck className="w-16 h-16 text-slate-400 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-slate-900">Consortium Admin Portal</h2>
          <p className="text-slate-600 max-w-md mx-auto text-sm">
            Please connect the Consortium Administrator account to manage participating universities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={connectWallet}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
            >
              Connect Wallet
            </button>
            <button
              onClick={() => selectDemoAccount("admin")}
              className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Instant Connect (Consortium Admin)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If connected but NOT admin
  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-900 mb-2">Admin Authorization Required</h2>
          <p className="text-amber-700 mb-4 text-sm max-w-md mx-auto">
            The connected wallet (<span className="font-mono text-xs">{address}</span>) does not possess the{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">DEFAULT_ADMIN_ROLE</code>.
          </p>
          <div className="bg-white p-4 rounded-xl border border-amber-200 text-left max-w-md mx-auto text-xs text-slate-700">
            <span className="font-bold text-slate-900">Switch Account in MetaMask:</span>
            <p className="mt-1">
              Select the Hardhat Account #0 (deployer):{" "}
              <code className="font-mono text-[11px] bg-slate-100 px-1">
                0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl text-purple-700">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Consortium Administration</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                Administrator
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500 mt-1">
              Connected Admin: {address}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
            <div className="text-xs text-slate-500 font-medium">Registered Universities</div>
            <div className="text-2xl font-extrabold text-slate-900">{institutions.length}</div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>{message.text}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Register New Institution Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Register University</h2>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Registering an institution creates its on-chain identity and grants its authorized wallet the{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ISSUER_ROLE</code>.
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                University Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cambridge University"
                value={newInstName}
                onChange={(e) => setNewInstName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Authorized Wallet Address
              </label>
              <input
                type="text"
                required
                placeholder="0x..."
                value={newInstWallet}
                onChange={(e) => setNewInstWallet(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering on Smart Contract...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Institution</span>
                </>
              )}
            </button>
          </form>

          {/* Quick presets for demo */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Demo Presets (Hardhat)
            </span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewInstName("Presidency University");
                  setNewInstWallet("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
                }}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs border border-slate-200 transition"
              >
                <span className="font-semibold text-slate-800">Presidency University</span>
                <span className="block font-mono text-[10px] text-slate-500">
                  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewInstName("ABC University");
                  setNewInstWallet("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
                }}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs border border-slate-200 transition"
              >
                <span className="font-semibold text-slate-800">ABC University</span>
                <span className="block font-mono text-[10px] text-slate-500">
                  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Registered Institutions List */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Participating Universities</h2>
            </div>
            <button
              onClick={fetchInstitutions}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {institutions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {isLoading ? "Querying smart contract registry..." : "No institutions registered yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {institutions.map((inst, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{inst.name}</span>
                      <StatusBadge status={inst.isActive ? "ACTIVE" : "SUSPENDED"} />
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      Wallet: {inst.wallet}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(inst)}
                    disabled={togglingWallet === inst.wallet}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      inst.isActive
                        ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>
                      {togglingWallet === inst.wallet
                        ? "Updating..."
                        : inst.isActive
                        ? "Suspend Issuer"
                        : "Activate Issuer"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
