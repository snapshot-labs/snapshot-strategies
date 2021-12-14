import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import examplesFile from './examples.json';

export const author = 'biswap-dex';
export const version = '0.0.1';
export const examples = examplesFile;

const abi = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address _owner) view returns (uint256 balance)',
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)'
];

const autoBswAbi = [
  'function userInfo(address) view returns (uint256 amount, uint256 rewardDebt)',
  'function getPricePerFullShare() view returns (uint256)'
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

  const multicall = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address: any) => {
    multicall.call(`token.${address}`, options.address, 'balanceOf', [address]);
    multicall.call(`masterChef.${address}`, options.masterChef, 'userInfo', [
      '0',
      address
    ]);
  });
  options.bswLPs.forEach((lp: { address: string, pid: number}) => {
    multicall.call(`lp.${lp.pid}.totalSupply`, lp.address, 'totalSupply');
    multicall.call(`lp.${lp.pid}.balanceOf`, options.address, 'balanceOf', [
      lp.address
    ]);
    addresses.forEach((address: any) => {
      multicall.call(
        `lpUsers.${address}.${lp.pid}`,
        options.masterChef,
        'userInfo',
        [lp.pid, address]
      );
    });
  });

  const multicallAutoCompound = new Multicaller(network, provider, autoBswAbi, {
    blockTag
  });
  multicallAutoCompound.call(
    'priceShare',
    options.autoBsw,
    'getPricePerFullShare'
  );
  addresses.forEach((address) => {
    multicallAutoCompound.call(address, options.autoBsw, 'userInfo', [address]);
  });

  const resultAutoBsw = await multicallAutoCompound.execute();
  const result = await multicall.execute();

  const userBalances: any = [];
  for (let i = 0; i < addresses.length - 1; i++) {
    userBalances[addresses[i]] = bn(0);
  }

  addresses.forEach((address: any) => {
    addUserBalance(userBalances, address, result.token[address]);
    addUserBalance(userBalances, address, result.masterChef[address][0]);
    addUserBalance(
      userBalances,
      address,
      resultAutoBsw[address][0]
        .mul(resultAutoBsw.priceShare)
        .div(bn(parseUnits('1', options.decimals)))
    );
    options.bswLPs.forEach((lp: { address: string, pid: number }) => {
      console.log();
      addUserBalance(
        userBalances,
        address,
        result.lpUsers[address][lp.pid][0]
          .mul(result.lp[lp.pid].balanceOf)
          .div(result.lp[lp.pid].totalSupply)
      );
    });
  });

  return Object.fromEntries(
    Object.entries(userBalances).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(<BigNumberish>balance, options.decimals))
    ])
  );
}