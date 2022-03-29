import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export const author = 'info-gokumarket';
export const version = '0.0.1';

const GMC_ADDRESS = '0xd3E7C41b39Bb252d909Fb64D2433Abf225Eaf49E';

const onChainVPBlockNumber = 16474316;
const onChainVPAddress = '0x1afc064c9f6af8ee3b95f04db49fbd8512d170cf';

const abi = [
  'function getVotingPowerWithoutPool(address _user) view returns (uint256)'
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
  if ( 
    blockTag === 'latest' ||
    (typeof blockTag === 'number' && blockTag >= onChainVPBlockNumber)
  ) {
    let callData = addresses.map((address: any) => [
      onChainVPAddress,
      [address.toLowerCase()]
    ]);

    callData = [...chunk(callData, options.max || 400)];
    const response: any[] = [];
    for (const call of callData) {
      const multiRes = await multicall(network, provider, abi, call, {
        blockTag
      });
      response.push(...multiRes);
    }
    return Object.fromEntries(
      response.map((value, i) => [
        addresses[i],
        parseFloat(formatUnits(value.toString(), options.decimals))
      ])
    );
  }

  return erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: GMC_ADDRESS,
      symbol: 'GMC',
      decimals: 18
    },
    snapshot
  );
}
