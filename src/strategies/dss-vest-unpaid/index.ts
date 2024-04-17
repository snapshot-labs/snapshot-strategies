import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { Multicaller } from '../../utils';

export const author = 'espendk';
export const version = '1.1.0';

// To avoid future memory issues, we limit the number of vestings supported by the strategy
const MAX_VESTINGS = 500;

const abi = [
  'function ids() external view returns (uint256)',
  'function usr(uint256 id) external view returns (address)',
  'function accrued(uint256 id) external view returns (uint256)',
  'function unpaid(uint256 id) external view returns (uint256)'
];

export type Vesting = {
  id: number;
  usr: string;
  accrued: number;
  unpaid: number;
};

export async function getAllVestings(
  network,
  provider,
  snapshot,
  dssVestAddress: string,
  decimals: number
): Promise<Vesting[]> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const dssVestContract = new Contract(dssVestAddress, abi, provider);
  const idCount = await dssVestContract.ids({ blockTag });
  if (idCount > MAX_VESTINGS) {
    throw new Error(
      `Max number (${MAX_VESTINGS}) of vestings exceeded: ${idCount}`
    );
  }

  const multi = new Multicaller(network, provider, abi, { blockTag });
  for (let id = 1; id <= idCount; ++id) {
    multi.call('usr' + id, dssVestAddress, 'usr', [id]);
    multi.call('accrued' + id, dssVestAddress, 'accrued', [id]);
    multi.call('unpaid' + id, dssVestAddress, 'unpaid', [id]);
  }
  const vestings: Record<string, string | BigNumberish> = await multi.execute();

  const result: Vesting[] = [];

  for (let id = 1; id <= idCount; ++id) {
    const usr = vestings['usr' + id] as string;
    const accrued = parseFloat(formatUnits(vestings['accrued' + id], decimals));
    const unpaid = parseFloat(formatUnits(vestings['unpaid' + id], decimals));
    result.push({
      id,
      usr,
      accrued,
      unpaid
    });
  }

  return result;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const vestings = await getAllVestings(
    network,
    provider,
    snapshot,
    options.address,
    options.decimals
  );

  // Set score to 0 for all addresses
  const result = {};
  addresses.forEach((address) => {
    result[address] = 0;
  });

  // Add the unclaimed vesting amounts to the addresses
  for (const vesting of vestings) {
    const address = vesting.usr;
    if (addresses.includes(address)) {
      result[address] += vesting.unpaid;
    }
  }

  return result;
}
