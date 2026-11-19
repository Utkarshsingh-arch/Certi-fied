import { ethers, BrowserProvider, JsonRpcProvider, Contract, Wallet } from "ethers";
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
 * Demo private keys for Hardhat local testnet
 */
export const DEMO_ACCOUNTS = {
  admin: {
    name: "Consortium Admin",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    role: "Admin (Deployer)",
  },
  presidencyUni: {
    name: "Presidency University",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    role: "Authorized Issuer A",
  },
  abcUni: {
    name: "ABC University",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    role: "Authorized Issuer B",
  },
  unregistered: {
    name: "Unregistered Account",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    role: "Unauthorized Tester",
  },
};

let activeDemoWallet: ethers.Wallet | null = null;

export function setActiveDemoWallet(wallet: ethers.Wallet | null) {
  activeDemoWallet = wallet;
}

export function getActiveDemoWallet(): ethers.Wallet | null {
  return activeDemoWallet;
}

/**
 * Returns a read-only provider querying the local Hardhat node directly.
 */
export function getReadOnlyProvider(): ethers.Provider {
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
 * Returns a signer instance (either active demo wallet or MetaMask)
 */
export async function getSigner(): Promise<ethers.Signer> {
  if (activeDemoWallet) {
    return activeDemoWallet;
  }
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask or select a Demo Account.");
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
 * Validates and requests switching to the correct chain (31337).
 */
export async function switchOrAddNetwork(): Promise<void> {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7a69" }], // 31337 in hex
    });
  } catch (switchError: any) {
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
    const issuedFilter = contract.filters.CertificateIssued(null, null, issuerWallet);
    const issuedEvents = await contract.queryFilter(issuedFilter, 0, "latest");

    const revokedFilter = contract.filters.CertificateRevoked();
    const revokedEvents = await contract.queryFilter(revokedFilter, 0, "latest");
    const revokedMap = new Set<string>();

    for (const rev of revokedEvents) {
      if ((rev as any).args && (rev as any).args[0]) {
        revokedMap.add((rev as any).args[0].toLowerCase());
      }
    }

    const history = [];
    for (const evt of issuedEvents) {
      const certId = (evt as any).args ? (evt as any).args[0] : "";
      const docHash = (evt as any).args ? (evt as any).args[1] : "";
      const timestamp = (evt as any).args ? Number((evt as any).args[3]) : 0;

      history.push({
        certificateId: certId,
        documentHash: docHash,
        timestamp,
        isRevoked: revokedMap.has(certId.toLowerCase()),
        txHash: evt.transactionHash,
      });
    }

    return history.reverse();
  } catch (error) {
    console.error("Error querying certificate history events:", error);
    return [];
  }
}
