const { BN } = require('./setup');

module.exports = {
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  BYTES_ZERO: '0x0000000000000000000000000000000000000000000000000000000000000000',
  MAX_UINT256: new BN('2').pow(new BN('256')).sub(new BN('1')),
  MAX_INT256: new BN('2').pow(new BN('255')).sub(new BN('1')),
  MIN_INT256: new BN('2').pow(new BN('255')).mul(new BN('-1')),
  TEN_POW_18: new BN(10).pow(new BN(18)),
  MNEMONIC: 'logic episode nut illness vacant cover animal globe shed sound shop belt',
};