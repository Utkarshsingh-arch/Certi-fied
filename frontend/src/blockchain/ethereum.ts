import { ethers, BrowserProvider, JsonRpcProvider, Contract } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, DEFAULT_CONTRACT_ADDRESS, LOCAL_CHAIN_ID } from "./contractConfig";
import { CertificateRecord, Institution } from "../types";

import deployedConfig from "./deployedContract.json";

export function getContractAddress(): string {
  if (import.meta.env.VITE_CONTRACT_ADDRESS) {
    return import.meta.env.VITE_CONTRACT_ADDRESS as string;
  }
  if (deployedConfig && deployedConfig.contractAddress) {
    return deployedConfig.contractAddress;
  }
  return DEFAULT_CONTRACT_ADDRESS;
}

export function getRpcUrl(): string {
  return (import.meta.env.VITE_RPC_URL as string) || "http://127.0.0.1:8545";
}

/**
 * Returns a read-only provider. Prefers JSON-RPC provider for frictionless public verification,
 * falls back to BrowserProvider if available.
 */
export function getReadOnlyProvider(): ethers.Provider {
  if (typeof window !== "undefined" && window.ethereum) {
    return new BrowserProvider(window.ethereum);
  }
  return new JsonRpcProvider(getRpcUrl());
}

/**
 * Returns a read-only instance of CertificateRegistry
 */
export function getReadOnlyContract(): Contract {
  const provider = getReadOnlyProvider();
  return new Contract(getContractAddress(), CERTIFICATE_REGISTRY_ABI, provider);
}

/**
 * Returns a signer instance from MetaMask
 */
export async function getSigner(): Promise<ethers.Signer> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask to use institutional features.");
  }
  const provider = new BrowserProvider(window.ethereum);
  return await provider.getSigner();
}

/**
 * Returns an authorized writable contract instance connected to the user's signer.
 */
export async function getAuthorizedContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(getContractAddress(), CERTIFICATE_REGISTRY_ABI, signer);
}

/**
 * Validates and requests switching to the correct chain (default: 31337).
 */
export async function switchOrAddNetwork(): Promise<void> {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7a69" }], // 31337
    });
  } catch (switchError: any) {
    // Error code 4902 indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x7a69",
            chainName: "Hardhat Localhost",
            rpcUrls: ["http://127.0.0.1:8545"],
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Queries role status and institution profile for a given wallet address.
 */
export async function fetchUserRoles(walletAddress: string): Promise<{
  isAdmin: boolean;
  isIssuer: boolean;
  institution: Institution | null;
}> {
  try {
    const contract = getReadOnlyContract();
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));

    const [isAdmin, isIssuer, instData] = await Promise.all([
      contract.hasRole(DEFAULT_ADMIN_ROLE, walletAddress),
      contract.hasRole(ISSUER_ROLE, walletAddress),
      contract.getInstitution(walletAddress),
    ]);

    let institution: Institution | null = null;
    if (instData && instData.isRegistered) {
      institution = {
        name: instData.name,
        wallet: instData.wallet,
        isRegistered: instData.isRegistered,
        isActive: instData.isActive,
      };
    }

    return {
      isAdmin: Boolean(isAdmin),
      isIssuer: Boolean(isIssuer),
      institution,
    };
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return { isAdmin: false, isIssuer: false, institution: null };
  }
}

/**
 * Issues a certificate on-chain.
 */
export async function issueCertificateOnChain(
  certificateId: string,
  documentHash: string
): Promise<{ txHash: string; blockNumber: number }> {
  const contract = await getAuthorizedContract();
  // Ensure certificateId is formatted as bytes32
  const idBytes32 = certificateId.startsWith("0x") && certificateId.length === 66
    ? certificateId
    : ethers.id(certificateId);

  const tx = await contract.issueCertificate(idBytes32, documentHash);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Revokes a certificate on-chain.
 */
export async function revokeCertificateOnChain(certificateId: string): Promise<string> {
  const contract = await getAuthorizedContract();
  const idBytes32 = certificateId.startsWith("0x") && certificateId.length === 66
    ? certificateId
    : ethers.id(certificateId);

  const tx = await contract.revokeCertificate(idBytes32);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Fetches certificate record by ID.
 */
export async function getCertificateRecord(certificateId: string): Promise<CertificateRecord | null> {
  try {
    const contract = getReadOnlyContract();
    const idBytes32 = certificateId.startsWith("0x") && certificateId.length === 66
      ? certificateId
      : ethers.id(certificateId);

    const cert = await contract.getCertificate(idBytes32);
    if (!cert || !cert.exists) {
      return null;
    }

    return {
      certificateId: cert.certificateId,
      documentHash: cert.documentHash,
      issuer: cert.issuer,
      issueTimestamp: Number(cert.issueTimestamp),
      revocationTimestamp: Number(cert.revocationTimestamp),
      exists: cert.exists,
      revoked: cert.revoked,
    };
  } catch (error) {
    console.error("Error retrieving certificate:", error);
    return null;
  }
}

/**
 * Fetches institution information for a wallet address.
 */
export async function getInstitutionRecord(walletAddress: string): Promise<Institution | null> {
  try {
    const contract = getReadOnlyContract();
    const inst = await contract.getInstitution(walletAddress);
    if (!inst || !inst.isRegistered) return null;
    return {
      name: inst.name,
      wallet: inst.wallet,
      isRegistered: inst.isRegistered,
      isActive: inst.isActive,
    };
  } catch (error) {
    console.error("Error fetching institution:", error);
    return null;
  }
}

/**
 * Fetches all registered institutions for the Consortium Admin dashboard.
 */
export async function getAllInstitutions(): Promise<Institution[]> {
  try {
    const contract = getReadOnlyContract();
    const list = await contract.getAllInstitutions();
    return list.map((inst: any) => ({
      name: inst.name,
      wallet: inst.wallet,
      isRegistered: inst.isRegistered,
      isActive: inst.isActive,
    }));
  } catch (error) {
    console.error("Error retrieving institutions:", error);
    return [];
  }
}

/**
 * Admin: Register a new institution
 */
export async function registerInstitutionOnChain(wallet: string, name: string): Promise<string> {
  const contract = await getAuthorizedContract();
  const tx = await contract.registerInstitution(wallet, name);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Admin: Update institution active/suspended status
 */
export async function setInstitutionActiveOnChain(wallet: string, active: boolean): Promise<string> {
  const contract = await getAuthorizedContract();
  const tx = await contract.setInstitutionActive(wallet, active);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Retrieves historical certificates issued by a specific university wallet
 * by querying on-chain `CertificateIssued` and `CertificateRevoked` events.
 */
export async function getIssuedCertificateHistory(issuerWallet: string): Promise<{
  certificateId: string;
  documentHash: string;
  timestamp: number;
  isRevoked: boolean;
  txHash: string;
}[]> {
  try {
    const contract = getReadOnlyContract();
    // Filter CertificateIssued events by issuer
    const issuedFilter = contract.filters.CertificateIssued(null, null, issuerWallet);
    const issuedEvents = await contract.queryFilter(issuedFilter, 0, "latest");

    // Also get revoked events to check status
    const revokedFilter = contract.filters.CertificateRevoked();
    const revokedEvents = await contract.queryFilter(revokedFilter, 0, "latest");
    const revokedMap = new Set<string>();

    for (const rev of revokedEvents) {
      // @ts-expect-error event args
      if (rev.args && rev.args[0]) {
        // @ts-expect-error event args
        revokedMap.add(rev.args[0].toLowerCase());
      }
    }

    const history = [];
    for (const evt of issuedEvents) {
      // @ts-expect-error event args
      const certId = evt.args ? evt.args[0] : "";
      // @ts-expect-error event args
      const docHash = evt.args ? evt.args[1] : "";
      // @ts-expect-error event args
      const timestamp = evt.args ? Number(evt.args[3]) : 0;

      history.push({
        certificateId: certId,
        documentHash: docHash,
        timestamp,
        isRevoked: revokedMap.has(certId.toLowerCase()),
        txHash: evt.transactionHash,
      });
    }

    return history.reverse(); // latest first
  } catch (error) {
    console.error("Error querying certificate history events:", error);
    return [];
  }
}
