import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, multicall } from '../../utils';

export const author = 'LiquidDriver-finance';
export const version = '0.0.1';

const liquidMasterAddress = '0x6e2ad6527901c9664f016466b8DA1357a004db0f';
const beetsMasterAddress = '0x8166994d9ebBe5829EC86Bd81258149B87faCfd3';
const lpAddress = '0xEAdCFa1F34308b144E96FcD7A07145E027A8467d';
const beetsVaultAddress = '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce';
const clqdrPoolId =
  '0xeadcfa1f34308b144e96fcd7a07145e027a8467d000000000000000000000331';

const contractAbi = [
  'function userInfo(uint256, address) view returns (uint256 amount, int256 rewardDebt)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address _owner) view returns (uint256 balance)',
  'function getPoolTokens(bytes32 poolId) view returns (uint256[], uint256[], uint256)',
  'function getVirtualSupply() external view returns (uint256)'
];

const bn = (num: any): BigNumber => {
  return BigNumber.from(num.toString());
};

const addUserBalance = (userBalances, user: string, balance) => {
  if (userBalances[user]) {
    return (userBalances[user] = userBalances[user].add(balance));
  } else {
    return (userBalances[user] = balance);
  }
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const res = await multicall(
    network,
    provider,
    contractAbi,
    [
      [beetsVaultAddress, 'getPoolTokens', [clqdrPoolId]],
      [lpAddress, 'getVirtualSupply', []]
    ],
    { blockTag }
  );

  const totalClqdrInBeets = bn(res[0][1][1]);

  const virtualSupply = bn(res[1]);

  const userCLqdrBalances: any = [];
  for (let i = 0; i < addresses.length - 1; i++) {
    userCLqdrBalances[addresses[i]] = bn(0);
  }

  const clqdrMulti = new Multicaller(network, provider, contractAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    clqdrMulti.call(address, options.address, 'balanceOf', [address])
  );
  const clqdrToken: Record<string, BigNumberish> = await clqdrMulti.execute();

  Object.fromEntries(
    Object.entries(clqdrToken).map(([address, balance]) => {
      return addUserBalance(userCLqdrBalances, address, balance);
    })
  );

  const userLpBalances: any = [];
  for (let i = 0; i < addresses.length - 1; i++) {
    userLpBalances[addresses[i]] = bn(0);
  }

  const multi = new Multicaller(network, provider, contractAbi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, lpAddress, 'balanceOf', [address])
  );
  const resultToken: Record<string, BigNumberish> = await multi.execute();

  Object.fromEntries(
    Object.entries(resultToken).map(([address, balance]) => {
      return addUserBalance(userLpBalances, address, balance);
    })
  );

  const multiLiquidMaster = new Multicaller(network, provider, contractAbi, {
    blockTag
  });

  addresses.forEach((address) =>
    multiLiquidMaster.call(address, liquidMasterAddress, 'userInfo', [
      '43',
      address
    ])
  );
  const resultLiquidMaster: Record<string, BigNumberish> =
    await multiLiquidMaster.execute();

  Object.fromEntries(
    Object.entries(resultLiquidMaster).map(([address, balance]) => {
      return addUserBalance(userLpBalances, address, balance[0]);
    })
  );

  const multiBeetsMaster = new Multicaller(network, provider, contractAbi, {
    blockTag
  });

  addresses.forEach((address) =>
    multiBeetsMaster.call(address, beetsMasterAddress, 'userInfo', [
      '69',
      address
    ])
  );
  const resultBeetsMaster: Record<string, BigNumberish> =
    await multiBeetsMaster.execute();

  Object.fromEntries(
    Object.entries(resultBeetsMaster).map(([address, balance]) => {
      return addUserBalance(userLpBalances, address, balance[0]);
    })
  );

  return Object.fromEntries(
    Object.entries(userLpBalances).map(([address, balance]) => {
      const clqdrBalanceInLp = totalClqdrInBeets
        // @ts-ignore
        .mul(balance)
        .div(virtualSupply);
      const totalBalance = userCLqdrBalances[address].add(clqdrBalanceInLp);
      return [
        address,
        // @ts-ignore
        parseFloat(formatUnits(totalBalance, options.decimals))
      ];
    })
  );
}
