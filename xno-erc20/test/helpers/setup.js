const chai = require('chai');
const web3 = require('web3-utils');
const BN = web3.BN;


const should = chai
  .use(require('chai-bn')(BN))
  .should();

module.exports = {
  BN,
  expect: chai.expect,
  should,
};