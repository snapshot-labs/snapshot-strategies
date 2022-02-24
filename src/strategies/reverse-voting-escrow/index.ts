import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import fetch from 'cross-fetch';

export const author = 'nascentxyz';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function getClaimableAmount(bytes32 cohortId, uint256 index, address account, uint256 fullAmount) external view returns (uint256)'
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

  // ** The full address -> balance mapping ** //
  const reverseVotingBalance = {} as Record<string, BigNumber>;

  // ** Extract `club` and `vesting` contract addresses ** //
  // ** If not provided, default to hardcoded values ** //
  const club = options.club ? options.club : '0xF76d80200226AC250665139B9E435617e4Ba55F9';
  const vesting = options.vesting ? options.vesting : '0xD46f00d9F1f6d2e65D9572F9ce283ba925FE591a';

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

  // ?? Available CLUB Agora API Endpoints ?? //
  // ?? https://github.com/agoraxyz/club-backend#endpoints ?? //
  // [GET] hello?name=World: a test endpoint with an optional parameter
  // [GET] cohort/:cohortId: checks if a specific cohort with cohortId exists in the database or the contract. If both are true, returns it's data
  // [GET] cohort-ids/:account: returns the IDs of the cohorts the account is in
  // [GET] claim-data/:cohortId/:account: returns the claim data for a specific account in a specific cohort (cohortId)
  // [GET] all-claim-data/:account: returns the claim data for a specific account from all the cohorts it is in
  // [GET] all-data: returns all claim data

  const allClaimData = await fetch(`https://club.agora.space/api/all-data`);
  const allClaimDataJSON = await allClaimData.json();

  // ** Track which cohorts each wallet is a member of ** //
  const walletToCohort = {} as Record<string, string[]>;

  // ** Loop over all claim data ** //
  for (const [cohortId, cohortClaimData] of Object.entries(allClaimDataJSON)) {
    // ** Iterate over addresses in the cohort with claims ** //
    for (const [address, claimData] of Object.entries(cohortClaimData as any)) {
      if (address in addresses) {
        walletToCohort[address] = [...walletToCohort[address], cohortId];
        // ** Extract the amount of CLUB that is claimable ** //
        const claimableAmount: any = claimData;
        const balance: BigNumber = claimableAmount.amount
          ? BigNumber.from(claimableAmount.amount)
          : BigNumber.from(0);
        console.log('Claim amount: ', balance);
        reverseVotingBalance[address.toLowerCase()] = reverseVotingBalance[
          address.toLowerCase()
        ]
          ? reverseVotingBalance[address.toLowerCase()].add(balance)
          : balance;
      }
    }
  }

  // ** Fetch claimable (vested) $CLUB tokens
  const getWalletToVestedAmount = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const walletAddress of addresses) {
    for (const cohortId of walletToCohort[walletAddress]) {
      getWalletToVestedAmount.call(
        walletAddress,
        vesting,
        'getClaimableAmount',
        [
          cohortId,           // cohortId
          BigNumber.from(0),  // index
          walletAddress,      // account
          BigNumber.from(0)   // fullAmount
        ]
      );
    }
  }
  const walletToVestedAmount: Record<
    string,
    BigNumber
  > = await getWalletToVestedAmount.execute();

  // ** Add the claimable/vested amounts to the reverseVotingBalance mapping
  for (const [walletID, balance] of Object.entries(walletToVestedAmount)) {
    const address = walletID.split('-')[0];
    reverseVotingBalance[address] = reverseVotingBalance[address]
      ? reverseVotingBalance[address].add(balance)
      : balance;
  }

  // ** Return [address, balance] pairs ** //
  return Object.fromEntries(
    addresses.map((address) => [
      address,
      reverseVotingBalance[address.toLowerCase()]
        ? reverseVotingBalance[address.toLowerCase()]
        : BigNumber.from(0)
    ])
  );
}
