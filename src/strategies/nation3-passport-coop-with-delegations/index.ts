import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'nation3';
export const version = '0.2.0';

//if we use balances we need this
//const DECIMALS = 18;

//if we use balances we need this
// const balanceAbi = [
//   'function balanceOf(address account) external view returns (uint256)'
// ];

const ownerAbi = ['function ownerOf(uint256 id) public view returns (address)'];

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

  //if we use balances we need this
  //const formattedAddressesThatVoted = addresses.map((addr) => getAddress(addr));

  const erc721OwnerCaller = new Multicaller(network, provider, ownerAbi, {
    blockTag
  });
  const erc721SignerCaller = new Multicaller(network, provider, signerAbi, {
    blockTag
  });
  const erc721LastTokenIdCaller = new Multicaller(
    network,
    provider,
    lastTokenIdAbi,
    { blockTag }
  );

  //if we use balances we need this
  // const erc20BalanceCaller = new Multicaller(network, provider, balanceAbi, {
  //   blockTag
  // });

  erc721LastTokenIdCaller.call('lastTokenId', options.erc721, 'getNextId');

  const lastIndex = await erc721LastTokenIdCaller.execute();
  const lastTokenId = BigNumber.from(lastIndex.lastTokenId).toNumber();

  for (let i = 0; i < lastTokenId; i++) {
    erc721SignerCaller.call(i, options.erc721, 'signerOf', [i]);
    erc721OwnerCaller.call(i, options.erc721, 'ownerOf', [i]);
  }

  const [erc721Signers/*, erc721Owners*/]: [
    Record<string, string>,
    //Record<string, string>
  ] = await Promise.all([
    erc721SignerCaller.execute(),
    //erc721OwnerCaller.execute()
  ]);

  //if we use balances we need this
  //const erc721OwnersArr = Object.entries(erc721Owners);
  const erc721SignersArr = Object.entries(erc721Signers);

  //here is where we would/could filter out passports based on token balances
  //using the ownerAddress. The signer defaults to the owner if has not been set.
  const eligibleAddresses = erc721SignersArr.map(([id, address]) => address);

  return Object.fromEntries(
    eligibleAddresses.map((value, i) => [
      value,
      1
    ])
  );
}
