import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

const vesailTokenAddress = '0x26fE2f89a1FEf1bC90b8a89D8AD18a1891166ff5';
const decimals = 18;

export const author = 'cryptotrades20';
export const version = '0.1.0';

//read vesail balance
const vesailBalanceOfABI = [
  'function balanceOf(address account) view returns (uint256)'
];

//vesail to sail conversion
const toSAILABI = [
  'function toSAIL(uint256 sailAmount) view returns (uint256)'
];

/**
 * Voting power is calculated as the conversion of their vesail balance to sail
 * Then take that sail amount and apply square root operation to it
 */
async function getVesailBalance(network, provider, snapshot, addresses) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    vesailBalanceOfABI,
    addresses.map((address) => [vesailTokenAddress, 'balanceOf', [address]]),
    { blockTag }
  );
  return response.map((result) => result[0]);
}

//read vesail to sail balance
async function readToSail(
  network,
  provider,
  snapshot,
  addresses,
  vesailBalances
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    toSAILABI,
    addresses.map((address, index) => [
      vesailTokenAddress,
      'toSAIL',
      [vesailBalances[index]]
    ]),
    { blockTag }
  );
  return response.map((result) => result[0]);
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const vesailBalances = await getVesailBalance(
    network,
    provider,
    snapshot,
    addresses
  );
  const sailAmounts = await readToSail(
    network,
    provider,
    snapshot,
    addresses,
    vesailBalances
  );

  return Object.fromEntries(
    addresses.map((address, index) => [
      address,
      //square root the resulting vesail to sail amount
      Math.sqrt(
        Number(BigNumber.from(sailAmounts[index].toString())) / 10 ** decimals
      )
    ])
  );
}
