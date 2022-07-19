import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-ethers"
import "@nomicfoundation/hardhat-chai-matchers"
let secrets = require("./secrets.json")

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    bsctestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: [secrets.BSC_TESTNET_PRIVATE_KEY],
      chainId: 97,
      gasPrice: 20000000000,
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${secrets.ALCHEMY_API_KEY}`,
      accounts: [secrets.GOERLI_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: secrets.BSC_SCAN_API,
  },
};

export default config;
