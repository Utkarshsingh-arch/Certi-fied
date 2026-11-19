# UniChain
## Blockchain-Based Inter-University Certificate Verification System

UniChain is a decentralized consortium certificate verification platform engineered for academic institutions. It demonstrates how universities can eliminate centralized database silos and certificate verification delays through an Ethereum-compatible smart contract registry.

---

## ⚡ Quick Start: Commands to Run

You will need **3 terminal windows** open in the project root (`~/Projects/Certi-fied`):

```bash
# ---------------------------------------------------------------
# TERMINAL 1: Start the Local Ethereum Blockchain Node
# ---------------------------------------------------------------
cd blockchain
npx hardhat node
# (Or from root: npm run blockchain:node)
# Spawns local node at http://127.0.0.1:8545 (Chain ID: 31337)
# Keep this terminal running!

# ---------------------------------------------------------------
# TERMINAL 2: Compile, Deploy Contract & Register Demo Universities
# ---------------------------------------------------------------
cd blockchain
npx hardhat run scripts/deploy.ts --network localhost
# (Or from root: npm run blockchain:deploy)
# Deploys CertificateRegistry.sol & auto-registers Presidency Uni & ABC Uni

# ---------------------------------------------------------------
# TERMINAL 3: Start the Frontend Application
# ---------------------------------------------------------------
npm run dev
# (Or: cd frontend && npm run dev)
# Opens the web application at http://localhost:5173
```

---

## 🛠️ Root NPM Scripts Reference

For convenience, you can run any task directly from the repository root:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite React frontend development server (`http://localhost:5173`) |
| `npm run blockchain:node` | Spawns the local Hardhat Ethereum node on port `8545` |
| `npm run blockchain:deploy` | Deploys `CertificateRegistry.sol` to localhost and seeds demo universities |
| `npm run blockchain:compile` | Compiles the Solidity smart contracts with solc `0.8.20` |
| `npm run blockchain:test` | Runs the automated 20-test suite verifying access control and issuance |
| `npm run build` | Builds the frontend production bundle (`dist/`) |

---

## 1. Project Overview & Architecture

### The Problem
Traditional academic certificate verification relies on contacting the issuing institution's registrar or querying its proprietary internal databases. This leads to weeks of delays for graduating students, potential impersonation fraud, single points of failure, and vulnerability to centralized record tampering.

### The UniChain Solution
UniChain provides an immutable consortium registry:
1. **Privacy-Preserving Off-Chain PII**: Student personal data (name, roll number, course, grades) remains exclusively in the generated certificate PDF file. Zero personally identifiable information (PII) is stored on-chain.
2. **Cryptographic SHA-256 Fingerprinting**: When an authorized university issues a degree, the browser computes the exact SHA-256 digest of the finalized PDF using the native Web Crypto API.
3. **On-Chain Consortium Registry**: The university signs a blockchain transaction via MetaMask or the Instant Demo Signer, writing only the `certificateId`, `documentHash`, `issuer` address, and `timestamp` to `CertificateRegistry.sol`.
4. **Independent Cross-University Verification**: Any participating university, employer, or third-party verifier can upload the candidate's PDF. The client computes its SHA-256 hash and validates it against the smart contract—without ever contacting the issuing university's internal servers.
5. **Instant Tamper Detection**: Changing even a single character in the PDF alters its SHA-256 hash completely (the avalanche effect), triggering an instant **"VERIFICATION FAILED — DOCUMENT HASH MISMATCH"** warning.
6. **Immutable Revocation**: If a degree is revoked (e.g., academic dishonesty), the issuing university or consortium administrator flags it on-chain with a permanent audit timestamp.

```
+-------------------------------------------------------------------------------+
|                               React Frontend                                  |
|   +-------------------+    +--------------------+    +--------------------+   |
|   | Consortium Admin  |    |  University Issuer |    | Public Verifier    |   |
|   | Dashboard         |    |  (PDF-Lib + QR)    |    | (Web Crypto Hash)  |   |
|   +---------+---------+    +---------+----------+    +---------+----------+   |
+-------------|------------------------|-------------------------|--------------+
              |                        |                         |
              | MetaMask / Demo Signer | MetaMask / Demo Signer  | Read-Only RPC
              v                        v                         v
+-------------------------------------------------------------------------------+
|                    Ethereum Virtual Machine / Hardhat                         |
|                                                                               |
|                   Smart Contract: CertificateRegistry.sol                     |
|                                                                               |
|   +--------------------------+          +---------------------------------+   |
|   | OpenZeppelin             |          | Certificate Mapping             |   |
|   | DEFAULT_ADMIN_ROLE       |          | - certificateId (bytes32)       |   |
|   | ISSUER_ROLE              |          | - documentHash (bytes32)        |   |
|   +--------------------------+          | - issuer (address)              |   |
|                                         | - issueTimestamp (uint256)      |   |
|   +--------------------------+          | - revocationTimestamp (uint256) |   |
|   | Institution Mapping      |          | - exists (bool)                 |   |
|   | - name, wallet, active   |          | - revoked (bool)                |   |
|   +--------------------------+          +---------------------------------+   |
+-------------------------------------------------------------------------------+
```

---

## 2. Technology Stack

- **Smart Contract Layer**: Solidity `^0.8.20`, OpenZeppelin Contracts (`AccessControl`), Hardhat, TypeChain, Mocha & Chai.
- **Frontend Layer**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Web3 Interaction**: Ethers.js v6, MetaMask browser extension, Hardhat JsonRpcProvider.
- **Document Processing**: `pdf-lib` (client-side PDF generation), `qrcode` (verification link embedding), Web Crypto API (`crypto.subtle.digest("SHA-256", ...)`).
- **Consortium Network**: Local Hardhat Node (Chain ID: `31337`).

---

## 3. Prerequisites

- **Node.js**: `v18.x`, `v20.x`, or `v22.x`
- **npm**: `v9.x` or `v10.x`
- **MetaMask**: (Optional if using Instant Demo Accounts) Browser extension installed on Chrome, Brave, Edge, or Firefox.

---

## 4. Full Installation & Setup

Clone the repository and install dependencies in both modules:

```bash
# 1. Clone the repository
git clone https://github.com/Utkarshsingh-arch/Certi-fied.git
cd Certi-fied

# 2. Install blockchain dependencies
cd blockchain
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Return to root
cd ..
```

---

## 5. Running the Blockchain & Deploying Contracts

### Step 5.1: Launch Hardhat Node
In Terminal 1:
```bash
cd blockchain
npx hardhat node
```
This runs a local RPC endpoint at `http://127.0.0.1:8545` (Chain ID: `31337`) with 20 pre-funded test accounts (10,000 ETH each). **Leave this terminal open.**

### Step 5.2: Deploy Smart Contract
In Terminal 2:
```bash
cd blockchain
npx hardhat run scripts/deploy.ts --network localhost
```

The script:
1. Deploys `CertificateRegistry.sol` using Hardhat Account #0 (Consortium Admin).
2. Automatically registers **Presidency University** (Account #1).
3. Automatically registers **ABC University** (Account #2).
4. Exports the deployed address and ABI to `frontend/src/blockchain/deployedContract.json`.

---

## 6. Starting the Frontend Web App

In Terminal 3:
```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 7. Connecting Accounts (Two Ways)

UniChain supports two methods for signing blockchain transactions:

### Method A: Instant Demo Accounts (Zero Setup / Recommended)
Click **`Connect Wallet`** or any page's **`Instant Connect`** button to switch roles with a single click:
- 👑 **Consortium Admin** (`0xf39F...2266`): Manage and register universities.
- 🎓 **Presidency University** (`0x7099...79C8`): Authorized Issuer A.
- 🏛️ **ABC University** (`0x3C44...93BC`): Authorized Issuer B / Cross-Verifier.
- 🚫 **Unregistered Account** (`0x90F7...b906`): Test rejection of unauthorized users.

*Each instant demo account uses the local Hardhat private keys and submits genuine, cryptographic transactions to your running blockchain node.*

### Method B: MetaMask Browser Extension
1. In MetaMask, add the local network:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
2. Import the funded test private keys from your Hardhat node:

| Account Role | Address | Hardhat Private Key (Local Testnet Only) |
| :--- | :--- | :--- |
| **Consortium Admin** (Acc #0) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Presidency Uni** (Acc #1) | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **ABC University** (Acc #2) | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Unregistered Account** (Acc #3) | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |

> [!CAUTION]
> These keys are publicly known Hardhat default testing keys. Use them **ONLY** on your local test node (`http://127.0.0.1:8545`). Never send real funds to these addresses on public networks.

---

## 8. Step-by-Step Demonstration Workflows

### Demonstration 1: Successful Cross-University Issuance & Verification
1. **Connect as Presidency University**:
   - Go to `http://localhost:5173/issuer` (University Portal).
   - Click **`Instant Connect (Presidency Uni)`** (or select Account #1 in MetaMask).
   - The top banner shows: **"Presidency University — Active Consortium Issuer"**.
2. **Issue Rahul Sharma's Degree**:
   - Click **`• Autofill Demo Student (Rahul Sharma)`**.
   - Note the **Certificate ID** (e.g. `UC-2026-RAHUL-xxx`).
   - Click **`Generate Certificate & Commit On-Chain`**.
   - The transaction is confirmed on Hardhat, and the finalized official PDF certificate with its embedded QR code is automatically downloaded.
3. **Switch to ABC University (Third-Party Verifier)**:
   - Click the address pill in the top navbar &rarr; select **ABC University** (or disconnect your wallet).
   - Open `http://localhost:5173/verify` (Verify Certificate).
   - Enter the Certificate ID (`UC-2026-RAHUL-xxx`).
   - Upload the downloaded PDF certificate.
   - Click **`Verify Authenticity`**.
4. **Result**:
   - 🟢 **`VERIFIED — AUTHENTIC CERTIFICATE`** (Green badge).
   - Shows issuing institution (**Presidency University**), issuer wallet address, block timestamp, and matching SHA-256 hashes.
   - *Proves cross-university verification without accessing Presidency's internal database.*

---

### Demonstration 2: Cryptographic Tamper Detection
1. Open the downloaded certificate PDF in an editor or rename/modify any text byte.
2. Return to `http://localhost:5173/verify`.
3. Enter the same Certificate ID (`UC-2026-RAHUL-xxx`).
4. Upload the modified/altered PDF.
5. Click **`Verify Authenticity`**.
6. **Result**:
   - 🔴 **`VERIFICATION FAILED — DOCUMENT HASH MISMATCH`** (Red badge).
   - Highlights both the uploaded hash and the on-chain hash to explain that the file was altered after issuance.

---

### Demonstration 3: Certificate Revocation
1. Switch back to **Presidency University** (`http://localhost:5173/issuer`).
2. In the **Issuance History** panel on the right, find Rahul Sharma's certificate.
3. Click **`Revoke Certificate`** and confirm.
4. Return to `http://localhost:5173/verify`.
5. Upload the original, *unaltered* PDF and enter the Certificate ID.
6. Click **`Verify Authenticity`**.
7. **Result**:
   - 🟠 **`CERTIFICATE REVOKED`** (Amber badge).
   - Displays the on-chain revocation timestamp. Even with an intact hash, revoked credentials cannot be verified.

---

### Demonstration 4: Unauthorized Issuer Enforcement
1. Switch to the **Unregistered Account** (`0x90F7...b906`) via the wallet pill.
2. Open `http://localhost:5173/issuer`.
3. **Result**:
   - 🚫 **Access Denied Banner**: Shows that the account lacks `ISSUER_ROLE`. Direct contract calls revert with OpenZeppelin's `AccessControlUnauthorizedAccount` error.

---

## 9. Running Automated Smart Contract Tests

To execute the test suite verifying all 14 required access control, issuance, revocation, and suspension behaviors:

```bash
cd blockchain
npx hardhat test
# (Or from root: npm run blockchain:test)
```

Output:
```
  CertificateRegistry
    1. Deployment and Administrative Role
      ✔ 1. Contract deployer receives administrator permissions
      ✔ Deployer can access admin functions, while unauthorized accounts cannot
    2. Institution Registration
      ✔ 2. Admin can register an institution
      ✔ 3. Admin can register multiple institutions
      ✔ Rejects duplicate registration of the same wallet
      ✔ Rejects registration with invalid inputs
    3. Certificate Issuance
      ✔ 4. Registered issuer can issue a certificate
      ✔ 5. Unregistered wallet cannot issue a certificate
      ✔ 6. Duplicate certificate ID is rejected
      ✔ 7. Correct hash is stored
      ✔ 8. Certificate details can be retrieved
      ✔ Rejects zero certificate ID or zero document hash
    4. Certificate Revocation
      ✔ 9. Issuing university can revoke its own certificate
      ✔ 10. Another university cannot revoke the certificate
      ✔ 11. Admin can revoke a certificate
      ✔ 12. Revoked certificate cannot be revoked again
      ✔ Cannot revoke a non-existent certificate
    5. Institution Suspension & Status Management
      ✔ 13. Suspended university cannot issue new certificates
      ✔ 14. Certificates issued before suspension remain present in the registry
      ✔ Reactivating a suspended university restores issuance capability

  20 passing (3s)
```

---

## 10. Summary of Architectural Decisions

1. **No Central Backend**: Zero server-side state or centralized database. Verification queries the EVM directly via JSON-RPC.
2. **Deterministic Identifier Mapping**: Certificate IDs are converted to `bytes32` via `ethers.id(certificateId)` to enable clean, constant-time `O(1)` mapping lookups on-chain.
3. **Off-Chain Cryptography**: Browser native `crypto.subtle.digest("SHA-256", buffer)` prevents sending student files across networks and guarantees zero gas overhead for document hashing.
4. **OpenZeppelin Role Segregation**: Separation of `DEFAULT_ADMIN_ROLE` (Consortium Governor) and `ISSUER_ROLE` (Accredited Universities).
