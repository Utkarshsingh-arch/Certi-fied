import React from "react";
import { Shield, ExternalLink, Cpu } from "lucide-react";
import { getContractAddress } from "../blockchain/ethereum";
import { truncateHex } from "../services/cryptoHash";

export const Footer: React.FC = () => {
  const contractAddress = getContractAddress();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-sm py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-slate-200">UniChain Certificate Registry</div>
            <div className="text-xs text-slate-400">
              Academic Blockchain Consortium System &bull; Inter-University Verification
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Registry Contract:</span>
            <span className="font-mono text-emerald-300" title={contractAddress}>
              {truncateHex(contractAddress, 10, 6)}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <span>Network: Hardhat Local (31337)</span>
            <span>&bull;</span>
            <span>Zero-Trust SHA-256</span>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} UniChain Consortium. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
