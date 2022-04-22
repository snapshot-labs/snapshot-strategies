import { formatUnits } from '@ethersproject/units';
import { call, multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'EncryptedBunny';
export const version = '0.1.0';

// For mUMAMI, cmUMAMI and Staked cmUMAMI
const abi = [
  'function balanceOf(address account) view returns (uint256)',
  'function stakedBalance(address account) view returns (uint256)',
  'function getDepositTokensForShares(uint256 amount) view returns (uint256)'
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
  
  // mUMAMI in wallets
  const mUmamiBalance = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  //console.log('mUmamiBalance: ', mUmamiBalance);

  //cmUMAMI in wallets - mUMAMI in compounder
  const cmUmamiBalance = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.cmUMAMIAddress,
      "balanceOf",
      [address]
    ]),
    { blockTag }
  );
  //console.log('cmUMAMIAddress: ', cmUmamiBalance);

  // Staked cmUMAMI - cmUMAMI in farm
  const stakedcmUmamiBalance = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.stakedcmUMAMIAddress,
      "stakedBalance",
      [address]
    ]),
    { blockTag }
  );
  //console.log('stakedcmUMAMIAddress: ', stakedcmUmamiBalance);

  const ratio = await call(
    provider,
    abi,
    [
      options.cmUMAMIAddress,
      'getDepositTokensForShares',
      ["1000000000000000000"]
    ]
  );
  //console.log('ratio: ', (ratio / 1000000000000000000).toString());

  return Object.fromEntries(
    Object.entries(mUmamiBalance).map(([address, balance], index) => [
      address,
      balance + 
      ( parseFloat(formatUnits(cmUmamiBalance[index][0], options.decimals)) * ratio/1000000000000000000 ) + 
      ( parseFloat(formatUnits(stakedcmUmamiBalance[index][0], options.decimals)) * ratio/1000000000000000000 )
    ])
  );
}
