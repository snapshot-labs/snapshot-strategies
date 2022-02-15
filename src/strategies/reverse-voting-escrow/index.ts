import { BigNumber } from '@ethersproject/bignumber';
// import { hexZeroPad } from '@ethersproject/bytes';
// import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import fetch from 'cross-fetch';

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

  // ?? Available CLUB Agora API Endpoints ?? //
  // ?? https://github.com/agoraxyz/club-backend#endpoints ?? //
  // [GET] hello?name=World: a test endpoint with an optional parameter
  // [GET] cohort/:cohortId: checks if a specific cohort with cohortId exists in the database or the contract. If both are true, returns it's data
  // [GET] cohort-ids/:account: returns the IDs of the cohorts the account is in
  // [GET] claim-data/:cohortId/:account: returns the claim data for a specific account in a specific cohort (cohortId)
  // [GET] all-claim-data/:account: returns the claim data for a specific account from all the cohorts it is in

  // ** Fetch Cohort Ids for each account ** //
  // Mapping from address to list of cohort ids
  const walletCohortIds = {} as Record<string, BigNumber[]>;
  for (const walletAddress of addresses) {
    const cohortIds = await fetch(`https://club.agora.space/api/cohort-ids/${walletAddress}`);
    const cohortJson = await cohortIds.json();
    console.log('Got cohort ids:', cohortJson);
    walletCohortIds[walletAddress] = cohortJson;
  }

  // ** Pull "vesting" contract address and get claimable token amounts
  const vestedClub = options?.vesting;

  // ** Fetch claimable (vested) $CLUB tokens
  const getWalletToVestedAmount = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const walletAddress of addresses) {
    getWalletToVestedAmount.call(
      walletAddress,
      vestedClub,
      'getClaimableAmount',
      [
        // TODO: insert cohortId and other function arguments here
        walletAddress
      ]
    );
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

  // TODO: Fetch vesting tokens from agora api

  // ** Return [address, balance] pairs ** //
  return Object.fromEntries(
    addresses.map((address) => [address, reverseVotingBalance[address.toLowerCase()] || 0])
  );
}
