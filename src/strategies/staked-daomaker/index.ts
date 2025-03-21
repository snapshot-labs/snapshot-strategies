import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'paraswap';
export const version = '0.1.0';

const abi = [
  'function stakeCount(address stakerAddr) view returns (uint256)',
  'function stakeLists(address stakerAddr, uint256 stakeid) view returns (uint128,uint128,uint40,uint16,uint16,uint16)'
];

interface StrategyOptions {
  address: string;
  symbol: string;
  decimals: number;
  smartcontract: [];
}

export async function strategy(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: StrategyOptions,
  snapshot: number
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const stakeCountByWallet = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.smartcontract,
      'stakeCount',
      [address.toLowerCase()]
    ]),
    { blockTag }
  );

  const stakeAmountByWallet: any[] = [];

  // preparing second array for multicall
  const arrayForMultiCall: any = [];
  for (const i in stakeCountByWallet) {
    const num = Number(stakeCountByWallet[i] + '');
    stakeAmountByWallet.push({ wallet: addresses[i], amt: BigNumber.from(0) });

    if (num > 0) {
      const arr = Array.from(Array(num).keys());
      for (const j in arr) {
        arrayForMultiCall.push({
          wallet: addresses[i].toLowerCase(),
          stakeId: arr[j]
        });
      }
    }
  }

  const stakeAmountByStakeId = await multicall(
    network,
    provider,
    abi,
    arrayForMultiCall.map((r: any) => [
      options.smartcontract,
      'stakeLists',
      [r.wallet, r.stakeId]
    ]),
    { blockTag }
  );
  for (const i in arrayForMultiCall) {
    for (const j in stakeAmountByWallet) {
      if (
        arrayForMultiCall[i].wallet.toLowerCase() ===
        stakeAmountByWallet[j].wallet.toLowerCase()
      ) {
        stakeAmountByWallet[j].amt = stakeAmountByWallet[j].amt.add(
          stakeAmountByStakeId[i][0]
        );
      }
    }
  }

  return Object.fromEntries(
    stakeAmountByWallet.map((info, i) => {
      return [
        stakeAmountByWallet[i].wallet,
        parseFloat(formatUnits(stakeAmountByWallet[i].amt.toString(), 18))
      ];
    })
  );
}
