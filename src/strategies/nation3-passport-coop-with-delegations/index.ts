import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'nation3';
export const version = '0.2.0';

const signerAbi = [
  'function signerOf(uint256 id) external view  returns (address)'
];

const lastTokenIdAbi = ['function getNextId() external view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const erc721SignerCaller = new Multicaller(network, provider, signerAbi, {
    blockTag
  });
  const erc721LastTokenIdCaller = new Multicaller(
    network,
    provider,
    lastTokenIdAbi,
    { blockTag }
  );

  erc721LastTokenIdCaller.call('lastTokenId', options.erc721, 'getNextId');

  const lastIndex = await erc721LastTokenIdCaller.execute();
  const lastTokenId = BigNumber.from(lastIndex.lastTokenId).toNumber();

  for (let i = 0; i < lastTokenId; i++) {
    erc721SignerCaller.call(i, options.erc721, 'signerOf', [i]);
  }

  const erc721Signers : Record<string, string> = await erc721SignerCaller.execute();

  const erc721SignersArr = Object.entries(erc721Signers);

  const eligibleAddresses = erc721SignersArr
    .map(([, address]) => address)
    .filter((address) => addresses.includes(address));

   return Object.fromEntries(eligibleAddresses.map(value => [value, 1]));
}
