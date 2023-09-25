import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'rocket-pool';
export const version = '0.1.3';

const rocketNetworkPricesAddress = '0xd3f500F550F46e504A4D2153127B47e007e11166';
const rocketNetworkPricesContractAbi = [
  'function getRPLPrice() external view returns (uint256)'
];
const rocketNodeStakingAddress = '0x0d8D8f8541B12A0e1194B7CC4b6D954b90AB82ec';
const rocketNodeStakingContractAbi = [
  'function getNodeEffectiveRPLStake(address _nodeAddress) external view returns (uint256)',
  'function getNodeRPLStake(address _nodeAddress) external view returns (uint256)',
  'function getNodeETHProvided(address _nodeAddress) external view returns (uint256)'
];

function minBN(a, b) {
  return a.lt(b) ? a : b;
}
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const nodeRPLStake = new Multicaller(
    network,
    provider,
    rocketNodeStakingContractAbi,
    { blockTag }
  );

  const nodeETHProvided = new Multicaller(
    network,
    provider,
    rocketNodeStakingContractAbi,
    { blockTag }
  );

  const RPLPrice = new Multicaller(
    network,
    provider,
    rocketNetworkPricesContractAbi,
    { blockTag }
  );

  addresses.forEach((address) => {
    nodeRPLStake.call(address, rocketNodeStakingAddress, 'getNodeRPLStake', [
      address
    ]);
    nodeETHProvided.call(
      address,
      rocketNodeStakingAddress,
      'getNodeETHProvided',
      [address]
    );
    RPLPrice.call(address, rocketNetworkPricesAddress, 'getRPLPrice');
  });

  const nodeRPLStakeResponse: Record<string, BigNumberish> =
    await nodeRPLStake.execute();

  const nodeETHProvidedResponse: Record<string, BigNumberish> =
    await nodeETHProvided.execute();

  const RPLPriceResponse: Record<string, BigNumberish> =
    await RPLPrice.execute();

  const merged = addresses.map((address) => {
    const nodeRPLStake = nodeRPLStakeResponse[address];
    const nodeETHProvided = nodeETHProvidedResponse[address];
    const RPLPrice = RPLPriceResponse[address];

    return {
      address: address,
      nodeRPLStake: nodeRPLStake,
      nodeETHProvided: nodeETHProvided,
      RPLPrice: RPLPrice
    };
  });

  const data = merged.map((item) => {
    const multiplier = BigNumber.from('15').mul(BigNumber.from('10').pow(17));
    const numerator = item.nodeETHProvided.mul(multiplier);
    const denominator = item.RPLPrice;
    const maxEffectiveStake = numerator.div(denominator);
    const effectiveStake = minBN(item.nodeRPLStake, maxEffectiveStake);

    return {
      address: item.address,
      effectiveStake: effectiveStake
    };
  });

  const reduced: Record<string, BigNumberish> = data.reduce((acc, obj) => {
    acc[obj.address] = obj.effectiveStake;
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(reduced).map(([address, balance]) => [
      address,
      Math.sqrt(parseFloat(formatUnits(balance, options.decimals))) / 2
    ])
  );
}
