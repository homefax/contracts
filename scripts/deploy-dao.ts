import { HardhatRuntimeEnvironment } from "hardhat/types";

async function main() {
  // Get the Hardhat Runtime Environment
  const hre = require("hardhat");
  const ethers = hre.ethers;

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy HomeFaxToken
  console.log("Deploying HomeFaxToken...");
  const HomeFaxToken = await ethers.getContractFactory("HomeFaxToken");
  const homeFaxToken = await HomeFaxToken.deploy();
  await homeFaxToken.waitForDeployment();
  const homeFaxTokenAddress = await homeFaxToken.getAddress();
  console.log("HomeFaxToken deployed to:", homeFaxTokenAddress);

  // Deploy HomeFaxTimelock
  console.log("Deploying HomeFaxTimelock...");
  const minDelay = 60 * 60 * 24; // 1 day in seconds
  const HomeFaxTimelock = await ethers.getContractFactory("HomeFaxTimelock");
  const homeFaxTimelock = await HomeFaxTimelock.deploy(
    minDelay,
    [], // proposers - will be set later
    [], // executors - will be set later
    deployer.address // admin
  );
  await homeFaxTimelock.waitForDeployment();
  const homeFaxTimelockAddress = await homeFaxTimelock.getAddress();
  console.log("HomeFaxTimelock deployed to:", homeFaxTimelockAddress);

  // Deploy HomeFaxDAO
  console.log("Deploying HomeFaxDAO...");
  const votingDelay = 1; // 1 block
  const votingPeriod = (60 * 60 * 24 * 3) / 12; // 3 days in blocks (assuming 12s block time)
  const quorumPercentage = 4; // 4% quorum

  const HomeFaxDAO = await ethers.getContractFactory("HomeFaxDAO");
  const homeFaxDAO = await HomeFaxDAO.deploy(
    homeFaxTokenAddress,
    homeFaxTimelockAddress,
    votingDelay,
    votingPeriod,
    quorumPercentage
  );
  await homeFaxDAO.waitForDeployment();
  const homeFaxDAOAddress = await homeFaxDAO.getAddress();
  console.log("HomeFaxDAO deployed to:", homeFaxDAOAddress);

  // Set up roles for the Timelock
  console.log("Setting up roles for the Timelock...");

  // Get the timelock contract with the deployer signer
  const timelock = await ethers.getContractAt(
    "HomeFaxTimelock",
    homeFaxTimelockAddress,
    deployer
  );

  // Grant proposer role to the Governor
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();

  // Setup the governance contracts
  await timelock.grantRole(proposerRole, homeFaxDAOAddress);
  console.log("Proposer role granted to HomeFaxDAO");

  // Anyone can execute
  await timelock.grantRole(executorRole, ethers.ZeroAddress);
  console.log("Executor role granted to everyone");

  // Revoke admin role from deployer
  await timelock.revokeRole(adminRole, deployer.address);
  console.log("Admin role revoked from deployer");

  // Get the existing HomeFax contract
  console.log("Connecting to existing HomeFax contract...");
  const homeFaxAddress = process.env.HOMEFAX_CONTRACT_ADDRESS;
  if (!homeFaxAddress) {
    throw new Error(
      "HOMEFAX_CONTRACT_ADDRESS not set in environment variables"
    );
  }

  const homeFax = await ethers.getContractAt(
    "HomeFax",
    homeFaxAddress,
    deployer
  );
  console.log("Connected to HomeFax at:", homeFaxAddress);

  // Transfer ownership of HomeFax to the Timelock
  console.log("Transferring ownership of HomeFax to the Timelock...");
  await homeFax.transferOwnership(homeFaxTimelockAddress);
  console.log("Ownership transferred to Timelock");

  // Grant BACKEND_ROLE to the Timelock
  console.log("Granting BACKEND_ROLE to the Timelock...");
  const backendRole = await homeFax.BACKEND_ROLE();
  await homeFax.grantRole(backendRole, homeFaxTimelockAddress);
  console.log("BACKEND_ROLE granted to Timelock");

  console.log("DAO deployment complete!");
  console.log({
    homeFaxTokenAddress,
    homeFaxTimelockAddress,
    homeFaxDAOAddress,
    homeFaxAddress,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
