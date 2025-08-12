const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");

describe("VotingSystem - Multi-topic Ownership", function () {
  let VotingSystem, voting, owner1, owner2, voter1, voter2;

  beforeEach(async function () {
    [owner1, owner2, voter1, voter2] = await ethers.getSigners();
    VotingSystem = await ethers.getContractFactory("VotingSystem");
    voting = await VotingSystem.deploy();
    await voting.waitForDeployment();
  });

  it("Should allow multiple topic owners to manage their topics independently", async function () {
    // Owner 1 creates topic A
    await voting.connect(owner1).createVotingTopic("A", "Topic A");
    // Owner 2 creates topic B
    await voting.connect(owner2).createVotingTopic("B", "Topic B");

    // Owner 1 adds candidate to Topic A
    await voting.connect(owner1).addCandidate("A", 1, "Alice");
    // Owner 2 adds candidate to Topic B
    await voting.connect(owner2).addCandidate("B", 2, "Bob");

    // Voter1 registers and is verified for Topic A
    await voting.connect(voter1).registerVoter("A");
    await voting.connect(owner1).verifyVoter("A", voter1.address);
    await voting.connect(voter1).vote("A", 1);

    // Voter2 registers and is verified for Topic B
    await voting.connect(voter2).registerVoter("B");
    await voting.connect(owner2).verifyVoter("B", voter2.address);
    await voting.connect(voter2).vote("B", 2);

    // Owner 1 publishes result for Topic A
    await voting.connect(owner1).publishResult("A");
    const winnerA = await voting.getWinner("A");
    expect(winnerA.name).to.equal("Alice");

    // Owner 2 publishes result for Topic B
    await voting.connect(owner2).publishResult("B");
    const winnerB = await voting.getWinner("B");
    expect(winnerB.name).to.equal("Bob");
  });

  it("Should prevent unauthorized access by non-topic owners", async function () {
    await voting.connect(owner1).createVotingTopic("X", "Topic X");
    await expect(
      voting.connect(owner2).addCandidate("X", 1, "Mallory")
    ).to.be.revertedWith("Not the topic owner");
  });
});
