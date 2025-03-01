import { ethers } from "hardhat";

async function main() {
  console.log("Deploying HomeFax contract...");

  // Deploy the HomeFax contract
  const HomeFax = await ethers.getContractFactory("HomeFax");
  const homeFax = await HomeFax.deploy();
  await homeFax.waitForDeployment();

  const address = await homeFax.getAddress();
  console.log(`HomeFax deployed to: ${address}`);

  console.log("Deployment completed successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
