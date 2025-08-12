const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const Voting = await ethers.getContractFactory("VotingSystem");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  const contractAddress = voting.target;
  const deployerAddress = deployer.address;
  console.log("Voting deployed to:", contractAddress);
  console.log("Deployer address:", deployerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
