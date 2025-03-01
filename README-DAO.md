# HomeFaxDAO Governance

This document provides information about the HomeFaxDAO governance system and how to interact with it.

## Overview

HomeFaxDAO is a decentralized autonomous organization (DAO) that governs the HomeFax protocol. The DAO is responsible for making decisions about the protocol's parameters, such as payment distribution percentages, minimum report prices, and verification requirements.

The governance system consists of three main components:

1. **HomeFaxToken (HFX)**: The governance token used for voting on proposals.
2. **HomeFaxTimelock**: A timelock controller that executes approved proposals after a delay.
3. **HomeFaxDAO**: The governor contract that manages proposals and voting.

## Deployment

The HomeFaxDAO has been deployed on DecentDAO at address: `0xB2cf0B08363Da450B689B85eFC4d19921C9Ae671`

For future deployments, the DAO contracts can be deployed using the `deploy-dao.ts` script:

```bash
npx hardhat run scripts/deploy-dao.ts --network baseGoerli
```

This script will:

1. Deploy the HomeFaxToken (HFX) contract
2. Deploy the HomeFaxTimelock contract
3. Deploy the HomeFaxDAO contract
4. Set up the roles for the Timelock
5. Transfer ownership of the HomeFax contract to the Timelock
6. Grant the BACKEND_ROLE to the Timelock

## Creating Proposals

Proposals can be created by any HFX token holder with enough voting power. The `generate-proposal-templates.ts` script provides templates for common proposals:

```bash
npx hardhat run scripts/generate-proposal-templates.ts
```

This will generate proposal templates for:

1. Updating payment distribution percentages
2. Updating the minimum report price
3. Updating whether verification is required for reports

### Proposal Process

1. **Create a proposal**: Use the governor contract's `propose` function with the targets, values, calldatas, and description.
2. **Vote on the proposal**: Token holders can vote on the proposal during the voting period.
3. **Queue the proposal**: If the proposal passes, it can be queued for execution.
4. **Execute the proposal**: After the timelock delay, the proposal can be executed.

## Configurable Parameters

The HomeFax contract has several parameters that can be modified through DAO governance:

### Payment Distribution

The payment distribution for report purchases can be configured with the following parameters:

- `daoSharePercentage`: Percentage of the payment that goes to the DAO (default: 20%)
- `authorSharePercentage`: Percentage of the payment that goes to the report author (default: 40%)
- `ownerSharePercentage`: Percentage of the payment that goes to the report owner (default: 40%)

To update these parameters, create a proposal that calls the `updatePaymentDistribution` function on the HomeFax contract.

### Minimum Report Price

The minimum price for creating a report can be configured with the `minimumReportPrice` parameter (default: 0.01 ETH).

To update this parameter, create a proposal that calls the `updateMinimumReportPrice` function on the HomeFax contract.

### Verification Requirement

Whether reports require verification before purchase can be configured with the `verificationRequired` parameter (default: false).

To update this parameter, create a proposal that calls the `updateVerificationRequired` function on the HomeFax contract.

## Integration with BASE

The HomeFaxDAO is deployed on the BASE network, which provides several benefits:

- Fast and low-cost transactions
- Integration with the Coinbase ecosystem
- Access to BASE's developer tools and resources

## Integration with DecentDAO

The HomeFaxDAO is created using DecentDAO's governance framework and has been deployed at address `0xB2cf0B08363Da450B689B85eFC4d19921C9Ae671`. DecentDAO provides:

- Secure and audited governance contracts
- Flexible proposal and voting mechanisms
- Integration with DecentDAO's ecosystem
- Simplified deployment and management of DAOs

## Example: Creating a Proposal to Update Payment Distribution

Here's an example of how to create a proposal to update the payment distribution:

```javascript
// Get the HomeFaxDAO contract
const homeFaxDAO = await ethers.getContractAt(
  "HomeFaxDAO",
  "0xB2cf0B08363Da450B689B85eFC4d19921C9Ae671"
);

// Get the HomeFax contract
const homeFax = await ethers.getContractAt("HomeFax", homeFaxAddress);

// Encode the function call
const calldata = homeFax.interface.encodeFunctionData(
  "updatePaymentDistribution",
  [
    30, // 30% for the DAO
    35, // 35% for the author
    35, // 35% for the owner
  ]
);

// Create the proposal
const description = "Update payment distribution to 30/35/35";
const tx = await homeFaxDAO.propose(
  [homeFaxAddress], // targets
  [0], // values
  [calldata], // calldatas
  description // description
);

// Wait for the transaction to be mined
const receipt = await tx.wait();

// Get the proposal ID from the event
const event = receipt.events.find((e) => e.event === "ProposalCreated");
const proposalId = event.args.proposalId;

console.log(`Proposal created with ID: ${proposalId}`);
```

## Conclusion

The HomeFaxDAO governance system provides a decentralized way to manage the HomeFax protocol. By using the proposal templates and following the proposal process, token holders can participate in the governance of the protocol and help shape its future.
