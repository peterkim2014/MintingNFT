require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: "https://rpc.sepolia.org",
      accounts: ["739dbe74c709cad085539db5a077a31445adc9999ead07b64e2d62dd8f9d7e22"], // Replace with your private key
    },
  },
};
