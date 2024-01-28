import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

export const author = 'nation3';
export const version = '0.3.0';

type Query = { [key: string]: any };

const DECIMALS = 18;

const balanceAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];

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

  const erc20BalanceCaller = new Multicaller(network, provider, balanceAbi, {
    blockTag
  });

  const erc721LastTokenIdCaller = new Multicaller(
    network,
    provider,
    lastTokenIdAbi,
    { blockTag }
  );

  const erc721SignerCaller = new Multicaller(network, provider, signerAbi, {
    blockTag
  });
  const erc721OwnerCaller = new Multicaller(network, provider, ownerAbi, {
    blockTag
  });

  const passportIssuanceSubgrgraph =
    'https://api.thegraph.com/subgraphs/name/nation3/passportissuance';

  const revokedQuery: Query = {
    revokes: {
      id: true,
      _to: true,
      _tokenId: true
    }
  };

  const revokedUsersResponse = await subgraphRequest(
    passportIssuanceSubgrgraph,
    revokedQuery
  );

  const revokedPassports: number[] = revokedUsersResponse.revokes.map(
    (revokeObject) => {
      return BigNumber.from(revokeObject._tokenId).toNumber();
    }
  );

  erc721LastTokenIdCaller.call('lastTokenId', options.erc721, 'getNextId');

  const lastIndex = await erc721LastTokenIdCaller.execute();
  const lastTokenId = BigNumber.from(lastIndex.lastTokenId).toNumber();

  for (let i = 1; i < lastTokenId; i++) {
    if (revokedPassports.includes(i)) continue;

    erc721SignerCaller.call(i, options.erc721, 'signerOf', [i]);
    erc721OwnerCaller.call(i, options.erc721, 'ownerOf', [i]);
  }

  const [erc721Signers, erc721Owners]: [
    Record<string, string>,
    Record<string, string>
  ] = await Promise.all([
    erc721SignerCaller.execute(),
    erc721OwnerCaller.execute()
  ]);

  const erc721SignersArr = Object.entries(erc721Signers);
  const erc721OwnersArr = Object.entries(erc721Owners);

  const eligibleAddresses = erc721SignersArr.filter(([, address]) =>
    addresses.includes(address)
  );

  //create a combined tuple
  const eligibleSignerOwner: [string, string, string][] = eligibleAddresses.map(
    ([id, signerAddress]) => {
      const owner = erc721OwnersArr.find(([ownerId]) => id === ownerId);
      return [id, signerAddress, owner ? owner[1] : '0x0'];
    }
  );

  eligibleSignerOwner.forEach(([, , owner]) =>
    erc20BalanceCaller.call(owner, options.erc20, 'balanceOf', [owner])
  );

  const erc20Balances: Record<string, BigNumberish> =
    await erc20BalanceCaller.execute();

  //now we have balances, need to check for > 1.5 on all IDs that have voted
  const withPower = eligibleSignerOwner.filter(([, , owner]) => {
    const balance = erc20Balances[owner] || 0;
    return parseFloat(formatUnits(balance, DECIMALS)) > 1.5;
  });

  return Object.fromEntries(withPower.map(([, signer]) => [signer, 1])) || [];
}
