import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'andrew-frank';
export const version = '0.1.1';

const AVT_ABI = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const NUM_NODES = 10;
// [0, 1, ... , 9] for convinience
const NODES_INDICES = Array.from(Array(NUM_NODES).keys());

class EthCall {
  constructor(
    public readonly contract: string,
    public readonly method: string,
    public readonly args: Array<string | number>
  ) {}
  get ethCall(): any[] {
    return [this.contract, this.method, this.args];
  }
}

/** splits array into chunks */
function chunkArray<T>(arr: T[], length: number): T[][] {
  const chunks: T[][] = [];
  let i = 0;
  const n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += length)));
  }

  return chunks;
}

/** sums big numbers in array */
function sumNumbers(arr: BigNumber[]): BigNumber {
  return arr.reduce((previus, current) => {
    return previus.add(current[0]);
  }, BigNumber.from(0));
}

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // users AVTs
  const avtResponses: Array<[BigNumber]> = await multicall(
    network,
    provider,
    AVT_ABI,
    addresses.map((address: any) => [
      options.tokenAddress,
      'balanceOf',
      [address]
    ]),
    { blockTag }
  );
  const scores = avtResponses.map((value) => value[0]);

  return Object.fromEntries(
    scores.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}
