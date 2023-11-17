import { getAddress } from '@ethersproject/address';
import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'flaflafla';
export const version = '0.1.1';

const kidsAddressByNetwork = {
  1: '0xa5ae87B40076745895BB7387011ca8DE5fde37E0',
  5: '0x66B04973b83ea796960D6f8ea22856714e01765f'
};

const puppiesAddressByNetwork = {
  1: '0x86e9C5ad3D4b5519DA2D2C19F5c71bAa5Ef40933',
  5: '0x053A3213E75b78c0b80b2f88e243cf519e834c02'
};

const stakingAddressByNetwork = {
  1: '0xf48415039913DBdF17e337e681de922A9cb04010',
  5: '0xe5f1433b6eCc6bE74E413b54f4c1eA2671b1cA0F'
};

const abi = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function depositsOf(address account) external view returns (uint256[][2])'
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  _options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address) => {
    multi.call(`${address}.kids`, kidsAddressByNetwork[network], 'balanceOf', [
      address
    ]);

    multi.call(
      `${address}.puppies`,
      puppiesAddressByNetwork[network],
      'balanceOf',
      [address]
    );

    multi.call(
      `${address}.staking`,
      stakingAddressByNetwork[network],
      'depositsOf',
      [address]
    );
  });

  const result: {
    address: {
      kids: BigNumberish;
      puppies: BigNumberish;
      staking: [Array<BigNumberish>, Array<BigNumberish>];
    };
  } = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, { kids, puppies, staking }]) => {
      const [stakedKids, stakedPuppies] = staking;

      const kidsCount = parseFloat(formatUnits(kids, 0));
      const stakedKidsCount = stakedKids.length;

      const puppiesCount = parseFloat(formatUnits(puppies, 0));
      const stakedPuppiesCount = stakedPuppies.length;

      const holdingsCount =
        kidsCount + stakedKidsCount + puppiesCount + stakedPuppiesCount;

      return [getAddress(address), holdingsCount];
    })
  );
}
