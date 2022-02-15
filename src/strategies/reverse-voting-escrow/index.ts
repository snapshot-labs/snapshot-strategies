import { BigNumber } from '@ethersproject/bignumber';
import { hexZeroPad } from '@ethersproject/bytes';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'nascentxyz';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function getClaimableAmount(bytes32 cohortId, uint256 index, address account, uint256 fullAmount) external view returns (uint256)'
];

// options
// {
    // "club": "0xF76d80200226AC250665139B9E435617e4Ba55F9",
    // "vesting": "0xD46f00d9F1f6d2e65D9572F9ce283ba925FE591a",
// }


export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // ** The full address -> balance mapping ** //
  const reverseVotingBalance = {} as Record<string, BigNumber>;

  // ** Pull "club" contract and get balance of each address
  const club = options?.club;

  // ** $CLUB balance
  const callWalletToClubBalance = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const walletAddress of addresses) {
    callWalletToClubBalance.call(
      walletAddress,
      club,
      'balanceOf',
      [walletAddress]
    );
  }
  const walletToClubBalance: Record<
    string,
    BigNumber
  > = await callWalletToClubBalance.execute();

  for (const [walletID, balance] of Object.entries(walletToClubBalance)) {
    const address = walletID.split('-')[0];
    reverseVotingBalance[address] = reverseVotingBalance[address]
      ? reverseVotingBalance[address].add(balance)
      : balance;
  }

  // TODO: Pull vesting contract and get claimable token amounts
  const vesting = options?.vesting;

  // TODO: Fetch vesting tokens from agora api

  // ** Return [address, balance] pairs ** //
  return Object.fromEntries(
    addresses.map((address) => [address, reverseVotingBalance[address.toLowerCase()] || 0])
  );
}
