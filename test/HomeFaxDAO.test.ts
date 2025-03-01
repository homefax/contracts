import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("HomeFaxDAO", function () {
  let homeFaxToken: Contract;
  let homeFaxTimelock: Contract;
  let homeFaxDAO: Contract;
  let homeFax: Contract;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let addr3: HardhatEthersSigner;

  const minDelay = 60 * 60 * 24; // 1 day in seconds
  const votingDelay = 1; // 1 block
  const votingPeriod = 5; // 5 blocks
  const quorumPercentage = 4; // 4% quorum

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy HomeFax contract
    const HomeFax = await ethers.getContractFactory("HomeFax");
    homeFax = await HomeFax.deploy();
    await homeFax.waitForDeployment();

    // Deploy HomeFaxToken
    const HomeFaxToken = await ethers.getContractFactory("HomeFaxToken");
    homeFaxToken = await HomeFaxToken.deploy();
    await homeFaxToken.waitForDeployment();

    // Deploy HomeFaxTimelock
    const HomeFaxTimelock = await ethers.getContractFactory("HomeFaxTimelock");
    homeFaxTimelock = await HomeFaxTimelock.deploy(
      minDelay,
      [], // proposers - will be set later
      [], // executors - will be set later
      owner.address // admin
    );
    await homeFaxTimelock.waitForDeployment();

    // Deploy HomeFaxDAO
    const HomeFaxDAO = await ethers.getContractFactory("HomeFaxDAO");
    homeFaxDAO = await HomeFaxDAO.deploy(
      await homeFaxToken.getAddress(),
      await homeFaxTimelock.getAddress(),
      votingDelay,
      votingPeriod,
      quorumPercentage
    );
    await homeFaxDAO.waitForDeployment();

    // Set up roles for the Timelock
    const proposerRole = await homeFaxTimelock.PROPOSER_ROLE();
    const executorRole = await homeFaxTimelock.EXECUTOR_ROLE();
    const adminRole = await homeFaxTimelock.TIMELOCK_ADMIN_ROLE();

    await homeFaxTimelock.grantRole(
      proposerRole,
      await homeFaxDAO.getAddress()
    );
    await homeFaxTimelock.grantRole(executorRole, ethers.ZeroAddress);
    await homeFaxTimelock.revokeRole(adminRole, owner.address);

    // Transfer ownership of HomeFax to the Timelock
    await homeFax.transferOwnership(await homeFaxTimelock.getAddress());

    // Grant BACKEND_ROLE to the Timelock
    const backendRole = await homeFax.BACKEND_ROLE();
    await homeFax.grantRole(backendRole, await homeFaxTimelock.getAddress());

    // Delegate voting power
    await homeFaxToken.delegate(owner.address);

    // Transfer some tokens to addr1 and addr2 for voting
    await homeFaxToken.transfer(addr1.address, ethers.parseEther("100000"));
    await homeFaxToken.transfer(addr2.address, ethers.parseEther("100000"));

    // Delegate voting power for addr1 and addr2
    await homeFaxToken.connect(addr1).delegate(addr1.address);
    await homeFaxToken.connect(addr2).delegate(addr2.address);
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await homeFaxDAO.token()).to.equal(
        await homeFaxToken.getAddress()
      );
    });

    it("Should set the correct timelock address", async function () {
      expect(await homeFaxDAO.timelock()).to.equal(
        await homeFaxTimelock.getAddress()
      );
    });

    it("Should set the correct voting delay", async function () {
      expect(await homeFaxDAO.votingDelay()).to.equal(votingDelay);
    });

    it("Should set the correct voting period", async function () {
      expect(await homeFaxDAO.votingPeriod()).to.equal(votingPeriod);
    });

    it("Should set the correct quorum percentage", async function () {
      expect(await homeFaxDAO.quorumNumerator()).to.equal(quorumPercentage);
    });

    it("Should transfer ownership of HomeFax to the Timelock", async function () {
      expect(await homeFax.owner()).to.equal(
        await homeFaxTimelock.getAddress()
      );
    });
  });

  describe("Governance", function () {
    it("Should allow creating a proposal to update payment distribution", async function () {
      // Encode the function call
      const homeFaxInterface = new ethers.Interface([
        "function updatePaymentDistribution(uint256 _daoSharePercentage, uint256 _authorSharePercentage, uint256 _ownerSharePercentage)",
      ]);

      const calldata = homeFaxInterface.encodeFunctionData(
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
        [await homeFax.getAddress()], // targets
        [0], // values
        [calldata], // calldatas
        description // description
      );

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      // Get the proposal ID from the event
      const proposalId = await homeFaxDAO.hashProposal(
        [await homeFax.getAddress()],
        [0],
        [calldata],
        ethers.keccak256(ethers.toUtf8Bytes(description))
      );

      // Check that the proposal was created
      expect(await homeFaxDAO.state(proposalId)).to.equal(0); // Pending
    });

    it("Should allow voting on a proposal", async function () {
      // Encode the function call
      const homeFaxInterface = new ethers.Interface([
        "function updateMinimumReportPrice(uint256 _minimumReportPrice)",
      ]);

      const calldata = homeFaxInterface.encodeFunctionData(
        "updateMinimumReportPrice",
        [
          ethers.parseEther("0.05"), // 0.05 ETH
        ]
      );

      // Create the proposal
      const description = "Update minimum report price to 0.05 ETH";
      await homeFaxDAO.propose(
        [await homeFax.getAddress()], // targets
        [0], // values
        [calldata], // calldatas
        description // description
      );

      // Get the proposal ID
      const proposalId = await homeFaxDAO.hashProposal(
        [await homeFax.getAddress()],
        [0],
        [calldata],
        ethers.keccak256(ethers.toUtf8Bytes(description))
      );

      // Mine a block to move past the voting delay
      await ethers.provider.send("evm_mine", []);

      // Vote on the proposal
      await homeFaxDAO.castVote(proposalId, 1); // 1 = For
      await homeFaxDAO.connect(addr1).castVote(proposalId, 1); // 1 = For
      await homeFaxDAO.connect(addr2).castVote(proposalId, 0); // 0 = Against

      // Check the vote counts
      const proposalVotes = await homeFaxDAO.proposalVotes(proposalId);
      expect(proposalVotes.forVotes).to.be.gt(proposalVotes.againstVotes);
    });

    it("Should execute a successful proposal", async function () {
      // Encode the function call
      const homeFaxInterface = new ethers.Interface([
        "function updateVerificationRequired(bool _verificationRequired)",
      ]);

      const calldata = homeFaxInterface.encodeFunctionData(
        "updateVerificationRequired",
        [
          true, // Enable verification requirement
        ]
      );

      // Create the proposal
      const description = "Enable verification requirement";
      await homeFaxDAO.propose(
        [await homeFax.getAddress()], // targets
        [0], // values
        [calldata], // calldatas
        description // description
      );

      // Get the proposal ID
      const proposalId = await homeFaxDAO.hashProposal(
        [await homeFax.getAddress()],
        [0],
        [calldata],
        ethers.keccak256(ethers.toUtf8Bytes(description))
      );

      // Mine a block to move past the voting delay
      await ethers.provider.send("evm_mine", []);

      // Vote on the proposal
      await homeFaxDAO.castVote(proposalId, 1); // 1 = For
      await homeFaxDAO.connect(addr1).castVote(proposalId, 1); // 1 = For

      // Mine blocks to move past the voting period
      for (let i = 0; i < votingPeriod; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Queue the proposal
      await homeFaxDAO.queue(
        [await homeFax.getAddress()],
        [0],
        [calldata],
        ethers.keccak256(ethers.toUtf8Bytes(description))
      );

      // Move time forward past the timelock delay
      await ethers.provider.send("evm_increaseTime", [minDelay + 1]);
      await ethers.provider.send("evm_mine", []);

      // Execute the proposal
      await homeFaxDAO.execute(
        [await homeFax.getAddress()],
        [0],
        [calldata],
        ethers.keccak256(ethers.toUtf8Bytes(description))
      );

      // Check that the setting was updated
      expect(await homeFax.verificationRequired()).to.equal(true);
    });
  });
});
