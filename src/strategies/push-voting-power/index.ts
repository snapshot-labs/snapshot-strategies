import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

//0.1.0 was authered by mujtaba1747

export const author = 'ethereum-push-notification-service';
export const version = '0.2.0';

const tokenBNtoNumber = (tokenBn) => {
  return (
    tokenBn.div(BigNumber.from(10).pow(BigNumber.from(10))).toNumber() /
    100000000
  );
};

const sharedABI = [
  'function balanceOf(address user, address token) view returns (uint256)',
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
  'function userFeesInfo(address user) view returns(uint256,uint256,uint256,uint256)'
];

const wethABI = ['function balanceOf(address) view returns (uint256)'];

const epnsTokenABI = [
  'function getCurrentVotes(address account) view returns (uint96)',
  'function balanceOf(address account) view returns (uint256)'
];

const epnsLpABI = ['function totalSupply() view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const responseEPNSToken = await multicall(
    network,
    provider,
    epnsTokenABI,
    [[options.pushTokenAddr, 'balanceOf', [options.pushLPTokenAddr]]].concat(
      addresses.map((address: any) => [
        options.pushTokenAddr,
        'getCurrentVotes',
        [address.toLowerCase()]
      ])
    ),
    { blockTag }
  );

  // Used .slice, as 2 different type of calls to the same contract were made in a
  // single Multicall using .concat
  // This was done because the number of Multicalls allowed is limited to 5 by Snapshot

  const responseDelegatedPUSH = responseEPNSToken.slice(1);

  const pushAmountReserve = tokenBNtoNumber(
    responseEPNSToken.slice(0, 1)[0][0]
  );

  const responseStaked = await multicall(
    network,
    provider,
    sharedABI,

    addresses
      .map((address: any) => [
        options.stakingAddr,
        'balanceOf',
        [address.toLowerCase(), options.pushTokenAddr]
      ])
      .concat(
        addresses.map((address: any) => [
          options.stakingAddr,
          'balanceOf',
          [address.toLowerCase(), options.pushLPTokenAddr]
        ])
      ),
    { blockTag }
  );

  const responseStakedV2 = await multicall(
    network,
    provider,
    sharedABI,

    addresses
      .map((address: any) => [
        options.pushStakingInfoCoreV2,
        'userFeesInfo',
        [address.toLowerCase()]
      ])
      .concat(
        addresses.map((address: any) => [
          options.pushUniStakingV2,
          'balanceOf',
          [address.toLowerCase(), options.pushLPTokenAddr]
        ])
      ),
    { blockTag }
  );

  const responseStakedPUSH = responseStaked.slice(0, addresses.length);
  let responseStakedPUSHV2 = responseStakedV2.slice(0, addresses.length);
  responseStakedPUSHV2 = responseStakedPUSHV2.map((value, i) => {
    return value[0].toString();
  });
  const responseStakedLP = responseStaked.slice(addresses.length);
  const responseStakedLPV2 = responseStakedV2.slice(addresses.length);

  const responseWETH = await multicall(
    network,
    provider,
    wethABI,
    [[options.WETHAddress, 'balanceOf', [options.pushLPTokenAddr]]],
    { blockTag }
  );

  const wethAmountReserve = tokenBNtoNumber(responseWETH[0][0]);

  const responseLPConversion = await multicall(
    network,
    provider,
    sharedABI,
    [
      [
        options.uniswapV2Router02,
        'getAmountsOut',
        [
          '1000000000000000000',
          [options.pushTokenAddr, options.WETHAddress, options.USDTAddress]
        ]
      ],

      [
        options.uniswapV2Router02,
        'getAmountsOut',
        ['1000000000000000000', [options.WETHAddress, options.USDTAddress]]
      ]
    ],
    { blockTag }
  );

  // pushPrice and wethPrice are in terms of USDT
  const pushPrice = responseLPConversion[0]['amounts'][2].toNumber() / 1e6;
  const wethPrice = responseLPConversion[1]['amounts'][1].toNumber() / 1e6;
  const responseEPNSLPToken = await multicall(
    network,
    provider,
    epnsLpABI,
    [[options.pushLPTokenAddr, 'totalSupply', []]],
    { blockTag }
  );

  // Calculating price of EPNS-LP Tokens in terms of EPNS Tokens
  const uniLpTotalSupply = tokenBNtoNumber(responseEPNSLPToken[0][0]);
  const uniLpPrice =
    (pushAmountReserve * pushPrice + wethAmountReserve * wethPrice) /
    uniLpTotalSupply;
  const lpToPushRatio = uniLpPrice / pushPrice;

  // console.log(uniLpTotalSupply)
  return Object.fromEntries(
    responseDelegatedPUSH.map((value, i) => [
      addresses[i],

      // Voting Power = Delegated PUSH + Staked PUSH V1 + Staked PUSH V2 +Staked Uni-LP V2 + Staked UNI-LP PUSH
      parseFloat(formatUnits(value.toString(), options.decimals)) +
        parseFloat(
          formatUnits(responseStakedPUSH[i].toString(), options.decimals)
        ) +
        parseFloat(formatUnits(responseStakedPUSHV2[i], options.decimals)) +
        parseFloat(
          formatUnits(responseStakedLPV2[i].toString(), options.decimals)
        ) *
          lpToPushRatio +
        parseFloat(
          formatUnits(responseStakedLP[i].toString(), options.decimals)
        ) *
          lpToPushRatio
    ])
  );
}
