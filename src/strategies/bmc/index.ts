import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'justinrwong';
export const version = '0.0.1';

const ogAbi = [
  'function walletMiners(address account) external view returns (uint256[])'
];

const ultraAbi = [
  'function tokensOfOwner(address account) external view returns (uint256[])'
];

const stakingAbi = [
  'function getStakedOGs(address account) external view returns (uint256[])',
  'function getStakedULTRAs(address account) external view returns (uint256[])'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Setup multicall for the OG/Ultra/Staking Contracts
  const ogToken = new Multicaller(network, provider, ogAbi, { blockTag });
  const ultraToken = new Multicaller(network, provider, ultraAbi, { blockTag });
  const stakingOGToken = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });
  const stakingUltraToken = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });
  addresses.forEach((address) => {
    ogToken.call(address, options.og, 'walletMiners', [address]);
    ultraToken.call(address, options.ultra, 'tokensOfOwner', [address]);
    stakingOGToken.call(address, options.staking, 'getStakedOGs', [address]);
    stakingUltraToken.call(address, options.staking, 'getStakedULTRAs', [
      address
    ]);
  });

  // when no assets are held, the contract throws an error, which means it's empty.
  const [ogResponse, ultraResponse, stakedOgResponse, stakedUltraResponse]: [
    Record<string, BigNumber[]>,
    Record<string, BigNumber[]>,
    Record<string, BigNumber[]>,
    Record<string, BigNumber[]>
  ] = await Promise.all([
    ogToken.execute().catch((error) => []),
    ultraToken.execute().catch((error) => []),
    stakingOGToken.execute().catch((error) => []),
    stakingUltraToken.execute().catch((error) => [])
  ]);

  return Object.fromEntries(
    addresses.map((address) => {
      // Ultras are worth 2 voting power. OGs are worth 1 voting power.
      const ogPower = ogResponse[address] ? ogResponse[address].length : 0;
      const ultraPower = ultraResponse[address]
        ? ultraResponse[address].length * 2
        : 0;
      const stakedPower = stakedOgResponse[address]
        ? stakedOgResponse[address].length +
          stakedUltraResponse[address].length * 2
        : 0;
      return [address, ogPower + ultraPower + stakedPower];
    })
  );
}
