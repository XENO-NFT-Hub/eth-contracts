require('dotenv').config();

const { MNEMONIC } = require('./test/helpers/constants');

const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    mainnet: {
      provider: function() {
        return new HDWalletProvider({
            mnemonic: {
              phrase: process.env.MNEMONIC
            },
            providerOrUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
            addressIndex: 0,
            numberOfAddresses: 1
          });
      },
      gas: 2500000,
      gasPrice: 75000000000,
      confirmations: 2,
      network_id: 1
    },
    development: {
        provider: function() {
            return new HDWalletProvider({
                mnemonic: {
                    phrase: MNEMONIC
                  },
                  providerOrUrl: `http://127.0.0.1:7545`,
                  addressIndex: 0,
                  numberOfAddresses: 10
                }
            )
        },
        gasPrice: 100000000000,
        network_id: "*",
    }
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.6.10",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: false,
         runs: 200
       }
      //  evmVersion: "byzantium"
      }
    }
  }
}