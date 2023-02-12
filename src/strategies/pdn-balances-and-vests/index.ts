import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'viganzeqiri';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function getVestLength(address _address) public view returns(uint)',
  'function getVestMetaData(uint _index, address _address) public view returns(uint, uint)'
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

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const balances: Record<string, BigNumberish> = await multi.execute();

  addresses.forEach((address) =>
    multi.call(address, options.address, 'getVestLength', [address])
  );
  const addressesWithVestLength: Record<string, BigNumberish> =
    await multi.execute();

  const formatedAddressVests = Object.entries(addressesWithVestLength).reduce<
    Record<string, number>
  >((acc, [addresses, vestLength]) => {
    acc[addresses] = Number(vestLength);
    return acc;
  }, {});

  Object.entries(formatedAddressVests).forEach(([address, vestLength]) => {
    if (vestLength > 0) {
      const vestIndexes = Array.from(Array(vestLength).keys());

      vestIndexes.forEach((vestIndex) => {
        multi.call(
          `${address}-${vestIndex}`,
          options.address,
          'getVestMetaData',
          [vestIndex, address]
        );
      });
    }
  });

  const vestsMetadata: Record<string, BigNumberish[]> = await multi.execute();

  const metadataWithAccumulatedVests = Object.entries(vestsMetadata).reduce(
    (acc, [key, value]) => {
      const [address] = key.split('-');
      const amountVestes = value[0] || 0;

      acc[address] =
        (acc[address] || 0) +
        parseFloat(formatUnits(amountVestes, options.decimals));

      return acc;
    },
    {}
  );

  return Object.fromEntries(
    Object.entries(balances).map(([address, balance]) => {
      const totalBalance =
        (!!metadataWithAccumulatedVests[address]
          ? metadataWithAccumulatedVests[address]
          : 0) + parseFloat(formatUnits(balance, options.decimals));

      return [address, totalBalance];
    })
  );
}
