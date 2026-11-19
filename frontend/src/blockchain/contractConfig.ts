// ABI for CertificateRegistry
export const CERTIFICATE_REGISTRY_ABI = [
  "function registerInstitution(address wallet, string calldata name) external",
  "function setInstitutionActive(address wallet, bool active) external",
  "function issueCertificate(bytes32 certificateId, bytes32 documentHash) external",
  "function revokeCertificate(bytes32 certificateId) external",
  "function getCertificate(bytes32 certificateId) external view returns (tuple(bytes32 certificateId, bytes32 documentHash, address issuer, uint256 issueTimestamp, uint256 revocationTimestamp, bool exists, bool revoked))",
  "function getInstitution(address wallet) external view returns (tuple(string name, address wallet, bool isRegistered, bool isActive))",
  "function getAllInstitutions() external view returns (tuple(string name, address wallet, bool isRegistered, bool isActive)[])",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",
  "function ISSUER_ROLE() external view returns (bytes32)",
  "event InstitutionRegistered(address indexed wallet, string name, uint256 timestamp)",
  "event InstitutionStatusChanged(address indexed wallet, bool isActive, uint256 timestamp)",
  "event CertificateIssued(bytes32 indexed certificateId, bytes32 indexed documentHash, address indexed issuer, uint256 timestamp)",
  "event CertificateRevoked(bytes32 indexed certificateId, address indexed revoker, uint256 timestamp)"
];

export const DEFAULT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const LOCAL_CHAIN_ID = 31337;
export const LOCAL_CHAIN_HEX = "0x7a69"; // 31337 in hex
