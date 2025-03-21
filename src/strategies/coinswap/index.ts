import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import examplesFile from './examples.json';

export const author = 'CoinSwap-Space';
export const version = '0.0.1';
export const examples = examplesFile;

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const masterCSSAbi = [
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address _owner) view returns (uint256 balance)'
];

const communityStakeAbi = [
  'function userInfo(address) view returns (uint256 amount, uint256 rewardDebt)'
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

  /*
    Balance in CSS token
    from params.address
  */
  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const resultToken: Record<string, BigNumberish> = await multi.execute();

  /*
    Balance in MasterCSS pool CSS - CSS
    from params.masterCSS
  */
  const multiMasterCSS = new Multicaller(network, provider, masterCSSAbi, {
    blockTag
  });

  addresses.forEach((address) =>
    multiMasterCSS.call(address, options.masterCSS, 'userInfo', ['0', address])
  );
  const resultMasterCSS: Record<string, BigNumberish> =
    await multiMasterCSS.execute();

  /*
    Balance in Launch pools
    from params.communityStakeCSS
  */
  const multiCommunityStake = new Multicaller(
    network,
    provider,
    communityStakeAbi,
    {
      blockTag
    }
  );
  options.communityStake.forEach((communityStakeAddress) => {
    addresses.forEach((address) =>
      multiCommunityStake.call(
        communityStakeAddress + '-' + address,
        communityStakeAddress,
        'userInfo',
        [address]
      )
    );
  });
  const communityStakeCSS: Record<string, BigNumberish> =
    await multiCommunityStake.execute();

  /*
    Staked LPs in CSS farms
  */
  const multiCssLPs = new Multicaller(network, provider, masterCSSAbi, {
    blockTag
  });
  options.cssLPs.forEach((cssLpAddr) => {
    multiCssLPs.call('balanceOf', options.address, 'balanceOf', [
      cssLpAddr.address
    ]);
    multiCssLPs.call('totalSupply', cssLpAddr.address, 'totalSupply');
    addresses.forEach((address) =>
      multiCssLPs.call(
        cssLpAddr.address + '-' + address,
        options.masterCSS,
        'userInfo',
        [cssLpAddr.pid, address]
      )
    );
  });
  const resultCssLPs: Record<string, BigNumberish> =
    await multiCssLPs.execute();

  const userBalances: any = [];
  for (let i = 0; i < addresses.length - 1; i++) {
    userBalances[addresses[i]] = bn(0);
  }

  Object.fromEntries(
    Object.entries(resultMasterCSS).map(([address, balance]) => {
      return addUserBalance(userBalances, address, balance[0]);
    })
  );

  Object.fromEntries(
    Object.entries(resultToken).map(([address, balance]) => {
      return addUserBalance(userBalances, address, balance);
    })
  );

  options.communityStake.forEach((communityStakeAddr) => {
    addresses.forEach((userAddr) => {
      addUserBalance(
        userBalances,
        userAddr,
        communityStakeCSS[communityStakeAddr + '-' + userAddr][0]
      );
    });
  });

  options.cssLPs.forEach((cssLPAddr) => {
    addresses.forEach((userAddr) => {
      addUserBalance(
        userBalances,
        userAddr,
        bn(resultCssLPs[cssLPAddr.address + '-' + userAddr][0])
          .mul(bn(resultCssLPs.balanceOf))
          .div(bn(resultCssLPs.totalSupply))
      );
    });
  });

  return Object.fromEntries(
    Object.entries(userBalances).map(([address, balance]) => [
      address,
      // @ts-ignore
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
