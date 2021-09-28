import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'lightninglu10';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const tokens = options.tokenAddresses || [];

  const holdsToken = (balance) => {
    return balance > 1;
  }

  const calculateVotes = (bool) => {
    return bool ? 1 : 0
  }

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const tokenResponses:any[] = [];
  const allAddresses = {};
  tokens.forEach(async ({tokenAddress, network}) => {
    const response = await multicall(
      network,
      provider,
      abi,
      addresses.map((address: any) => [tokenAddress, 'balanceOf', [address]]),
      { blockTag }
    );

    response.array.forEach((value, i) => {
      const addressHasToken = holdsToken(
        parseFloat(formatUnits(value.toString(), options.decimals))
      );
      if (allAddresses[addresses[i]] !== undefined) {
        allAddresses[addresses[i]] = allAddresses[addresses[i]] && addressHasToken;
      } else {
        allAddresses[addresses[i]] = addressHasToken;
      }
    });

    tokenResponses.push(response);
  });

  return Object.fromEntries(
    addresses.map(address => [
      address,
      calculateVotes(allAddresses[addresses])
    ])
  );
}
