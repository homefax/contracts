# HomeFax Smart Contracts

This directory contains the smart contracts for the HomeFax platform, a blockchain-based property history solution.

## Technology Stack

- Solidity for smart contract development
- Hardhat development environment
- OpenZeppelin contracts for security and standards
- TypeScript for testing and deployment scripts
- Ethers.js for blockchain interaction

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the contracts directory:
   ```bash
   cd contracts
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
5. Update the environment variables in the `.env` file as needed

### Compiling Contracts

To compile the smart contracts:

```bash
npx hardhat compile
```

### Running Tests

To run the tests:

```bash
npx hardhat test
```

To run tests with gas reporting:

```bash
REPORT_GAS=true npx hardhat test
```

### Deploying Contracts

To deploy to a local Hardhat network:

```bash
npx hardhat node
```

In a separate terminal:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

To deploy to Base Goerli testnet:

```bash
npx hardhat run scripts/deploy.ts --network baseGoerli
```

To deploy to Base mainnet:

```bash
npx hardhat run scripts/deploy.ts --network base
```

## Project Structure

```
contracts/
├── contracts/          # Smart contracts
│   └── HomeFax.sol     # Main HomeFax contract
├── scripts/            # Deployment and utility scripts
│   └── deploy.ts       # Deployment script
├── test/               # Tests
│   └── HomeFax.test.ts # Tests for HomeFax contract
├── .env.example        # Example environment variables
├── hardhat.config.ts   # Hardhat configuration
└── package.json        # Dependencies and scripts
```

## Smart Contracts

### HomeFax.sol

The main contract for the HomeFax platform. It provides functionality for:

- Creating and managing property records
- Creating and managing property reports
- Purchasing access to reports
- Verifying properties and reports

## Security

The contracts use several security features:

- OpenZeppelin's Ownable for access control
- OpenZeppelin's ReentrancyGuard to prevent reentrancy attacks
- Proper input validation
- Event emission for transparency

## Deployment Addresses

### Base Goerli (Testnet)

- HomeFax: `0x0000000000000000000000000000000000000000` (placeholder)

### Base Mainnet

- HomeFax: `0x0000000000000000000000000000000000000000` (placeholder)

## Available Scripts

- `npx hardhat compile` - Compiles the contracts
- `npx hardhat test` - Runs tests
- `npx hardhat node` - Starts a local Hardhat network
- `npx hardhat run scripts/deploy.ts` - Deploys the contracts
- `npx hardhat verify` - Verifies contracts on Etherscan
- `npx hardhat clean` - Clears the cache and deletes artifacts
- `npx hardhat coverage` - Generates a code coverage report

## Hardhat Tasks

The project includes several custom Hardhat tasks:

- `accounts` - Prints the list of accounts
- `balance` - Prints an account's balance
- `block-number` - Prints the current block number

Example:

```bash
npx hardhat accounts
```

## Gas Optimization

The contracts are optimized for gas efficiency:

- Using structs to organize data
- Using mappings for efficient lookups
- Minimizing storage operations
- Using events for off-chain indexing

## Learn More

For more information about the HomeFax platform, see the main [README.md](../README.md) file.

For detailed documentation of the smart contracts, see [smart-contracts.md](../docs/contracts/smart-contracts.md).
