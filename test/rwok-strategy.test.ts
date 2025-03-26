import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { strategy } from '../src/strategies/rwok-staked';

describe('RWOK Staked NFT Strategy', () => {
  const provider = new StaticJsonRpcProvider('https://mainnet.base.org');
  const space = 'test-space';
  const network = '8453';
  const options = {};
  const snapshot = 'latest';

  const testAddresses = [
    '0x182db357b1a92a689b428382672Ac6Cd76725D71'
  ];

  it('should return correct voting power for addresses with staked NFTs', async () => {
    const result = await strategy(
      space,
      network,
      provider,
      testAddresses,
      options,
      snapshot
    );

    // Check address (5 staked NFTs)
    expect(result[testAddresses[0]]).toBe(1500150); // 5 * 300030
  });

  it('should handle addresses with no staked NFTs', async () => {
    const noStakeAddress = '0x0000000000000000000000000000000000000000';
    const result = await strategy(
      space,
      network,
      provider,
      [noStakeAddress],
      options,
      snapshot
    );

    expect(result[noStakeAddress]).toBe(0);
  });

  it('should handle invalid addresses', async () => {
    const invalidAddress = '0xinvalid';
    const result = await strategy(
      space,
      network,
      provider,
      [invalidAddress],
      options,
      snapshot
    );

    expect(result[invalidAddress]).toBe(0);
  });
}); 