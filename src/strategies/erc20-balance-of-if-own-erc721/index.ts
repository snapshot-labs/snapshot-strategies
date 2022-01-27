import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'andreanistico';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address owner) public view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const erc20 = new Multicaller(network, provider, abi, {
    blockTag
  });
  const erc721 = new Multicaller(network, provider, abi, {
    blockTag
  });

  addresses.forEach((address) => {
    erc721.call(address, options.nftAddress, 'balanceOf', [address]);
    erc20.call(address, options.erc20Address, 'balanceOf', [address]);
  });

  const [erc721Response, erc20Response]: [
    Record<string, BigNumberish[]>,
    Record<string, BigNumberish>
  ] = await Promise.all([erc721.execute(), erc20.execute()]);

  return Object.fromEntries(
    addresses.map((address) => {
      const erc721Count = BigNumber.from(erc721Response[address]).toNumber();
      const erc20Balance = parseFloat(formatUnits(erc20Response[address], options.decimals))

      const result = erc721Count > 0 ? erc20Balance : 0;
      return [address, result];
    })
  );
}
