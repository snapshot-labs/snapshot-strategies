import { getScoresDirect, multicall, getProvider } from '../../utils';

export const author = 'trizin';
export const version = '0.1.0';

const abi = [
  'function isVerifiedUser(address _user) external view returns (bool)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const ALLOWED_STRATEGIES = [
    'erc20-balance-of',
    'ocean-marketplace',
    'sushiswap',
    'uniswap',
    'contract-call'
  ];
  if (
    options.strategies.length > 5 ||
    options.strategies.some((x) => !ALLOWED_STRATEGIES.includes(x.name))
  )
    return [];
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.registry,
      'isVerifiedUser',
      [address]
    ]),
    { blockTag: snapshot }
  );
  let scores = await getScoresDirect(
    space,
    options.strategies,
    network,
    provider,
    addresses,
    snapshot
  );
  // [{ address: '0x...', score: 0.5 },{ address: '0x...', score: 0.5 }]
  // sum scores for each address and return
  scores = scores.reduce((finalScores: any, score: any) => {
    for (const [address, value] of Object.entries(score)) {
      if (!finalScores[address]) {
        finalScores[address] = 0;
      }
      finalScores[address] += value;
    }
    return finalScores;
  }, {});
  // { address: '0x...55', score: 1.0 }

  return Object.fromEntries(
    addresses.map((address, index) => {
      let addressScore = scores[address];
      addressScore *= response[index][0]
        ? options.brightIdMultiplier // brightId multiplier
        : options.notVerifiedMultiplier; // not verified multiplier
      return [address, addressScore];
    })
  );
}
