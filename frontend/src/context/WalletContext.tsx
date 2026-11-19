import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ethers, BrowserProvider } from "ethers";
import { Institution, WalletState } from "../types";
import { fetchUserRoles, switchOrAddNetwork } from "../blockchain/ethereum";
import { LOCAL_CHAIN_ID } from "../blockchain/contractConfig";

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshState: () => Promise<void>;
  switchToConsortiumNetwork: () => Promise<void>;
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

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed. Please install the MetaMask extension.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        const currentAccount = accounts[0];
        setAddress(currentAccount);
        setChainId(Number(network.chainId));
        await loadAccountData(currentAccount);
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err?.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
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

    const handleChainChanged = (_chainIdHex: string) => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Initial check if already connected
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
      }}
    >
      {children}
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
