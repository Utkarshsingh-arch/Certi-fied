import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [admin, presidencyUni, abcUni] = await ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("UniChain — CertificateRegistry Deployment");
  console.log("----------------------------------------------------");
  console.log("Deploying contract with Consortium Admin account:", admin.address);

  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("CertificateRegistry deployed at:", registryAddress);

  // Register demo universities if in local environment
  console.log("\nRegistering initial consortium institutions...");

  const tx1 = await registry.registerInstitution(
    presidencyUni.address,
    "Presidency University"
  );
  await tx1.wait();
  console.log(`Registered Presidency University: ${presidencyUni.address}`);

  const tx2 = await registry.registerInstitution(
    abcUni.address,
    "ABC University"
  );
  await tx2.wait();
  console.log(`Registered ABC University: ${abcUni.address}`);

  // Prepare deployment artifact for frontend
  const frontendConfigDir = path.join(__dirname, "../../frontend/src/blockchain");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  // Read compiled artifact to extract ABI
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"
  );

  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    abi = artifact.abi;
  }

  const deploymentData = {
    contractAddress: registryAddress,
    network: {
      name: (await ethers.provider.getNetwork()).name,
      chainId: Number((await ethers.provider.getNetwork()).chainId),
    },
    demoAccounts: {
      admin: admin.address,
      presidencyUniversity: presidencyUni.address,
      abcUniversity: abcUni.address,
    },
    abi: abi,
  };

  fs.writeFileSync(
    path.join(frontendConfigDir, "deployedContract.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("\nFrontend configuration exported to frontend/src/blockchain/deployedContract.json");
  console.log("----------------------------------------------------");
  console.log("Deployment completed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
