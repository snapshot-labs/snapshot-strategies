const { BigNumber } = require('@ethersproject/bignumber');
const { Multicaller } = require('../../utils');
const fetch = require('cross-fetch');
const { JsonRpcProvider } = require('@ethersproject/providers');
const networks = require('@snapshot-labs/snapshot.js/src/networks.json');

// Snapshot-level Configuration
const network = '1';
const addresses = [
  '0x135C21b2DA426760718E39DA954974c4572AE9f6',
  '0x05e57688C639b0742ea3E940b4E9DC0fb69B1B88',
  '0x14cEE90aF8f4ad904EdE3650dBEB89E1F26144ab',
  '0x1A4b0923B0F150b5Fa8CdFb2138D0D78b1EC85fC',
  '0x1e341Aa44c293d95d13d778492D417D1BE4E63D5',
  '0xd08b7e82942fac71d96fecaa99ed7323a95d9a79',
  '0xD76F585b6B94202430875aE748fF8C038Dc64111',
  '0x013040bcc92ca0bec2670d61f06da7c36678222a'
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

  // ** Claimed $CLUB tokens ** //
  const getWalletToClaimedAmount = new Multicaller(network, provider, abi, {
    blockTag
  });

  // ** Vested Mapping ** //
  let walletToVestedAmount: any = {} as Record<string, typeof BigNumber>;

  console.log('Addresses:', addresses);
  // const lowerCaseAddresses = addresses.map((address) => address.toLowerCase());

  // ** Loop over all claim data ** //
  for (const [cohortId, cohortData] of Object.entries(allDataJSON)) {
    // ** Claimable (vested) $CLUB tokens ** //
    const getWalletToVestedAmount = new Multicaller(network, provider, abi, {
      blockTag
    });

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
          ? BigNumber.from(amount.index)
          : BigNumber.from(0);

        // ** Create The Vested Amount Call ** //
        console.log('Calling getClaimableAmount for', address);
        console.log('CohortId:', cohortId);
        console.log('Index:', index);
        console.log('FullAmount:', fullAmount);
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

    // ** Execute the vested multicall ** //
    try {
      // This should return a mapping of wallet addresses to vested amounts
      const tempWalletVestedAmounts: Record<
        string,
        typeof BigNumber
      > = await getWalletToVestedAmount.execute();
      console.log('Got temp wallet vested amount:', tempWalletVestedAmounts);
      walletToVestedAmount = Object.assign(
        walletToVestedAmount,
        tempWalletVestedAmounts
      );
    } catch (e) {
      console.log('multicall errored!');
      console.log(e);
      // !! IGNORE Multicall REVERTS !! //
    }
  }

  // ** Execute the claimed multicall ** //
  const walletToClaimedAmount: Record<
    string,
    typeof BigNumber
  > = await getWalletToClaimedAmount.execute();

  // ** Map address to its full amount of claimable tokens ** //
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
  const fullAmounts: Map<string, typeof BigNumber> = new Map(
    listOfFullAmounts.map(([, address, amount]) => [address, amount])
  );
  console.log('Iterating over full amounts...');

  // ** Iterate over the full amounts mapping from address -> total claim amount **//
  fullAmounts.forEach((amount, address) => {
    const vestedBalance: typeof BigNumber =
      walletToVestedAmount[address] || BigNumber.from(0);
    console.log('Address', address, 'has vestedBalance:', vestedBalance);
    const claimedBalance: typeof BigNumber =
      walletToClaimedAmount[address] || BigNumber.from(0);
    console.log('Address', address, 'has claimedBalance:', claimedBalance);

    // ?? voting_power = current_balance +
    // ??                vested_balance +
    // ??                0.1 * (fullAmount - vestedBalance - claimedBalance)

    console.log('Address', address, 'has amount:', BigNumber.from(amount));
    const vestingPower = BigNumber.from(amount)
      .sub(vestedBalance)
      .sub(claimedBalance)
      .div(BigNumber.from(10));
    console.log('Vesting power:', vestingPower);
    const addedVotingPower = vestedBalance.add(vestingPower);
    console.log('Added Voting Power:', addedVotingPower);
    reverseVotingBalance[address] = reverseVotingBalance[address]
      ? reverseVotingBalance[address].add(addedVotingPower)
      : addedVotingPower;
  });

  // ** Return [address, balance] pairs ** //
  const finalReturnData = Object.fromEntries(
    addresses.map((address) => [
      address,
      reverseVotingBalance[address]
        ? parseFloat(reverseVotingBalance[address].toString())
        : 0
    ])
  );
  console.log('Final return data', finalReturnData);
};

main();

export {};
