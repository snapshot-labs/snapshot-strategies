import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'posichain';
export const version = '0.0.1';

type Params = {
  symbol: string;
  decimals: number;
};

export async function strategy(
  _space: string,
  _network: string,
  provider: StaticJsonRpcProvider,
  _addresses: Array<string>,
  options: Params,
  snapshot: number | string
) {
  const blockTag: number | string =
    typeof snapshot === 'number' ? snapshot : 'latest';
  const response: Record<string, number> = await provider.send(
    'hmyv2_getValidatorsStakeByBlockNumber',
    [blockTag]
  );
  return Object.fromEntries(
    Object.entries(response).map(([address, balance]) => [
      address,
      parseFloat(
        formatUnits(
          BigNumber.from('0x' + balance.toString(16)),
          options && options.decimals ? options.decimals : 18
        )
      )
    ])
  );
}
