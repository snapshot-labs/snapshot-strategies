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
  '0xde1E6A7ED0ad3F61D531a8a78E83CcDdbd6E0c49'
];
const provider = new JsonRpcProvider(networks[network].rpc[0]);
const blockTag = 'latest';

// SeedClub Configuration
const club = '0xF76d80200226AC250665139B9E435617e4Ba55F9';
// const vesting = '0xD46f00d9F1f6d2e65D9572F9ce283ba925FE591a';
const abi = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function getClaimableAmount(bytes32 cohortId, uint256 index, address account, uint256 fullAmount) external view returns (uint256)'
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

  const allClaimData = await fetch(`https://club.agora.space/api/all-data`);
  const allClaimDataJSON = await allClaimData.json();

  // ** Loop over all claim data ** //
  for (const [cohortId, cohortClaimData] of Object.entries(allClaimDataJSON)) {
    console.log('Collecting Claim Data for Cohort: ', cohortId);
    // ** Iterate over addresses in the cohort with claims ** //
    for (const [address, claimData] of Object.entries(cohortClaimData as any)) {
      console.log('Collecting Claim Data for Address: ', address);
      // ** Extract the amount of CLUB that is claimable ** //
      const claimableAmount: any = claimData;
      const balance: typeof BigNumber = claimableAmount.amount
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

  // ** Return [address, balance] pairs ** //
  const finalReturnData = Object.fromEntries(
    addresses.map((address) => [
      address,
      reverseVotingBalance[address.toLowerCase()]
        ? reverseVotingBalance[address.toLowerCase()]
        : BigNumber.from(0)
    ])
  );
  console.log('Final return data', finalReturnData);
};

main();

export {};
