import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import remappedMerkleData from './remappedMerkleData.json';
import { vestingContractAddrs } from './vestingContractAddrs';

export const author = 'ug02fast';
export const version = '0.1.0';

const SDLTokenAddress = '0xf1Dc500FdE233A4055e25e5BbF516372BC4F6871';
const RetroRewardsContract = '0x5DCA270671935cf3dF78bd8373C22BE250198a03';

const abi = [
  'function balanceOf(address) external view returns (uint256)',
  'function beneficiary() external view returns (address)',
  'function vestings(address) external view returns (bool isVerified, uint120 totalAmount, uint120 released)'
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

  const userWalletBalanceResponse = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [SDLTokenAddress, 'balanceOf', [address]]),
    { blockTag }
  );

  const vestingAddrsBalanceRes = await multicall(
    network,
    provider,
    abi,
    vestingContractAddrs.map((vestingContractAddress: any) => [
      SDLTokenAddress,
      'balanceOf',
      [vestingContractAddress]
    ]),
    { blockTag }
  );

  const beneficiaries = await multicall(
    network,
    provider,
    abi,
    vestingContractAddrs.map((vestingContractAddress: any) => [
      vestingContractAddress,
      'beneficiary'
    ]),
    { blockTag }
  );

  const retroAddrs = Object.keys(remappedMerkleData);

  const userVestingsRes = await multicall(
    network,
    provider,
    abi,
    retroAddrs.map((retroAddr: any) => [
      RetroRewardsContract,
      'vestings',
      [retroAddr]
    ]),
    { blockTag }
  );

  const retroUserBalances = {};
  retroAddrs.forEach((addr, i) => {
    const userVesting = userVestingsRes[i];
    if (userVesting.isVerified) {
      retroUserBalances[addr] = parseFloat(
        formatUnits(
          userVesting.totalAmount.sub(userVesting.released).toString(),
          18
        )
      );
    } else {
      retroUserBalances[addr] = parseFloat(
        formatUnits(remappedMerkleData[addr].amount, 18)
      );
    }
  });

  const mappedBeneficiariesToVestingContract = beneficiaries.reduce(
    (acc, addr, i) => ({
      ...acc,
      [addr]: parseFloat(
        formatUnits(vestingAddrsBalanceRes[i][0].toString(), 18)
      )
    }),
    {}
  );

  const userWalletBalances = userWalletBalanceResponse.map((amount, i) => {
    return [addresses[i], parseFloat(formatUnits(amount.toString(), 18))];
  });
  const userTotal = {};
  // loop through user, investor/advisor/team-member, and airdrop wallets to calculate total.
  userWalletBalances.forEach(([addr, amount]) => {
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  });
  for (const [addr, amount] of Object.entries(retroUserBalances)) {
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  }
  for (const [addr, amount] of Object.entries(
    mappedBeneficiariesToVestingContract
  )) {
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  }

  const finalUserBalances = Object.fromEntries(
    Object.entries(userTotal).filter(([addr]) => addresses.includes(addr))
  );

  return finalUserBalances;
}
