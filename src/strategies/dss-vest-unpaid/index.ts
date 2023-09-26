import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { Multicaller } from '../../utils';

export const author = 'espendk';
export const version = '1.0.0';

// To avoid future memory issues, we limit the number of vestings supported by the strategy
const MAX_VESTINGS = 500;

const abi = [
  'function ids() external view returns (uint256)',
  'function usr(uint256 id) external view returns (address)',
  'function unpaid(uint256 id) external view returns (uint256)'
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

  // Get the number of vestings
  const dssVestContract = new Contract(options.address, abi, provider);
  const idCount = await dssVestContract.ids();
  if (idCount > MAX_VESTINGS) {
    throw new Error(
      `Max number (${MAX_VESTINGS}) of vestings exceeded: ${idCount}`
    );
  }

  // Get the vesting addresses and unpaid amounts
  const multi = new Multicaller(network, provider, abi, { blockTag });
  for (let id = 1; id <= idCount; ++id) {
    multi.call('usr' + id, options.address, 'usr', [id]);
    multi.call('unpaid' + id, options.address, 'unpaid', [id]);
  }
  const unclaimedVestings: Record<string, string | BigNumberish> =
    await multi.execute();

  // Set score to 0 for all addresses
  const result = {};
  addresses.forEach((address) => {
    result[address] = 0;
  });

  // Add the unclaimed vesting amounts to the addresses
  for (let id = 1; id <= idCount; ++id) {
    const address = unclaimedVestings['usr' + id] as string;
    if (addresses.includes(address)) {
      result[address] += parseFloat(
        formatUnits(unclaimedVestings['unpaid' + id], options.decimals)
      );
    }
  }

  return result;
}
