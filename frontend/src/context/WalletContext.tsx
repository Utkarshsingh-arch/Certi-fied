import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ethers, BrowserProvider, Wallet } from "ethers";
import { Institution, WalletState } from "../types";
import {
  fetchUserRoles,
  switchOrAddNetwork,
  DEMO_ACCOUNTS,
  setActiveDemoWallet,
  getReadOnlyProvider,
} from "../blockchain/ethereum";
import { LOCAL_CHAIN_ID } from "../blockchain/contractConfig";
import { WalletConnectModal } from "../components/WalletConnectModal";

interface WalletContextType extends WalletState {
  connectWallet: () => void;
  disconnectWallet: () => void;
  refreshState: () => Promise<void>;
  switchToConsortiumNetwork: () => Promise<void>;
  openConnectModal: () => void;
  selectDemoAccount: (key: keyof typeof DEMO_ACCOUNTS) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isIssuer, setIsIssuer] = useState<boolean>(false);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadAccountData = useCallback(async (account: string) => {
    try {
      const roles = await fetchUserRoles(account);
      setIsAdmin(roles.isAdmin);
      setIsIssuer(roles.isIssuer);
      setInstitution(roles.institution);
    } catch (err: any) {
      console.error("Error loading account data:", err);
    }
  }, []);

  const refreshState = useCallback(async () => {
    if (address) {
      await loadAccountData(address);
    }
  }, [address, loadAccountData]);

  // Connect via MetaMask
  const connectMetaMask = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask extension not found. Please install MetaMask or choose an Instant Demo Account.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      setActiveDemoWallet(null); // Clear demo wallet to use MetaMask
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      let currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      // Auto switch network if needed
      if (currentChainId !== LOCAL_CHAIN_ID) {
        try {
          await switchOrAddNetwork();
          const updatedNet = await provider.getNetwork();
          currentChainId = Number(updatedNet.chainId);
          setChainId(currentChainId);
        } catch (switchErr) {
          console.warn("Network switch skipped:", switchErr);
        }
      }

      if (accounts.length > 0) {
        const currentAccount = accounts[0];
        setAddress(currentAccount);
        await loadAccountData(currentAccount);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error connecting MetaMask:", err);
      setError(err?.message || "Failed to connect MetaMask");
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect via Instant Demo Account (real Hardhat signed transactions)
  const selectDemoAccount = async (key: keyof typeof DEMO_ACCOUNTS) => {
    setIsConnecting(true);
    setError(null);

    try {
      const accountConfig = DEMO_ACCOUNTS[key];
      const provider = getReadOnlyProvider();
      const demoWallet = new Wallet(accountConfig.privateKey, provider);

      setActiveDemoWallet(demoWallet);
      setAddress(demoWallet.address);
      setChainId(LOCAL_CHAIN_ID);
      await loadAccountData(demoWallet.address);

      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to select demo account:", err);
      setError(err?.message || "Failed to activate demo account");
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWallet = () => {
    setIsModalOpen(true);
  };

  const disconnectWallet = () => {
    setActiveDemoWallet(null);
    setAddress(null);
    setIsAdmin(false);
    setIsIssuer(false);
    setInstitution(null);
  };

  const switchToConsortiumNetwork = async () => {
    try {
      await switchOrAddNetwork();
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
      }
    } catch (err: any) {
      console.error("Error switching network:", err);
      setError(err?.message || "Failed to switch network");
    }
  };

  // Listen to MetaMask account and chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAccount = accounts[0];
        setAddress(newAccount);
        loadAccountData(newAccount);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Initial silent check
    const checkConnected = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) {
          const currentAccount = accounts[0];
          const network = await provider.getNetwork();
          setAddress(currentAccount);
          setChainId(Number(network.chainId));
          await loadAccountData(currentAccount);
        }
      } catch (err) {
        console.error("Silent account check failed:", err);
      }
    };

    checkConnected();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [loadAccountData]);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: Boolean(address),
        isConnecting,
        chainId,
        isAdmin,
        isIssuer,
        institution,
        error,
        connectWallet,
        disconnectWallet,
        refreshState,
        switchToConsortiumNetwork,
        openConnectModal: () => setIsModalOpen(true),
        selectDemoAccount,
      }}
    >
      {children}
      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnectMetaMask={connectMetaMask}
        onSelectDemoAccount={selectDemoAccount}
        isConnecting={isConnecting}
        error={error}
      />
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
