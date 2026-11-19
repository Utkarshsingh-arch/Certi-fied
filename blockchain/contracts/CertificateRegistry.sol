// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CertificateRegistry
 * @dev Consortium blockchain certificate registry for academic institutions.
 * Implements role-based access control, certificate issuance, verification, and revocation.
 */
contract CertificateRegistry is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Institution {
        string name;
        address wallet;
        bool isRegistered;
        bool isActive;
    }

    struct Certificate {
        bytes32 certificateId;
        bytes32 documentHash;
        address issuer;
        uint256 issueTimestamp;
        uint256 revocationTimestamp;
        bool exists;
        bool revoked;
    }

    // Mapping from institution address to Institution details
    mapping(address => Institution) private _institutions;
    address[] private _institutionList;

    // Mapping from certificate ID to Certificate details
    mapping(bytes32 => Certificate) private _certificates;

    // Events
    event InstitutionRegistered(address indexed wallet, string name, uint256 timestamp);
    event InstitutionStatusChanged(address indexed wallet, bool isActive, uint256 timestamp);
    event CertificateIssued(
        bytes32 indexed certificateId,
        bytes32 indexed documentHash,
        address indexed issuer,
        uint256 timestamp
    );
    event CertificateRevoked(
        bytes32 indexed certificateId,
        address indexed revoker,
        uint256 timestamp
    );

    constructor() {
        // Deployer is assigned the Consortium Administrator role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Registers a university institution with an authorized wallet.
     * @dev Only Consortium Administrator can call this.
     * @param wallet Authorized wallet address for the university.
     * @param name Name of the institution.
     */
    function registerInstitution(address wallet, string calldata name) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(wallet != address(0), "Invalid wallet address");
        require(bytes(name).length > 0, "Institution name cannot be empty");
        require(!_institutions[wallet].isRegistered, "Institution already registered");

        _institutions[wallet] = Institution({
            name: name,
            wallet: wallet,
            isRegistered: true,
            isActive: true
        });

        _institutionList.push(wallet);
        _grantRole(ISSUER_ROLE, wallet);

        emit InstitutionRegistered(wallet, name, block.timestamp);
    }

    /**
     * @notice Activates or suspends an institution's certificate issuance rights.
     * @dev Only Consortium Administrator can call this.
     * @param wallet Address of the institution.
     * @param active True to activate, false to suspend.
     */
    function setInstitutionActive(address wallet, bool active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_institutions[wallet].isRegistered, "Institution not registered");
        require(_institutions[wallet].isActive != active, "Institution already in requested status");

        _institutions[wallet].isActive = active;

        if (active) {
            _grantRole(ISSUER_ROLE, wallet);
        } else {
            _revokeRole(ISSUER_ROLE, wallet);
        }

        emit InstitutionStatusChanged(wallet, active, block.timestamp);
    }

    /**
     * @notice Issues a new certificate on the blockchain.
     * @dev Only authorized, active university issuers can call this.
     * @param certificateId Unique cryptographic ID of the certificate.
     * @param documentHash SHA-256 cryptographic hash of the certificate document.
     */
    function issueCertificate(bytes32 certificateId, bytes32 documentHash) external onlyRole(ISSUER_ROLE) {
        require(_institutions[msg.sender].isActive, "Institution is suspended");
        require(certificateId != bytes32(0), "Invalid certificate ID");
        require(documentHash != bytes32(0), "Invalid document hash");
        require(!_certificates[certificateId].exists, "Certificate ID already exists");

        _certificates[certificateId] = Certificate({
            certificateId: certificateId,
            documentHash: documentHash,
            issuer: msg.sender,
            issueTimestamp: block.timestamp,
            revocationTimestamp: 0,
            exists: true,
            revoked: false
        });

        emit CertificateIssued(certificateId, documentHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Revokes a previously issued certificate.
     * @dev Can be called by the issuing institution or the consortium administrator.
     * @param certificateId Unique ID of the certificate to revoke.
     */
    function revokeCertificate(bytes32 certificateId) external {
        require(_certificates[certificateId].exists, "Certificate does not exist");
        require(!_certificates[certificateId].revoked, "Certificate is already revoked");

        address issuer = _certificates[certificateId].issuer;
        require(
            msg.sender == issuer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Unauthorized: Only issuer or admin can revoke"
        );

        _certificates[certificateId].revoked = true;
        _certificates[certificateId].revocationTimestamp = block.timestamp;

        emit CertificateRevoked(certificateId, msg.sender, block.timestamp);
    }

    /**
     * @notice Retrieves certificate information by certificate ID.
     * @param certificateId Unique ID of the certificate.
     */
    function getCertificate(bytes32 certificateId) external view returns (Certificate memory) {
        return _certificates[certificateId];
    }

    /**
     * @notice Retrieves institution details by wallet address.
     * @param wallet Address of the institution.
     */
    function getInstitution(address wallet) external view returns (Institution memory) {
        return _institutions[wallet];
    }

    /**
     * @notice Returns all registered institution addresses.
     */
    function getAllInstitutions() external view returns (Institution[] memory) {
        uint256 total = _institutionList.length;
        Institution[] memory institutions = new Institution[](total);
        for (uint256 i = 0; i < total; i++) {
            institutions[i] = _institutions[_institutionList[i]];
        }
        return institutions;
    }
}
