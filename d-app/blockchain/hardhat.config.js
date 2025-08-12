// require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.20",
// };
require("@nomicfoundation/hardhat-ethers"); // Instead of @nomiclabs version

const API_KEY = "FJoHZNKQUkG1usuJMA-2_i9ny2a82Y3u";
const PRIVATE_KEY =
  "13344b6fa0f06d4445660df1df7b92d6474d21c195c642b0d959c9e651ff70e0";
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${API_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
    },
  },
};
