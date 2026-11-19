import { expect } from "chai";
import { ethers } from "hardhat";
import { CertificateRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CertificateRegistry", function () {
  let registry: CertificateRegistry;
  let admin: HardhatEthersSigner;
  let presidencyUni: HardhatEthersSigner;
  let abcUni: HardhatEthersSigner;
  let unauthorizedAccount: HardhatEthersSigner;

  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));

  const sampleCertId1 = ethers.id("UC-2026-001");
  const sampleDocHash1 = ethers.id("DOC_CONTENT_SHA256_HASH_1");
  const sampleCertId2 = ethers.id("UC-2026-002");
  const sampleDocHash2 = ethers.id("DOC_CONTENT_SHA256_HASH_2");

  beforeEach(async function () {
    [admin, presidencyUni, abcUni, unauthorizedAccount] = await ethers.getSigners();

    const CertificateRegistryFactory = await ethers.getContractFactory("CertificateRegistry");
    registry = await CertificateRegistryFactory.deploy();
    await registry.waitForDeployment();
  });

  describe("1. Deployment and Administrative Role", function () {
    it("1. Contract deployer receives administrator permissions", async function () {
      const hasAdminRole = await registry.hasRole(DEFAULT_ADMIN_ROLE, admin.address);
      expect(hasAdminRole).to.be.true;
    });

    it("Deployer can access admin functions, while unauthorized accounts cannot", async function () {
      const hasAdminRole = await registry.hasRole(DEFAULT_ADMIN_ROLE, unauthorizedAccount.address);
      expect(hasAdminRole).to.be.false;

      await expect(
        registry.connect(unauthorizedAccount).registerInstitution(presidencyUni.address, "Presidency University")
      ).to.be.reverted;
    });
  });

  describe("2. Institution Registration", function () {
    it("2. Admin can register an institution", async function () {
      await expect(
        registry.connect(admin).registerInstitution(presidencyUni.address, "Presidency University")
      )
        .to.emit(registry, "InstitutionRegistered")
        .withArgs(presidencyUni.address, "Presidency University", (val: bigint) => val > 0n);

      const inst = await registry.getInstitution(presidencyUni.address);
      expect(inst.name).to.equal("Presidency University");
      expect(inst.wallet).to.equal(presidencyUni.address);
      expect(inst.isRegistered).to.be.true;
      expect(inst.isActive).to.be.true;

      expect(await registry.hasRole(ISSUER_ROLE, presidencyUni.address)).to.be.true;
    });

    it("3. Admin can register multiple institutions", async function () {
      await registry.connect(admin).registerInstitution(presidencyUni.address, "Presidency University");
      await registry.connect(admin).registerInstitution(abcUni.address, "ABC University");

      const instA = await registry.getInstitution(presidencyUni.address);
      const instB = await registry.getInstitution(abcUni.address);

      expect(instA.name).to.equal("Presidency University");
      expect(instB.name).to.equal("ABC University");

      const all = await registry.getAllInstitutions();
      expect(all.length).to.equal(2);
      expect(all[0].name).to.equal("Presidency University");
      expect(all[1].name).to.equal("ABC University");
    });

    it("Rejects duplicate registration of the same wallet", async function () {
      await registry.connect(admin).registerInstitution(presidencyUni.address, "Presidency University");
      await expect(
        registry.connect(admin).registerInstitution(presidencyUni.address, "Presidency University")
      ).to.be.revertedWith("Institution already registered");
    });

    it("Rejects registration with invalid inputs", async function () {
      await expect(
        registry.connect(admin).registerInstitution(ethers.ZeroAddress, "Presidency University")
      ).to.be.revertedWith("Invalid wallet address");

      await expect(
        registry.connect(admin).registerInstitution(presidencyUni.address, "")
      ).to.be.revertedWith("Institution name cannot be empty");
    });
  });

  describe("3. Certificate Issuance", function () {
    beforeEach(async function () {
      await registry.connect(admin).registerInstitution(presidencyUni.address, "Presidency University");
      await registry.connect(admin).registerInstitution(abcUni.address, "ABC University");
    });

    it("4. Registered issuer can issue a certificate", async function () {
      await expect(
        registry.connect(presidencyUni).issueCertificate(sampleCertId1, sampleDocHash1)
      )
        .to.emit(registry, "CertificateIssued")
        .withArgs(sampleCertId1, sampleDocHash1, presidencyUni.address, (val: bigint) => val > 0n);

      const cert = await registry.getCertificate(sampleCertId1);
      expect(cert.exists).to.be.true;
      expect(cert.revoked).to.be.false;
      expect(cert.issuer).to.equal(presidencyUni.address);
    });

    it("5. Unregistered wallet cannot issue a certificate", async function () {
      await expect(
        registry.connect(unauthorizedAccount).issueCertificate(sampleCertId1, sampleDocHash1)
      ).to.be.reverted;
    });

    it("6. Duplicate certificate ID is rejected", async function () {
      await registry.connect(presidencyUni).issueCertificate(sampleCertId1, sampleDocHash1);

      await expect(
        registry.connect(presidencyUni).issueCertificate(sampleCertId1, sampleDocHash2)
      ).to.be.revertedWith("Certificate ID already exists");

      // Even another university cannot reuse an existing certificate ID
      await expect(
        registry.connect(abcUni).issueCertificate(sampleCertId1, sampleDocHash2)
      ).to.be.revertedWith("Certificate ID already exists");
    });

    it("7. Correct hash is stored", async function () {
      await registry.connect(presidencyUni).issueCertificate(sampleCertId1, sampleDocHash1);
      const cert = await registry.getCertificate(sampleCertId1);
      expect(cert.documentHash).to.equal(sampleDocHash1);
    });

    it("8. Certificate details can be retrieved", async function () {
      const tx = await registry.connect(presidencyUni).issueCertificate(sampleCertId1, sampleDocHash1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const cert = await registry.getCertificate(sampleCertId1);
      expect(cert.certificateId).to.equal(sampleCertId1);
      expect(cert.documentHash).to.equal(sampleDocHash1);
      expect(cert.issuer).to.equal(presidencyUni.address);
      expect(cert.issueTimestamp).to.equal(block!.timestamp);
      expect(cert.revocationTimestamp).to.equal(0n);
      expect(cert.exists).to.be.true;
      expect(cert.revoked).to.be.false;
    });

    it("Rejects zero certificate ID or zero document hash", async function () {
      await expect(
        registry.connect(presidencyUni).issueCertificate(ethers.ZeroHash, sampleDocHash1)
      ).to.be.revertedWith("Invalid certificate ID");

      await expect(
        registry.connect(presidencyUni).issueCertificate(sampleCertId1, ethers.ZeroHash)
      ).to.be.revertedWith("Invalid document hash");
    });
  });

  describe("4. Certificate Revocation", function () {
    beforeEach(async function () {
      await registry.connect(admin).registerInstitution(presidencyUni.address, "Presidency University");
      await registry.connect(admin).registerInstitution(abcUni.address, "ABC University");
      await registry.connect(presidencyUni).issueCertificate(sampleCertId1, sampleDocHash1);
      await registry.connect(abcUni).issueCertificate(sampleCertId2, sampleDocHash2);
    });

    it("9. Issuing university can revoke its own certificate", async function () {
      await expect(registry.connect(presidencyUni).revokeCertificate(sampleCertId1))
        .to.emit(registry, "CertificateRevoked")
        .withArgs(sampleCertId1, presidencyUni.address, (val: bigint) => val > 0n);

      const cert = await registry.getCertificate(sampleCertId1);
      expect(cert.exists).to.be.true;
      expect(cert.revoked).to.be.true;
      expect(cert.revocationTimestamp).to.be.gt(0n);
    });

    it("10. Another university cannot revoke the certificate", async function () {
      // ABC University attempts to revoke Presidency University's certificate
      await expect(
        registry.connect(abcUni).revokeCertificate(sampleCertId1)
      ).to.be.revertedWith("Unauthorized: Only issuer or admin can revoke");
    });

    it("11. Admin can revoke a certificate", async function () {
      await expect(registry.connect(admin).revokeCertificate(sampleCertId1))
        .to.emit(registry, "CertificateRevoked")
        .withArgs(sampleCertId1, admin.address, (val: bigint) => val > 0n);

      const cert = await registry.getCertificate(sampleCertId1);
      expect(cert.revoked).to.be.true;
    });

    it("12. Revoked certificate cannot be revoked again", async function () {
      await registry.connect(presidencyUni).revokeCertificate(sampleCertId1);

      await expect(
        registry.connect(presidencyUni).revokeCertificate(sampleCertId1)
      ).to.be.revertedWith("Certificate is already revoked");

      await expect(
        registry.connect(admin).revokeCertificate(sampleCertId1)
      ).to.be.revertedWith("Certificate is already revoked");
    });

    it("Cannot revoke a non-existent certificate", async function () {
      const nonExistentId = ethers.id("NON_EXISTENT_CERT");
      await expect(
        registry.connect(presidencyUni).revokeCertificate(nonExistentId)
      ).to.be.revertedWith("Certificate does not exist");
    });
  });

  describe("5. Institution Suspension & Status Management", function () {
    beforeEach(async function () {
      await registry.connect(admin).registerInstitution(presidencyUni.address, "Presidency University");
      await registry.connect(presidencyUni).issueCertificate(sampleCertId1, sampleDocHash1);
    });

    it("13. Suspended university cannot issue new certificates", async function () {
      // Suspend Presidency University
      await expect(registry.connect(admin).setInstitutionActive(presidencyUni.address, false))
        .to.emit(registry, "InstitutionStatusChanged")
        .withArgs(presidencyUni.address, false, (val: bigint) => val > 0n);

      const inst = await registry.getInstitution(presidencyUni.address);
      expect(inst.isActive).to.be.false;

      // Attempt to issue should revert
      await expect(
        registry.connect(presidencyUni).issueCertificate(sampleCertId2, sampleDocHash2)
      ).to.be.reverted;
    });

    it("14. Certificates issued before suspension remain present in the registry", async function () {
      // Suspend Presidency University
      await registry.connect(admin).setInstitutionActive(presidencyUni.address, false);

      // Verify previously issued certificate is still accessible and not revoked
      const cert = await registry.getCertificate(sampleCertId1);
      expect(cert.exists).to.be.true;
      expect(cert.revoked).to.be.false;
      expect(cert.documentHash).to.equal(sampleDocHash1);
      expect(cert.issuer).to.equal(presidencyUni.address);
    });

    it("Reactivating a suspended university restores issuance capability", async function () {
      await registry.connect(admin).setInstitutionActive(presidencyUni.address, false);

      // Reactivate
      await registry.connect(admin).setInstitutionActive(presidencyUni.address, true);
      const inst = await registry.getInstitution(presidencyUni.address);
      expect(inst.isActive).to.be.true;

      // Now issuance succeeds
      await expect(
        registry.connect(presidencyUni).issueCertificate(sampleCertId2, sampleDocHash2)
      ).to.emit(registry, "CertificateIssued");
    });
  });
});
