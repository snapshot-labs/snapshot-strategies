import { BigNumber, FixedNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'mitesh-mutha';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string)'
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

  // Fetch the balanceOf the addresses i.e. how many vouchers do they hold?
  const balanceOfMulti = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    balanceOfMulti.call(address, options.address, 'balanceOf', [address])
  );
  const ownedCounts: Record<string, BigNumber> = await balanceOfMulti.execute();

  // Fetch the voucher token IDs held for each address
  const tokenIdsMulti = new Multicaller(network, provider, abi, { blockTag });
  addresses.map((address) => {
    let ownedCount = ownedCounts[address];
    while (ownedCount.gt(0)) {
      const index = ownedCount.sub(1);
      tokenIdsMulti.call(
        `${address}-${index.toString()}`,
        options.address,
        'tokenOfOwnerByIndex',
        [address, index.toNumber()]
      );
      ownedCount = index;
    }
  });
  const ownerTokenIds: Record<string, string> = await tokenIdsMulti.execute();

  // Fetch the voucher data for each voucher held by an address among the address
  const tokenURIMulti = new Multicaller(network, provider, abi, { blockTag });
  Object.entries(ownerTokenIds).map(([addressWithIndex, tokenId]) => {
    tokenURIMulti.call(`${addressWithIndex}`, options.address, `tokenURI`, [
      tokenId
    ]);
  });
  const ownerTokenURIs: Record<string, string> = await tokenURIMulti.execute();

  // Go through the list of results and sum up claimable values
  const claimableVotingPower: Record<string, FixedNumber> = {};
  Object.entries(ownerTokenURIs).map(([addressWithIndex, tokenURI]) => {
    const address = addressWithIndex.split('-')[0];
    if (tokenURI.split(',')[0] == 'data:application/json') {
      const tokenData = JSON.parse(tokenURI.slice(22));
      const claimableAmount = tokenData['properties']['claimableAmount'];
      if (!claimableVotingPower[address])
        claimableVotingPower[address] = FixedNumber.from(0);
      claimableVotingPower[address] = claimableVotingPower[address].addUnsafe(
        FixedNumber.fromString(claimableAmount)
      );
    }
  });

  // Return the computed values
  return Object.fromEntries(
    Object.entries(claimableVotingPower).map(([address, votingPower]) => [
      address,
      votingPower.toUnsafeFloat()
    ])
  );
}
