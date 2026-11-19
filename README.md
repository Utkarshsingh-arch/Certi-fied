# UniChain
## Blockchain-Based Inter-University Certificate Verification System

UniChain is a decentralized consortium certificate verification platform engineered for academic institutions. It demonstrates how universities can eliminate centralized database silos and certificate verification delays through an Ethereum-compatible smart contract registry.

---

## 1. Project Overview & Architecture

### The Problem
Traditional academic certificate verification relies on contacting the issuing institution's registrar or querying its proprietary internal databases. This leads to weeks of delays for graduating students, potential impersonation fraud, single points of failure, and vulnerability to centralized record tampering.

### The UniChain Solution
UniChain provides an immutable consortium registry:
1. **Privacy-Preserving Off-Chain PII**: Student personal data (name, roll number, course, grades) remains exclusively in the generated certificate PDF file. Zero personally identifiable information (PII) is stored on-chain.
2. **Cryptographic SHA-256 Fingerprinting**: When an authorized university issues a degree, the browser computes the exact SHA-256 digest of the finalized PDF using the native Web Crypto API.
3. **On-Chain Consortium Registry**: The university signs a blockchain transaction via MetaMask, writing only the `certificateId`, `documentHash`, `issuer` address, and `timestamp` to `CertificateRegistry.sol`.
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
              | MetaMask (Signer)      | MetaMask (Signer)       | Read-Only RPC
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
- **Web3 Interaction**: Ethers.js v6, MetaMask browser extension.
- **Document Processing**: `pdf-lib` (client-side PDF generation), `qrcode` (verification link embedding), Web Crypto API (`crypto.subtle.digest("SHA-256", ...)`).
- **Consortium Network**: Local Hardhat Node (Chain ID: `31337`).

---

## 3. Prerequisites

- **Node.js**: `v18.x` or `v20.x` or `v22.x`
- **npm**: `v9.x` or `v10.x`
- **MetaMask**: Browser extension installed on Chrome, Brave, Edge, or Firefox.

---

## 4. Installation & Setup

Clone the repository and install dependencies in both the `blockchain` and `frontend` modules:

```bash
# Clone the repository
git clone <repo-url>
cd Certi-fied

# Install blockchain dependencies
cd blockchain
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

---

## 5. Running the Local Blockchain & Deploying the Contract

### Step 5.1: Start the Local Hardhat Node
In your first terminal, launch the local Ethereum blockchain:

```bash
cd blockchain
npx hardhat node
```
This spawns a local RPC endpoint at `http://127.0.0.1:8545` (Chain ID: `31337`) with 20 pre-funded test accounts (10,000 ETH each). Keep this terminal running.

### Step 5.2: Deploy the Smart Contract & Seed Demo Universities
In a second terminal, execute the deployment script against the local node:

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

## 6. Configuring MetaMask for Localhost

1. Open your MetaMask extension.
2. Click the Network dropdown (top left) &rarr; **Add a network** &rarr; **Add a network manually**.
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Click **Save** and switch to `Hardhat Localhost`.

### Importing Demonstration Accounts
Import the funded test private keys from your Hardhat node output:

> [!CAUTION]
> These keys are well-known Hardhat development keys. Use them **ONLY** on your local test node (`http://127.0.0.1:8545`). Never send real cryptocurrency or use these on public mainnets.

| Account Role | Address | Hardhat Private Key (Local Testnet Only) |
| :--- | :--- | :--- |
| **Consortium Admin** (Account #0) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Presidency University** (Account #1) | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **ABC University** (Account #2) | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Unregistered Account** (Account #3) | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |

In MetaMask: Click Account Icon &rarr; **Add account or hardware wallet** &rarr; **Import account** &rarr; paste the private key.

---

## 7. Running the Frontend Application

In your third terminal:

```bash
cd frontend
npm run dev
```

Open your browser at:
`http://localhost:5173`

---

## 8. Step-by-Step Demonstration Workflows

### Demonstration 1: Successful Cross-University Issuance & Verification
1. **Connect as Presidency University**:
   - In MetaMask, select Account #1 (`0x7099...79C8`).
   - Navigate to `http://localhost:5173/issuer`.
   - The top banner displays: **"Presidency University — Active Consortium Issuer"**.
2. **Issue a Degree Certificate**:
   - Click the **"• Autofill Demo Student (Rahul Sharma)"** button (or enter custom student details).
   - Click **"Generate Certificate & Commit On-Chain"**.
   - MetaMask prompts to confirm the transaction calling `issueCertificate()`.
   - Once mined, the transaction hash is displayed, and the finalized official PDF certificate is automatically downloaded to your machine.
3. **Switch to ABC University (Cross-University Verification)**:
   - In MetaMask, switch to Account #2 (`0x3C44...93BC` - ABC University) or disconnect your wallet entirely.
   - Navigate to `http://localhost:5173/verify`.
   - Enter the Certificate ID (e.g. `UC-2026-RAHUL-xxx`).
   - Upload the downloaded PDF certificate.
   - Click **"Verify Authenticity"**.
4. **Result**:
   - Status: **`VERIFIED — AUTHENTIC CERTIFICATE`** (Green badge).
   - Shows issuing institution (**Presidency University**), issuer address, block timestamp, and identical matching SHA-256 hashes.
   - *This proves ABC University authenticated Presidency University's degree with zero access to Presidency's private databases.*

---

### Demonstration 2: Cryptographic Tamper Detection
1. Open the downloaded certificate PDF in any text editor, PDF tool, or hex editor.
2. Modify a single letter (for example, change the student's name from "Rahul Sharma" to "Rohan Sharma") or add an annotation and save the file.
3. Return to `http://localhost:5173/verify`.
4. Enter the same original Certificate ID.
5. Upload the modified/altered PDF.
6. Click **"Verify Authenticity"**.
7. **Result**:
   - Status: **`VERIFICATION FAILED — DOCUMENT HASH MISMATCH`** (Red badge).
   - Explains that the uploaded document's SHA-256 digest differs from the immutable fingerprint stored on-chain.

---

### Demonstration 3: Certificate Revocation
1. Switch back to **Presidency University** (Account #1) in MetaMask.
2. Navigate to `http://localhost:5173/issuer`.
3. In the **Issuance History** sidebar, find Rahul Sharma's certificate.
4. Click **"Revoke Certificate"** and confirm.
5. Sign the `revokeCertificate()` transaction in MetaMask.
6. Return to `http://localhost:5173/verify`.
7. Upload the original, *unaltered* PDF and enter the Certificate ID.
8. Click **"Verify Authenticity"**.
9. **Result**:
   - Status: **`CERTIFICATE REVOKED`** (Amber badge).
   - Shows the exact blockchain revocation timestamp. Even with an identical document hash, revoked credentials are never marked valid.

---

### Demonstration 4: Unauthorized Issuer Enforcement
1. In MetaMask, switch to **Account #3** (`0x90F7...b906`), which is unregistered.
2. Navigate to `http://localhost:5173/issuer`.
3. **Result**:
   - Access Denied banner: The frontend displays an unauthorized message.
   - Attempting to call `issueCertificate()` directly against the smart contract reverts with OpenZeppelin's `AccessControlUnauthorizedAccount` error.

---

## 9. Running Automated Smart Contract Tests

To execute the complete automated test suite verifying all 14 required consortium access control, issuance, revocation, and suspension behaviors:

```bash
cd blockchain
npx hardhat test
```

Expected output:
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
