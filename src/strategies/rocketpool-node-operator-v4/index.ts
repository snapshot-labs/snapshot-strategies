import { Multicaller } from '../../utils';
import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'rocket-pool';
export const version = '0.1.4';

const rocketNetworkVoting = '0xA9d27E1952f742d659143a544d3e535fFf3Eebe1';
const rocketNetworkVotingAbi = [
  'function getVotingPower(address _nodeAddress, uint32 _block) external view returns (uint256)'
];


export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {

  const blockTag = typeof snapshot === 'number' ? snapshot : await provider.getBlockNumber();

  const nodeVotingPower = new Multicaller(
    network,
    provider,
    rocketNetworkVotingAbi,
    { blockTag }
  );

  addresses.forEach((address) => {
    nodeVotingPower.call(address, rocketNetworkVoting, 'getVotingPower', [
      address,
      blockTag
    ]);
  });

  const nodeVotingPowerResponse: Record<string, BigNumberish> =
    await nodeVotingPower.execute();

  const merged = addresses.map((address) => {
    const votePower = nodeVotingPowerResponse[address];
    return {
      address: address,
      votePower: votePower,
    };
  });

  const reduced: Record<string, BigNumberish> = merged.reduce((acc, obj) => {
    acc[obj.address] = obj.votePower;
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(reduced).map(([address, votePower]) => [
      address,
      parseFloat(formatUnits(votePower, options.decimals))
    ])
  );
}
