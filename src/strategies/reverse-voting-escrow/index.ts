import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import fetch from 'cross-fetch';

export const author = 'nascentxyz';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function getClaimableAmount(bytes32 cohortId, uint256 index, address account, uint256 fullAmount) external view returns (uint256)',
  'function getClaimed(bytes32 cohortId, address account) public view returns (uint256)'
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
  const club = options.club
    ? options.club
    : '0xF76d80200226AC250665139B9E435617e4Ba55F9';
  const vesting = options.vesting
    ? options.vesting
    : '0xD46f00d9F1f6d2e65D9572F9ce283ba925FE591a';

  // ** $CLUB balance
  const callWalletToClubBalance = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const walletAddress of addresses) {
    callWalletToClubBalance.call(walletAddress, club, 'balanceOf', [
      walletAddress
    ]);
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

  const allData = await fetch(`https://club.agora.space/api/all-data`);
  const allDataJSON = await allData.json();

  // ** Claimable (vested) $CLUB tokens ** //
  const getWalletToVestedAmount = new Multicaller(network, provider, abi, {
    blockTag
  });

  // ** Claimed $CLUB tokens ** //
  const getWalletToClaimedAmount = new Multicaller(network, provider, abi, {
    blockTag
  });

  // ** Loop over all claim data ** //
  for (const [cohortId, cohortData] of Object.entries(allDataJSON)) {
    // ** Iterate over addresses in the cohort with claims ** //
    for (const [address, amountData] of Object.entries(cohortData as any)) {
      if (addresses.includes(address)) {
        // ** Extract the full amount of CLUB ** //
        const amount: any = amountData;
        const fullAmount: BigNumber = amount.amount
          ? BigNumber.from(amount.amount)
          : BigNumber.from(0);
        const indexData: any = amountData;
        const index: BigNumber = indexData.index
          ? BigNumber.from(amount.amount)
          : BigNumber.from(0);

        // ** Create The Vested Amount Call ** //
        getWalletToVestedAmount.call(address, vesting, 'getClaimableAmount', [
          cohortId, // cohortId
          index, // index
          address, // account
          fullAmount // fullAmount
        ]);

        // ** Create The Claimed Call ** //
        getWalletToClaimedAmount.call(address, vesting, 'getClaimed', [
          cohortId, // cohortId
          address // account
        ]);
      }
    }
  }

  // ** Execute the multicalls ** //
  const walletToVestedAmount: Record<
    string,
    BigNumber
  > = await getWalletToVestedAmount.execute();
  const walletToClaimedAmount: Record<
    string,
    BigNumber
  > = await getWalletToClaimedAmount.execute();

  // ** Add claimable and still vesting data to reverseVotingBalance ** //
  const vestedEntries = Object.entries(walletToVestedAmount);
  const claimedEntries = Object.entries(walletToClaimedAmount);
  const listOfFullAmounts = Object.entries(allDataJSON)
    .map(([cohortId, cohortData]: any) =>
      Object.entries(cohortData).map(([address, data]: any) => [
        cohortId,
        address,
        data.amount,
        data.index
      ])
    )
    .reduce((prev, curr) => {
      return prev.concat(curr);
    });
  for (let i = 0; i < Object.entries(walletToVestedAmount).length; i++) {
    const address = vestedEntries[i][0].split('-')[0];
    const vestedBalance = vestedEntries[i][1];
    const claimedBalance = claimedEntries[i][1];

    // ?? voting_power = current_balance +
    // ??                vested_balance +
    // ??                0.1 * (fullAmount - vestedBalance - claimedBalance)

    const vestingPower = BigNumber.from(0.1).mul(
      listOfFullAmounts[i][2].sub(vestedBalance).sub(claimedBalance)
    );
    const addedVotingPower = vestedBalance.add(vestingPower);
    reverseVotingBalance[address] = reverseVotingBalance[address]
      ? reverseVotingBalance[address].add(addedVotingPower)
      : addedVotingPower;
  }

  // ** Return [address, balance] pairs ** //
  return Object.fromEntries(
    addresses.map((address) => [
      address,
      reverseVotingBalance[address]
        ? reverseVotingBalance[address].toBigInt()
        : 0
    ])
  );
}
