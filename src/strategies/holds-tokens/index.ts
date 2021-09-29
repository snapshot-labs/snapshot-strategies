import { formatUnits } from '@ethersproject/units';
import { multicall, getProvider } from '../../utils';

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
    return balance > 0;
  }

  const calculateVotes = (bool) => {
    return bool ? 1 : 0
  }

  const allAddresses = {};

  for (let i = 0; i < tokens.length; i++) {
    const {address, network, snapshot} = tokens[i];
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

    const multicallAddresses = addresses.map((userAddress: any) => [address, 'balanceOf', [userAddress]]);

    const response = await multicall(
      network,
      getProvider(network),
      abi,
      multicallAddresses,
      { blockTag }
    );

    response.forEach((value, i) => {
      const addressHasToken = holdsToken(
        parseFloat(formatUnits(value.toString(), options.decimals))
      );

      if (allAddresses[addresses[i]] !== undefined) {
        allAddresses[addresses[i]] = allAddresses[addresses[i]] && addressHasToken;
      } else {
        allAddresses[addresses[i]] = addressHasToken;
      }
    });
  }

  const entries = addresses.map(address => [
    address,
    calculateVotes(allAddresses[address])
  ]);

  return Object.fromEntries(
    entries
  );
}
