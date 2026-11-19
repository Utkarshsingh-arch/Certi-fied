import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Award, Building2, UserCheck, AlertCircle, LogOut, Wallet } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { truncateHex } from "../services/cryptoHash";
import { LOCAL_CHAIN_ID } from "../blockchain/contractConfig";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const {
    address,
    isConnected,
    isConnecting,
    chainId,
    isAdmin,
    isIssuer,
    institution,
    connectWallet,
    disconnectWallet,
    switchToConsortiumNetwork,
    openConnectModal,
  } = useWallet();

  const isWrongNetwork = isConnected && chainId !== LOCAL_CHAIN_ID;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-emerald-600 rounded-lg group-hover:bg-emerald-700 transition">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Uni<span className="text-emerald-600">Chain</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                  Consortium
                </span>
              </div>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md transition ${
                  location.pathname === "/"
                    ? "text-emerald-600 bg-emerald-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Overview
              </Link>
              <Link
                to="/verify"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition ${
                  location.pathname.startsWith("/verify")
                    ? "text-emerald-600 bg-emerald-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Award className="w-4 h-4" />
                Verify Certificate
              </Link>
              <Link
                to="/issuer"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition ${
                  location.pathname === "/issuer"
                    ? "text-emerald-600 bg-emerald-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Building2 className="w-4 h-4" />
                University Portal
              </Link>
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition ${
                  location.pathname === "/admin"
                    ? "text-emerald-600 bg-emerald-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Consortium Admin
              </Link>
            </div>
          </div>

          {/* Wallet and Role status */}
          <div className="flex items-center gap-3">
            {isWrongNetwork && (
              <button
                onClick={switchToConsortiumNetwork}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition"
                title="Switch to Hardhat Local (31337)"
              >
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Switch to Chain 31337</span>
              </button>
            )}

            {isConnected && address ? (
              <div className="flex items-center gap-2">
                {/* Role indicator */}
                {isAdmin && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                    Consortium Admin
                  </span>
                )}
                {isIssuer && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {institution?.name || "Authorized Issuer"}
                  </span>
                )}
                {!isAdmin && !isIssuer && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Unregistered Wallet
                  </span>
                )}

                {/* Account address pill */}
                <button
                  onClick={openConnectModal}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 transition"
                  title="Click to Switch Account"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span title={address}>{truncateHex(address, 6, 4)}</span>
                </button>

                {/* Disconnect button */}
                <button
                  onClick={disconnectWallet}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-70"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
