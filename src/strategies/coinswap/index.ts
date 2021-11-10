import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import examplesFile from './examples.json';

export const author = 'coinswap';
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

// const autoCssAbi = [
//   'function userInfo(address) view returns (uint256 amount, uint256 rewardDebt)',
//   'function getPricePerFullShare() view returns (uint256)'
// ];

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
  const blockTag = 'latest';

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
    Balance in MasterChef pool CSS - CSS
    from params.masterChef
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
    from params.smartChef
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
    Staked LPs in CSS farms
    @totalSupply - exists in farm pair
    https://bscscan.com/address/0xfa8e0c0568edcdd3d9b12b48792a5b00018fdb57#code
  */
  const multiCssLPs = new Multicaller(network, provider, masterChefAbi, {
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
        options.masterChef,
        'userInfo',
        [cssLpAddr.pid, address]
      )
    );
  });
  const resultCssLPs: Record<
    string,
    BigNumberish
  > = await multiCssLPs.execute();

  /*
    Balance CSS in auto compound pool
    TODO - get compound pool address to check if the below two methods exists
    from params.autoCss
  */
  // const autoCssMulti = new Multicaller(network, provider, autoCssAbi, {
  //   blockTag
  // });
  // autoCssMulti.call('priceShare', options.autoCss, 'getPricePerFullShare');
  // addresses.forEach((address) => {
  //   autoCssMulti.call(address, options.autoCss, 'userInfo', [address]);
  // });
  // const resultAutoCss = await autoCssMulti.execute();

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

  // addresses.forEach((userAddr) => {
  //   addUserBalance(
  //     userBalances,
  //     userAddr,
  //     resultAutoCss[userAddr][0]
  //       .mul(resultAutoCss.priceShare)
  //       .div(bn(parseUnits('1', options.decimals)))
  //   );
  // });

  return Object.fromEntries(
    Object.entries(userBalances).map(([address, balance]) => [
      address,
      // @ts-ignore
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
