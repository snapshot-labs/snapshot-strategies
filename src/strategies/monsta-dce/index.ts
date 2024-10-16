import { BigNumberish, utils } from 'ethers';
import { Multicaller } from '../../utils';

export const author = 'Crypt0MJ';
export const version = '1.0.0';
export const strategyName = 'monsta-dce-strategy';

const erc20Abi = [
  'function balanceOf(address account) external view returns (uint256)',
];

const erc721Abi = [
  'function balanceOf(address owner) external view returns (uint256)',
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
  const multi = new Multicaller(network, provider);

  const erc20Balances = await multi.all(
    addresses.map((address) => [
      options.erc20Address,
      'balanceOf',
      [address],
      { blockTag },
    ])
  );

  const erc721Balances = await multi.all(
    addresses.map((address) => [
      options.erc721Address,
      'balanceOf',
      [address],
      { blockTag },
    ])
  );

  const votingPower = {};
  addresses.forEach((address, index) => {
    const erc20Balance = utils.formatUnits(erc20Balances[index], options.erc20Decimals);
    const erc721Balance = erc721Balances[index];
    if (parseFloat(erc20Balance) >= 5000000 && parseFloat(erc721Balance) >= 1) {
      votingPower[address] = 1; // You can customize the voting power as needed.
    } else {
      votingPower[address] = 0; // No voting power if requirements are not met.
    }
  });

  return votingPower;
}
