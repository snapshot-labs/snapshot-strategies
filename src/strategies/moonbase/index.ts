import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import examplesFile from './examples.json';

export const author = 'MoonbaseMarkets';
export const version = '0.0.1';
export const examples = examplesFile;

const abi = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address _owner) view returns (uint256 balance)',
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)'
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

const MAX_MOONBASE_LPS = 1000000000;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  if (options.moonbaseLPs.length > MAX_MOONBASE_LPS) {
    throw new Error(
      `Too many moonbaseLPs. Maximum allowed is ${MAX_MOONBASE_LPS}.`
    );
  }

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multicall = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address: any) => {
    multicall.call(`token.${address}`, options.address, 'balanceOf', [address]);
  });
  options.moonbaseLPs.forEach((lp: { address: string; pid: number }) => {
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
  const result = await multicall.execute();

  const userBalances: any = [];
  for (let i = 0; i < addresses.length - 1; i++) {
    userBalances[addresses[i]] = bn(0);
  }

  addresses.forEach((address: any) => {
    addUserBalance(userBalances, address, result.token[address]);
    options.moonbaseLPs.forEach((lp: { address: string; pid: number }) => {
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
