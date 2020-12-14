const { 
    SafeMathLib,
    XNOToken
} = require('../test/helpers/contractArtifacts');

module.exports = async function (deployer, network, accounts) {
    const [owner, pauser, recoverer, ...others] = accounts;
    
    // deploy and link SafeMath
    await deployer.deploy(SafeMathLib);
    await deployer.link(SafeMathLib, XNOToken);

    // deploy XNO
    await deployer.deploy(XNOToken);

    const xno = await XNOToken.deployed();

    // add backup account for XNO Pauser
    await xno.addPauser(pauser, {from: owner });

    // add backup account for XNO Recoverer
    await xno.addRecoverer(recoverer, {from: owner });
}