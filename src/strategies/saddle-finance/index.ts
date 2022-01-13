import fetch from 'cross-fetch';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { vestingContractAddrs } from './vestingContractAddrs';

export const author = 'saddle-finance';
export const version = '0.1.0';

const SDLTokenAddress = '0xf1Dc500FdE233A4055e25e5BbF516372BC4F6871';
const RetroRewardsContract = '0x5DCA270671935cf3dF78bd8373C22BE250198a03';

const abi = [
  'function balanceOf(address) external view returns (uint256)',
  'function beneficiary() external view returns (address)',
  'function vestings(address) external view returns (bool isVerified, uint120 totalAmount, uint120 released)',
  'function vestedAmount() public view returns (uint256)'
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

  const remappedMerkleDataRes = await fetch(
    'https://gateway.pinata.cloud/ipfs/QmV73GEaijyiBFHu1vRdZBFffoCHaXYWG5SpurbEgr4VK6',
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );
  const remappedMerkleData = await remappedMerkleDataRes.json();

  const userWalletBalanceResponse = multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      SDLTokenAddress,
      'balanceOf',
      [address.toLowerCase()]
    ]),
    { blockTag }
  );

  const beneficiaries = multicall(
    network,
    provider,
    abi,
    vestingContractAddrs.map((vestingContractAddress: any) => [
      vestingContractAddress.toLowerCase(),
      'beneficiary'
    ]),
    { blockTag }
  );

  const vestedAndUnclaimedAmountRes = multicall(
    network,
    provider,
    abi,
    vestingContractAddrs.map((vestingContractAddress: any) => [
      vestingContractAddress.toLowerCase(),
      'vestedAmount'
    ]),
    { blockTag }
  );

  const retroAddrs = Object.keys(remappedMerkleData);

  const userVestingsRes = multicall(
    network,
    provider,
    abi,
    retroAddrs.map((retroAddr: any) => [
      RetroRewardsContract,
      'vestings',
      [retroAddr.toLowerCase()]
    ]),
    { blockTag }
  );

  const balances = await Promise.all([
    userWalletBalanceResponse,
    vestedAndUnclaimedAmountRes,
    beneficiaries,
    userVestingsRes
  ]);

  const retroUserBalances = {};
  retroAddrs.forEach((addr, i) => {
    const userVesting = balances[3][i];
    if (userVesting?.isVerified) {
      retroUserBalances[addr.toLowerCase()] = parseFloat(
        formatUnits(
          userVesting.totalAmount.sub(userVesting.released).toString(),
          18
        )
      );
    } else {
      retroUserBalances[addr.toLowerCase()] = parseFloat(
        formatUnits(remappedMerkleData[addr].amount, 18)
      );
    }
  });

  const mappedBeneficiariesToUnclaimedAmount = balances[2].reduce(
    (acc, addr, i) => ({
      ...acc,
      [addr]: parseFloat(formatUnits(balances[1][i][0].toString(), 18))
    }),
    {}
  );

  const userWalletBalances = balances[0].map((amount, i) => {
    return [
      addresses[i].toLowerCase(),
      parseFloat(formatUnits(amount.toString(), 18))
    ];
  });

  const userTotal = {};
  // loop through user, investor/advisor/team-member, and airdrop wallets to calculate total.
  userWalletBalances.forEach(([address, amount]) => {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  });
  for (const [address, amount] of Object.entries(retroUserBalances)) {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  }
  for (const [address, amount] of Object.entries(
    mappedBeneficiariesToUnclaimedAmount
  )) {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  }

  const finalUserBalances = Object.fromEntries(
    addresses.map((addr) => [addr, userTotal[addr.toLowerCase()]])
  );

  return finalUserBalances;
}
