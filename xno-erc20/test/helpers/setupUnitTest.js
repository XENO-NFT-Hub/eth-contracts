const contractArtifacts = require('./contractArtifacts');
const { BN } = require('./setup');

async function setUpUnitTest (accounts) {
  const [owner, minter, pauser, recoverer, ...others] = accounts;

  const SafeMathLib = await contractArtifacts.SafeMathLib.new();

  const libs = {
    SafeMathLib: SafeMathLib.address,
  };

  await contractArtifacts.XNOToken.link(libs);

  let XNOToken = await contractArtifacts.XNOToken.new({ from: owner });

  const contracts = {XNOToken: XNOToken};
  return { instances: contracts };
}

module.exports = {
  setUpUnitTest,
};