import { ethers } from "ethers";

/**
 * This script generates proposal templates for the HomeFaxDAO
 * These templates can be used to create proposals to modify the HomeFax contract settings
 */

// ABI fragments for the HomeFax contract functions we want to call
const homeFaxABI = [
  "function updatePaymentDistribution(uint256 _daoSharePercentage, uint256 _authorSharePercentage, uint256 _ownerSharePercentage)",
  "function updateMinimumReportPrice(uint256 _minimumReportPrice)",
  "function updateVerificationRequired(bool _verificationRequired)",
];

/**
 * Generates a proposal to update the payment distribution percentages
 * @param homeFaxAddress The address of the HomeFax contract
 * @param daoSharePercentage Percentage for the DAO
 * @param authorSharePercentage Percentage for the author
 * @param ownerSharePercentage Percentage for the owner
 * @returns The proposal data
 */
function generateUpdatePaymentDistributionProposal(
  homeFaxAddress: string,
  daoSharePercentage: number,
  authorSharePercentage: number,
  ownerSharePercentage: number
) {
  // Validate percentages
  if (
    daoSharePercentage + authorSharePercentage + ownerSharePercentage !==
    100
  ) {
    throw new Error("Percentages must add up to 100");
  }

  const homeFaxInterface = new ethers.Interface(homeFaxABI);
  const calldata = homeFaxInterface.encodeFunctionData(
    "updatePaymentDistribution",
    [daoSharePercentage, authorSharePercentage, ownerSharePercentage]
  );

  const description = `
# Update Payment Distribution

This proposal updates the payment distribution percentages for report purchases:

- DAO Share: ${daoSharePercentage}%
- Author Share: ${authorSharePercentage}%
- Owner Share: ${ownerSharePercentage}%

## Rationale

[Provide rationale for the change here]

## Technical Details

This proposal calls the \`updatePaymentDistribution\` function on the HomeFax contract with the following parameters:
- daoSharePercentage: ${daoSharePercentage}
- authorSharePercentage: ${authorSharePercentage}
- ownerSharePercentage: ${ownerSharePercentage}
`;

  return {
    targets: [homeFaxAddress],
    values: [0],
    calldatas: [calldata],
    description,
  };
}

/**
 * Generates a proposal to update the minimum report price
 * @param homeFaxAddress The address of the HomeFax contract
 * @param minimumReportPrice The new minimum price for reports (in wei)
 * @returns The proposal data
 */
function generateUpdateMinimumReportPriceProposal(
  homeFaxAddress: string,
  minimumReportPrice: string
) {
  const homeFaxInterface = new ethers.Interface(homeFaxABI);
  const calldata = homeFaxInterface.encodeFunctionData(
    "updateMinimumReportPrice",
    [minimumReportPrice]
  );

  const ethValue = ethers.formatEther(minimumReportPrice);

  const description = `
# Update Minimum Report Price

This proposal updates the minimum price for reports to ${ethValue} ETH.

## Rationale

[Provide rationale for the change here]

## Technical Details

This proposal calls the \`updateMinimumReportPrice\` function on the HomeFax contract with the following parameter:
- minimumReportPrice: ${minimumReportPrice} wei (${ethValue} ETH)
`;

  return {
    targets: [homeFaxAddress],
    values: [0],
    calldatas: [calldata],
    description,
  };
}

/**
 * Generates a proposal to update whether verification is required for reports
 * @param homeFaxAddress The address of the HomeFax contract
 * @param verificationRequired Whether verification is required
 * @returns The proposal data
 */
function generateUpdateVerificationRequiredProposal(
  homeFaxAddress: string,
  verificationRequired: boolean
) {
  const homeFaxInterface = new ethers.Interface(homeFaxABI);
  const calldata = homeFaxInterface.encodeFunctionData(
    "updateVerificationRequired",
    [verificationRequired]
  );

  const description = `
# Update Verification Required

This proposal ${
    verificationRequired ? "enables" : "disables"
  } the requirement for reports to be verified before purchase.

## Rationale

[Provide rationale for the change here]

## Technical Details

This proposal calls the \`updateVerificationRequired\` function on the HomeFax contract with the following parameter:
- verificationRequired: ${verificationRequired}
`;

  return {
    targets: [homeFaxAddress],
    values: [0],
    calldatas: [calldata],
    description,
  };
}

// Example usage
async function main() {
  // Replace with the actual HomeFax contract address
  const homeFaxAddress =
    process.env.HOMEFAX_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000";

  // Generate proposal templates
  const updatePaymentDistributionProposal =
    generateUpdatePaymentDistributionProposal(
      homeFaxAddress,
      30, // 30% for the DAO
      35, // 35% for the author
      35 // 35% for the owner
    );

  const updateMinimumReportPriceProposal =
    generateUpdateMinimumReportPriceProposal(
      homeFaxAddress,
      ethers.parseEther("0.05").toString() // 0.05 ETH
    );

  const updateVerificationRequiredProposal =
    generateUpdateVerificationRequiredProposal(
      homeFaxAddress,
      true // Enable verification requirement
    );

  // Print the proposal templates
  console.log("=== Update Payment Distribution Proposal ===");
  console.log(JSON.stringify(updatePaymentDistributionProposal, null, 2));
  console.log("\n");

  console.log("=== Update Minimum Report Price Proposal ===");
  console.log(JSON.stringify(updateMinimumReportPriceProposal, null, 2));
  console.log("\n");

  console.log("=== Update Verification Required Proposal ===");
  console.log(JSON.stringify(updateVerificationRequiredProposal, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
