import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Award,
  Building2,
  FileCheck,
  Hash,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Layers,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";

export const LandingPage: React.FC = () => {
  const { isConnected, connectWallet } = useWallet();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            Consortium Blockchain Architecture
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Decentralized Inter-University <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              Certificate Verification
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            UniChain eliminates centralized trust and delays in academic credential verification.
            Universities register cryptographic SHA-256 document fingerprints directly on an Ethereum-compatible
            consortium smart contract. Verifiers authenticate credentials instantly without contacting the issuing institution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/verify"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 text-base"
            >
              <Award className="w-5 h-5" />
              Verify a Certificate
            </Link>

            <Link
              to="/issuer"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 text-base"
            >
              <Building2 className="w-5 h-5 text-emerald-400" />
              University Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Consortium Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
            Academic Proof-of-Concept
          </h2>
          <p className="text-3xl font-bold text-slate-900">
            How UniChain Solves Academic Credential Fraud
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
              <Hash className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Off-Chain PII & On-Chain Hashes</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Zero student personal data is stored on-chain. The student’s certificate PDF is generated locally, and only its SHA-256 cryptographic digest is committed to the blockchain.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Role-Based Wallet Authorization</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Smart contract enforces <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">ISSUER_ROLE</code>. Only active, registered university institutional wallets can issue or revoke certificates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cross-University Verification</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              University B can verify a certificate issued by University A without accessing University A's internal database or requesting manual confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Workflow Diagram */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Architecture Workflow
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              The 4-Step End-to-End Cycle
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <span className="text-4xl font-extrabold text-slate-200 absolute top-4 right-4">01</span>
              <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Issue & Generate PDF</h4>
              <p className="text-xs text-slate-600">
                Authorized university generates the official certificate with dynamic QR code using <code className="text-[10px] bg-slate-100 px-1">pdf-lib</code>.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <span className="text-4xl font-extrabold text-slate-200 absolute top-4 right-4">02</span>
              <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Compute SHA-256</h4>
              <p className="text-xs text-slate-600">
                Browser Web Crypto API calculates the cryptographic SHA-256 hash of the exact finalized PDF bytes.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <span className="text-4xl font-extrabold text-slate-200 absolute top-4 right-4">03</span>
              <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Commit On-Chain</h4>
              <p className="text-xs text-slate-600">
                University signs transaction via MetaMask calling <code className="text-[10px] bg-slate-100 px-1">issueCertificate()</code> on Hardhat.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <span className="text-4xl font-extrabold text-slate-200 absolute top-4 right-4">04</span>
              <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold mb-3">
                4
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Zero-Trust Verification</h4>
              <p className="text-xs text-slate-600">
                Any third party uploads the PDF; the hash is compared directly against the smart contract to guarantee authenticity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Walkthrough Quickcard */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 border border-slate-700 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-700">
            <div>
              <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider">Evaluation Guide</span>
              <h3 className="text-2xl font-bold mt-1">Ready for Project Demonstration</h3>
            </div>
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition"
              >
                Connect MetaMask
              </button>
            ) : (
              <Link
                to="/issuer"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition flex items-center gap-2"
              >
                Open Issuer Portal <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-6 pt-6 text-sm">
            <div>
              <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Demonstration Accounts (Hardhat)
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                <li><span className="text-slate-400">Admin (Acc #0):</span> 0xf39Fd6e5...2266</li>
                <li><span className="text-slate-400">Presidency Uni (Acc #1):</span> 0x70997970...79C8</li>
                <li><span className="text-slate-400">ABC University (Acc #2):</span> 0x3C44CdDdB...1429</li>
              </ul>
            </div>

            <div>
              <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Key Evaluation Tests
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>1. Cross-University Verification (Presidency issues, ABC verifies).</li>
                <li>2. Cryptographic Tamper Detection (Hash mismatch).</li>
                <li>3. Immediate On-Chain Certificate Revocation.</li>
                <li>4. Rejection of Unauthorized Issuers.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
