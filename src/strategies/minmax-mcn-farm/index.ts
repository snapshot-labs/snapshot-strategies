import { multicall } from '../../utils';

export const author = 'LeifuChen';
export const version = '0.1.0';

const FARM_ADDRESS = '0xf3a640eeb661cdf78f1817314123e8bbd12e191f';
const MAX_ADDRESS = '0xe45d95a66cff6ab5e9b796cf5a36f0669af3ec98';
const MAX_LP_ADDRESS = '0x88137f2a610693e975b17d7cf940bf014cf0f325';

const abi = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function getUser(address _lpToken, address _account) view returns (tuple(uint256 amount, uint256[] rewardsWriteoffs) user, uint256[] rewards)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const lpAddress = options.lpAddress || MAX_LP_ADDRESS;
  const tokenAddress = options.tokenAddress || MAX_ADDRESS;
  const farmAddress = options.stakingAddress || FARM_ADDRESS;
  const pools = [
    '0x88137F2a610693E975b17D7Cf940BF014CF0f325', // BUSD_MAX => MAX token in LP
    '0xC35257624b01932e521bc5D9dc07e4F9ed21ED28', // minmaxB3
    '0x14D66e676b978255C719B2771c657ACc418Bb9Fa', // minmaxE4
    '0xdFf5DC9d8dAC189324452D54e2df19d2Bdba78CE', // minmaxM3
    '0x425C2c686f12d61ECD4dFD1170214E3BEFEbBe33' // minmaxUSDT
  ];

  const flatten = (arr) => [].concat.apply([], arr);
  const product = (...sets) => {
    return sets.reduce(
      (acc, set) => flatten(acc.map((x) => set.map((y) => [...x, y]))),
      [[]]
    );
  };
  const params = product(pools, addresses);
  const res = await multicall(
    network,
    provider,
    abi,
    [
      [lpAddress, 'totalSupply', []],
      [tokenAddress, 'balanceOf', [lpAddress]]
    ]
      .concat(addresses.map((p) => [lpAddress, 'balanceOf', [p]]))
      .concat(addresses.map((p) => [tokenAddress, 'balanceOf', [p]]))
      .concat(params.map((p) => [farmAddress, 'getUser', p])),
    { blockTag }
  );

  const values = {};
  Object.values(addresses).forEach((address: string) => (values[address] = 0));

  // MAX token in user's wallet
  const walletInfo = res.slice(2 + addresses.length, 2 + addresses.length * 2);
  for (let i = 0; i < addresses.length; i++) {
    values[addresses[i]] += walletInfo[i] / 10 ** 18;
  }

  // MAX token in pendingRewards
  const poolInfo = res.slice(2 + addresses.length * 2);
  poolInfo.forEach(({ 1: reward }, i) => {
    values[addresses[i % addresses.length]] += reward / 10 ** 18;
  });

  // MAX token in MAX_BUSD LP (MCN Farm)
  const [totalSupply] = res[0];
  const [tokenBalanceInLP] = res[1];
  const tokensPerLP = tokenBalanceInLP / totalSupply;
  const lpInfo = res.slice(2 + addresses.length * 2, 2 + addresses.length * 3);
  lpInfo.forEach(({ 0: userInfo }, i) => {
    values[addresses[i % addresses.length]] +=
      (userInfo[0] / 10 ** 18) * tokensPerLP;
  });

  // MAX token in MAX_BUSD LP (User Wallet)
  const lpInWallet = res.slice(2, 2 + addresses.length);
  for (let i = 0; i < addresses.length; i++) {
    values[addresses[i]] += (lpInWallet[i] / 10 ** 18) * tokensPerLP;
  }

  return values;
}
