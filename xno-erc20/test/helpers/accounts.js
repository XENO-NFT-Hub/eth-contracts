const consants = require('./constants');
const bip39 = require('bip39');
const { hdkey } = require('ethereumjs-wallet');

async function accountsData(number) {
    const seed = await bip39.mnemonicToSeed(process.env.MNEMONIC);
    const hdk = hdkey.fromMasterSeed(seed);
    let accounts = [];
    for (let i = 0; i < number; i++) {
        const path = "m/44'/60'/0'/0/"+i; // bip 44 for Ethereum
        const addr_node = hdk.derivePath(path);
        const addr = addr_node.getWallet().getAddressString();
        const public_key = addr_node.getWallet().getPublicKey();
        const private_key = addr_node.getWallet().getPrivateKey();
        let obj = {
            address: addr,
            publicKey: public_key,
            privateKey: private_key
        }
        accounts.push(obj);
        if(i >= number - 1) {
            return accounts;
        }
    }
}

module.exports = {
    accountsData
};
