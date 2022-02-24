const { BigNumber } = require('@ethersproject/bignumber');
const { Multicaller } = require('../../utils');
const fetch = require('cross-fetch');
const { JsonRpcProvider } = require('@ethersproject/providers');
const networks = require('@snapshot-labs/snapshot.js/src/networks.json');

// Snapshot-level Configuration
const network = '1';
const addresses = [
  '0xC1FDB60CFB2FbbD6EDc9b445D9B508Da2dBF2c9b',
  '0xD3e9D60e4E4De615124D5239219F32946d10151D',
  '0xcCd72BeA12f3927063bE3D8798a4b74082713cb5',
  '0xde1E6A7ED0ad3F61D531a8a78E83CcDdbd6E0c49',
  '0x05e57688C639b0742ea3E940b4E9DC0fb69B1B88',
  '0x135C21b2DA426760718E39DA954974c4572AE9f6'
];
const provider = new JsonRpcProvider(networks[network].rpc[0]);
const blockTag = 'latest';

// SeedClub Configuration
const club = '0xF76d80200226AC250665139B9E435617e4Ba55F9';
const vesting = '0xD46f00d9F1f6d2e65D9572F9ce283ba925FE591a';
const abi = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function getClaimableAmount(bytes32 cohortId, uint256 index, address account, uint256 fullAmount) external view returns (uint256)',
  'function getClaimed(bytes32 cohortId, address account) public view returns (uint256)'
];

const main = async () => {
  // ** The full address -> balance mapping ** //
  const reverseVotingBalance = {} as Record<string, typeof BigNumber>;

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
    typeof BigNumber
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

  console.log('Addresses:', addresses);
  // const lowerCaseAddresses = addresses.map((address) => address.toLowerCase());

  // ** Loop over all claim data ** //
  for (const [cohortId, cohortData] of Object.entries(allDataJSON)) {
    // ** Iterate over addresses in the cohort with claims ** //
    for (const [address, amountData] of Object.entries(cohortData as any)) {
      // console.log('Checking address', address);
      if (addresses.includes(address)) {
        console.log('Found address in addresses:', address);
        // ** Extract the full amount of CLUB ** //
        const amount: any = amountData;
        const fullAmount: typeof BigNumber = amount.amount
          ? BigNumber.from(amount.amount)
          : BigNumber.from(0);
        const indexData: any = amountData;
        const index: typeof BigNumber = indexData.index
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
    typeof BigNumber
  > = await getWalletToVestedAmount.execute();
  const walletToClaimedAmount: Record<
    string,
    typeof BigNumber
  > = await getWalletToClaimedAmount.execute();

  // ** Add claimable and still vesting data to reverseVotingBalance ** //
  const vestedEntries = Object.entries(walletToVestedAmount);
  console.log('Vested Entries:', vestedEntries);
  const claimedEntries = Object.entries(walletToClaimedAmount);
  console.log('Claimed Entries:', claimedEntries);
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
  // console.log('List of Full Amounts: ', listOfFullAmounts);
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
    console.log('Vesting power:', vestingPower.toBigInt());
    const addedVotingPower = vestedBalance.add(vestingPower);
    console.log('Added Voting Power:', addedVotingPower.toBigInt());
    reverseVotingBalance[address] = reverseVotingBalance[address]
      ? reverseVotingBalance[address].add(addedVotingPower)
      : addedVotingPower;
  }

  // ** Return [address, balance] pairs ** //
  const finalReturnData = Object.fromEntries(
    addresses.map((address) => [
      address,
      reverseVotingBalance[address]
        ? reverseVotingBalance[address].toBigInt()
        : 0
    ])
  );
  console.log('Final return data', finalReturnData);
};

main();

export {};
