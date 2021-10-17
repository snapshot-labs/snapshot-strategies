import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
// import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'foxthefarmer';
export const version = '0.0.1';

const foxVaultAbi = [
  'function poolInfo(uint256) returns (address want,uint256 allocPoint,uint256 lastRewardBlock,uint256 accAQUAPerShare,address strat)',
  'function stakedWantTokens(uint256 _pid, address _user) returns (uint256)'
];

const bep20Abi: any = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

const foxAutoCompAbi = [
  'function wantLockedTotal(address) view returns (uint256)'
];

const foxAddress = '0x0159ED2E06DDCD46a25E74eb8e159Ce666B28687';
// const foxFarmAddress = '0x15e04418d328c39ba747690f6dae9bbf548cd358';
const foxAutoCompPoolAddress = '0xA68E643e1942fA8635776b718F6EeD5cEF2a3F15';
const foxVaultChefAddress = '0x2914646E782Cc36297c6639734892927B3b6Fe56';

const vaultFoxPools = [
  { pid: '6', lpAddress: '0x7f64A21c72590497208273Dadba0814a6762685e' }, // FOX/WONE
  { pid: '7', lpAddress: '0x0E638FeDe85b808E5Da25F35ce7aA90706a86e24' },
  { pid: '8', lpAddress: '0xE2E34C07754C4CAb2b6D585C06D418628f8ba553' },
  { pid: '9', lpAddress: '0xa9C5000616F9C9B73a27999657e99B8990c85162' },
  { pid: '10', lpAddress: '0xe52b3038800eE067B8C8c1f548BB915Ab7AA8Bc2' },
  { pid: '20', lpAddress: '0xe9425769e13d3f928C483726de841999648e9CFd' },
  { pid: '29', lpAddress: '0xe9425769e13d3f928C483726de841999648e9CFd' }
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

  // returns user's aqua balance ofr their address
  let score: any = erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  // returns user's FOX balance in single staking FOX only vault
  let usersFoxAutoCompVaultBalances: any = multicall(
    network,
    provider,
    foxAutoCompAbi,
    addresses.map((address: any) => [
      foxAutoCompPoolAddress,
      'wantLockedTotal',
      [address]
    ]),
    { blockTag }
  );

  const result = await Promise.all([score, usersFoxAutoCompVaultBalances]);
  score = result[0];
  usersFoxAutoCompVaultBalances = result[1];

  const lpTotalSupplyCalls = multicall(
    network,
    provider,
    bep20Abi,
    vaultFoxPools.map((vault) => [vault.lpAddress, 'totalSupply']),
    { blockTag }
  );

  const lpFoxBalancesCalls = multicall(
    network,
    provider,
    bep20Abi,
    vaultFoxPools.map((vault) => [foxAddress, 'balanceOf', [vault.lpAddress]]),
    { blockTag }
  );

  const userVaultFoxBalances: any = vaultFoxPools.map(async (vault) => {
    return multicall(
      network,
      provider,
      foxVaultAbi,
      addresses.map((address: any) => [
        foxVaultChefAddress,
        'stakedWantTokens',
        [vault.pid, address]
      ]),
      { blockTag }
    );
  });

  const vaultBalances = await Promise.all(userVaultFoxBalances);
  const lpFoxBalances = await Promise.all([lpFoxBalancesCalls]);
  const lpTotalSupplys = await Promise.all([lpTotalSupplyCalls]);
  const vaultFoxTotals = [];

  for (let i = 0; i < lpFoxBalances[0].length; i++) {
    // First get foxPerLp
    const lpTotalSupply = parseFloat(
      formatUnits(lpTotalSupplys[0][i].toString(), 0)
    );
    const tokenBalanceInLp = parseFloat(
      formatUnits(lpFoxBalances[0][i].toString(), 0)
    );
    const foxPerLpToken = tokenBalanceInLp / lpTotalSupply;

    // @ts-ignore
    const x = vaultBalances[i].map((row) => {
      return parseFloat(formatUnits(row.toString(), 18)) * foxPerLpToken;
    });
    // @ts-ignore
    vaultFoxTotals.push(x);
  }
  // console.log('vaultFoxTotals', vaultFoxTotals);
  const transposeTotals = Object.entries(score).map((address: any, index) => [
    vaultFoxTotals.map((row) => {
      return row[index];
    })
  ]);
  // console.log('transposeTotals', transposeTotals);

  return Object.fromEntries(
    Object.entries(score).map((address: any, index) => [
      address[0],
      address[1] +
        parseFloat(
          formatUnits(usersFoxAutoCompVaultBalances[index].toString(), 18)
        ) +
        transposeTotals[index][0].reduce((a, b) => a + b, 0)
    ])
  );
}
