import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'harmony-one';
export const version = '0.0.1';

type Params = {
  symbol: string;
  decimals: number;
};

export async function strategy(
  _space: string,
  _network: string,
  provider: StaticJsonRpcProvider,
  // adding a 0 value for addresses not in the result is not needed
  // since they are dropped anyway in utils.ts
  // https://github.com/snapshot-labs/snapshot-strategies/blob/02439eb120ed7c4cc0c493924b78d92d22006b40/src/utils.ts#L26
  _addresses: Array<string>,
  options: Params,
  snapshot: number | string
) {
  // provider = new StaticJsonRpcProvider({
  //     url: "http://127.0.0.1:9500",
  //     timeout: 25000,
  // });
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
