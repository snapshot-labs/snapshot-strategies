import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import Multicaller from '../../utils/multicaller';
import examplesFile from './examples.json';

export const author = 'biswap-dex';
export const version = '0.0.1';
export const examples = examplesFile;

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const masterChefAbi = [
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address _owner) view returns (uint256 balance)'
];

const smartChefAbi = [
  'function userInfo(address) view returns (uint256 amount, uint256 rewardDebt)'
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

  /*
    Balance in BSW token
  */
  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const resultToken: Record<string, BigNumberish> = await multi.execute();
  /*
    Balance in MasterChef pool BSW - BSW
  */
  const multiMasterChef = new Multicaller(network, provider, masterChefAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    multiMasterChef.call(address, options.masterChef, 'userInfo', [
      '0',
      address
    ])
  );
  const resultMasterChef: Record<
    string,
    BigNumberish
  > = await multiMasterChef.execute();
  /*
    Balance in Launch pools
  */
  const multiSmartChef = new Multicaller(network, provider, smartChefAbi, {
    blockTag
  });
  options.smartChef.forEach((smartChefAddress) => {
    addresses.forEach((address) =>
      multiSmartChef.call(
        smartChefAddress + '-' + address,
        smartChefAddress,
        'userInfo',
        [address]
      )
    );
  });
  const resultSmartChef: Record<
    string,
    BigNumberish
  > = await multiSmartChef.execute();

  /*
    Staked LPs in BSW farms
  */
  const multiBswLPs = new Multicaller(network, provider, masterChefAbi, {
    blockTag
  });
  options.bswLPs.forEach((bswLpAddr) => {
    multiBswLPs.call('balanceOf', options.address, 'balanceOf', [
      bswLpAddr.address
    ]);
    multiBswLPs.call('totalSupply', bswLpAddr.address, 'totalSupply');
    addresses.forEach((address) =>
      multiBswLPs.call(
        bswLpAddr.address + '-' + address,
        options.masterChef,
        'userInfo',
        [bswLpAddr.pid, address]
      )
    );
  });
  const resultBswLPs: Record<
    string,
    BigNumberish
  > = await multiBswLPs.execute();

  /*
    Balance BSW in auto compound pool
  */
  const autoBswMulti = new Multicaller(network, provider, autoBswAbi, {
    blockTag
  });
  autoBswMulti.call('priceShare', options.autoBsw, 'getPricePerFullShare');
  addresses.forEach((address) => {
    autoBswMulti.call(address, options.autoBsw, 'userInfo', [address]);
  });
  const resultAutoBsw = await autoBswMulti.execute();

  const userBalances: any = [];
  for (let i = 0; i < addresses.length - 1; i++) {
    userBalances[addresses[i]] = bn(0);
  }

  Object.fromEntries(
    Object.entries(resultMasterChef).map(([address, balance]) => {
      return addUserBalance(userBalances, address, balance[0]);
    })
  );

  Object.fromEntries(
    Object.entries(resultToken).map(([address, balance]) => {
      return addUserBalance(userBalances, address, balance);
    })
  );

  options.smartChef.forEach((smartChefAddr) => {
    addresses.forEach((userAddr) => {
      addUserBalance(
        userBalances,
        userAddr,
        resultSmartChef[smartChefAddr + '-' + userAddr][0]
      );
    });
  });

  options.bswLPs.forEach((bswLPAddr) => {
    addresses.forEach((userAddr) => {
      addUserBalance(
        userBalances,
        userAddr,
        bn(resultBswLPs[bswLPAddr.address + '-' + userAddr][0])
          .mul(bn(resultBswLPs.balanceOf))
          .div(bn(resultBswLPs.totalSupply))
      );
    });
  });

  addresses.forEach((userAddr) => {
    addUserBalance(
      userBalances,
      userAddr,
      resultAutoBsw[userAddr][0]
        .mul(resultAutoBsw.priceShare)
        .div(bn(parseUnits('1', options.decimals)))
    );
  });

  return Object.fromEntries(
    Object.entries(userBalances).map(([address, balance]) => [
      address,
      // @ts-ignore
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
