import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';
import networks from '@snapshot-labs/snapshot.js/src/networks.json';

export const author = 'dannyposi';
export const version = '0.0.1';

const abi = [
  'function getEthBalance(address addr) public view returns (uint256 balance)'
];

type Params = {
  symbol: string;
  decimals: number;
};

export async function strategy(
  _space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: Array<string>,
  options: Params,
  snapshot: number | string
) {
  const blockTag: number | string =
    typeof snapshot === 'number' ? snapshot : 'latest';

  const stakingResponse: Record<string, number> = await provider.send(
    'hmyv2_getValidatorsStakeByBlockNumber',
    [blockTag]
  );
  const stakingBalances = Object.fromEntries(
    Object.entries(stakingResponse)
      .filter(([address]) => addresses.includes(address))
      .map(([address, balance]) => [
        address,
        parseFloat(
          formatUnits(
            BigNumber.from('0x' + balance.toString(16)),
            options && options.decimals ? options.decimals : 18
          )
        )
      ])
  );

  const balanceResponse = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      networks[network].multicall,
      'getEthBalance',
      [address]
    ]),
    { blockTag }
  );
  const decimals = options.decimals || 18;

  const currentBalances = Object.fromEntries(
    balanceResponse.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), decimals))
    ])
  );

  return Object.entries(currentBalances).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: (acc[key] || 0) + value }),
    { ...stakingBalances }
  );
}
