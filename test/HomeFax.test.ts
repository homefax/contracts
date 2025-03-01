import { expect } from "chai";
import { ethers } from "hardhat";
import { HomeFax } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("HomeFax", function () {
  let homeFax: HomeFax;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let propertyId: bigint;
  let reportId: bigint;

  const propertyData = {
    address: "123 Blockchain Street",
    city: "Crypto City",
    state: "CA",
    zipCode: "94105",
  };

  const reportData = {
    type: "inspection",
    hash: "QmXzYgaP5L9Eqhwgy5ygEwNnfPkqvVeHsAjWBfM4E1KHEv",
    price: ethers.parseEther("0.1"),
  };

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the contract
    const HomeFaxFactory = await ethers.getContractFactory("HomeFax");
    homeFax = await HomeFaxFactory.deploy();

    // Create a property
    const createPropertyTx = await homeFax
      .connect(user1)
      .createProperty(
        propertyData.address,
        propertyData.city,
        propertyData.state,
        propertyData.zipCode
      );
    const receipt = await createPropertyTx.wait();

    // Get the property ID from the event
    const event = receipt?.logs[0];
    const eventData = event?.topics;
    propertyId = BigInt(1); // Assuming this is the first property
  });

  describe("Property Management", function () {
    it("Should create a property correctly", async function () {
      const property = await homeFax.getProperty(propertyId);

      expect(property.propertyAddress).to.equal(propertyData.address);
      expect(property.city).to.equal(propertyData.city);
      expect(property.state).to.equal(propertyData.state);
      expect(property.zipCode).to.equal(propertyData.zipCode);
      expect(property.owner).to.equal(user1.address);
      expect(property.isVerified).to.be.false;
    });

    it("Should update a property correctly", async function () {
      const newAddress = "456 Updated Street";

      await homeFax
        .connect(user1)
        .updateProperty(
          propertyId,
          newAddress,
          propertyData.city,
          propertyData.state,
          propertyData.zipCode
        );

      const property = await homeFax.getProperty(propertyId);
      expect(property.propertyAddress).to.equal(newAddress);
    });

    it("Should verify a property correctly", async function () {
      await homeFax.connect(owner).verifyProperty(propertyId);

      const property = await homeFax.getProperty(propertyId);
      expect(property.isVerified).to.be.true;
    });

    it("Should fail when non-owner tries to verify a property", async function () {
      await expect(
        homeFax.connect(user2).verifyProperty(propertyId)
      ).to.be.revertedWithCustomError(homeFax, "OwnableUnauthorizedAccount");
    });
  });

  describe("Report Management", function () {
    beforeEach(async function () {
      // Create a report
      const createReportTx = await homeFax
        .connect(user1)
        .createReport(
          propertyId,
          reportData.type,
          reportData.hash,
          reportData.price
        );
      const receipt = await createReportTx.wait();

      // Get the report ID from the event
      reportId = BigInt(1); // Assuming this is the first report
    });

    it("Should create a report correctly", async function () {
      const report = await homeFax.getReport(reportId);

      expect(report.propertyId).to.equal(propertyId);
      expect(report.reportType).to.equal(reportData.type);
      expect(report.reportHash).to.equal(reportData.hash);
      expect(report.creator).to.equal(user1.address);
      expect(report.price).to.equal(reportData.price);
      expect(report.isVerified).to.be.false;
    });

    it("Should verify a report correctly", async function () {
      await homeFax.connect(owner).verifyReport(reportId);

      const report = await homeFax.getReport(reportId);
      expect(report.isVerified).to.be.true;
    });

    it("Should allow purchasing a report", async function () {
      await homeFax
        .connect(user2)
        .purchaseReport(reportId, { value: reportData.price });

      const hasPurchased = await homeFax.hasPurchasedReport(
        user2.address,
        reportId
      );
      expect(hasPurchased).to.be.true;
    });

    it("Should fail when payment is insufficient", async function () {
      const insufficientPayment = ethers.parseEther("0.05");

      await expect(
        homeFax
          .connect(user2)
          .purchaseReport(reportId, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should allow access to report content after purchase", async function () {
      await homeFax
        .connect(user2)
        .purchaseReport(reportId, { value: reportData.price });

      const reportContent = await homeFax
        .connect(user2)
        .getReportContent(reportId);
      expect(reportContent).to.equal(reportData.hash);
    });

    it("Should deny access to report content without purchase", async function () {
      await expect(
        homeFax.connect(user2).getReportContent(reportId)
      ).to.be.revertedWith("No access to report content");
    });
  });

  describe("User Properties and Reports", function () {
    it("Should return user properties correctly", async function () {
      const userProperties = await homeFax.getUserProperties(user1.address);
      expect(userProperties.length).to.equal(1);
      expect(userProperties[0]).to.equal(propertyId);
    });

    it("Should return property reports correctly", async function () {
      // Create a report first
      await homeFax
        .connect(user1)
        .createReport(
          propertyId,
          reportData.type,
          reportData.hash,
          reportData.price
        );

      const propertyReports = await homeFax.getPropertyReports(propertyId);
      expect(propertyReports.length).to.equal(1);
    });
  });
});
