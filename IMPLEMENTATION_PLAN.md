# UniChain — Implementation Plan
## Blockchain-Based Inter-University Certificate Verification System

### 1. Repository Structure
```
Certi-fied/
├── blockchain/
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   └── CertificateRegistry.ts
│   ├── hardhat.config.ts
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── blockchain/
│   │   │   ├── config.ts
│   │   │   ├── contractABI.json
│   │   │   └── ethereum.ts
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── WalletConnectModal.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── IssuerDashboard.tsx
│   │   │   └── VerificationPage.tsx
│   │   ├── services/
│   │   │   ├── certificatePdf.ts
│   │   │   ├── cryptoHash.ts
│   │   │   └── qrCode.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── package.json
├── IMPLEMENTATION_PLAN.md
├── README.md
└── .gitignore
```

---

### 2. Smart Contract Design (`CertificateRegistry.sol`)
- **Framework & Libraries**: Solidity ^0.8.20, OpenZeppelin Contracts (`AccessControl.sol`).
- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Contract deployer (Consortium Admin).
  - `ISSUER_ROLE`: Registered and active university wallets.
- **Data Structures**:
  - `Institution`:
    - `name` (`string`)
    - `wallet` (`address`)
    - `isRegistered` (`bool`)
    - `isActive` (`bool`)
  - `Certificate`:
    - `certificateId` (`bytes32`)
    - `documentHash` (`bytes32`)
    - `issuer` (`address`)
    - `issueTimestamp` (`uint256`)
    - `revocationTimestamp` (`uint256`)
    - `exists` (`bool`)
    - `revoked` (`bool`)
- **Key Functions**:
  - `registerInstitution(address wallet, string calldata name)`
  - `setInstitutionActive(address wallet, bool active)`
  - `issueCertificate(bytes32 certificateId, bytes32 documentHash)`
  - `revokeCertificate(bytes32 certificateId)`
  - `getCertificate(bytes32 certificateId)`
  - `getInstitution(address wallet)`
  - Helper functions for admin/verifier querying (e.g. `getAllInstitutions()` or event tracking).
- **Events**:
  - `InstitutionRegistered(address indexed wallet, string name, uint256 timestamp)`
  - `InstitutionStatusChanged(address indexed wallet, bool isActive, uint256 timestamp)`
  - `CertificateIssued(bytes32 indexed certificateId, bytes32 indexed documentHash, address indexed issuer, uint256 timestamp)`
  - `CertificateRevoked(bytes32 indexed certificateId, address indexed revoker, uint256 timestamp)`

---

### 3. Wallet Setup & Local Blockchain
- **Local Network**: Hardhat local node at `http://127.0.0.1:8545` (Chain ID: 31337).
- **Accounts**:
  - Account #0: Consortium Administrator.
  - Account #1: University A (Presidency University).
  - Account #2: University B (ABC University).
  - Account #3: Unregistered Account (for authorization test).
- **MetaMask Configuration**: Connect to Localhost 8545, import account private keys for role testing.

---

### 4. Frontend Architecture
- **Tech Stack**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Ethers.js v6.
- **Routing**: `react-router-dom` for navigation:
  - `/`: Landing page
  - `/admin`: Consortium Admin dashboard (role gated)
  - `/issuer`: University Issuer dashboard (role gated)
  - `/verify` and `/verify/:certificateId`: Certificate Verification page (publicly accessible)
- **State Management**:
  - `WalletContext` / custom hook for tracking connected account, network, roles (`isAdmin`, `isIssuer`, `institutionName`, `isActive`).

---

### 5. Certificate Issuance Workflow
1. Connected university fills issuance form (student name, roll no, course, graduation year).
2. Generate unique `certificateId` (e.g., `UC-YYYY-XXXXX`) and its `bytes32` identifier via `ethers.id(certificateId)`.
3. Generate QR code containing verification URL (`http://localhost:5173/verify/{certificateId}`).
4. Generate final certificate PDF in browser using `pdf-lib` (embedded fonts, university seal styling, QR code, metadata).
5. Compute SHA-256 hash of final PDF bytes using Web Crypto API (`crypto.subtle.digest("SHA-256", bytes)`).
6. Request MetaMask transaction to call `issueCertificate(idHash, docHash)`.
7. Await on-chain confirmation, capture transaction hash, trigger PDF download for the student.

---

### 6. Certificate Verification Workflow
1. Verifier opens `/verify` or clicks QR link `/verify/:certificateId`.
2. Verifier uploads candidate PDF file.
3. Compute candidate PDF SHA-256 hash in browser via Web Crypto API.
4. Read on-chain data: `getCertificate(certificateIdHash)` and `getInstitution(issuer)`.
5. Evaluate Status:
   - **Case A (Verified)**: Exists, hash matches stored hash, revoked == false.
   - **Case B (Tampered)**: Exists, hash mismatch with stored hash.
   - **Case C (Revoked)**: Exists, revoked == true (even if hash matches).
   - **Case D (Not Found)**: Exists == false.
6. Display clear visual feedback with full metadata, issuer details, timestamps, and hashes.

---

### 7. Testing Strategy
- **Smart Contract Automated Tests (Mocha/Chai via Hardhat)**:
  - 14 required test scenarios including role enforcement, duplicate prevention, hash integrity, revocation permissions, suspension mechanics.
- **Frontend Unit/Build Test**:
  - TypeScript validation and Vite build verification.
- **End-to-End Demonstration Walkthrough**:
  - Consortium Admin registration of Presidency University and ABC University.
  - Presidency University issues Rahul Sharma's certificate.
  - ABC University / Verifier uploads original PDF -> Verified.
  - Altered PDF uploaded -> Tampered.
  - Presidency University revokes certificate -> Revoked.
  - Unregistered wallet tries issuing -> Transaction rejected.
