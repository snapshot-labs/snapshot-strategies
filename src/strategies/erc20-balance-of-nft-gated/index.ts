import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'blakewest';
export const version = '1.0.0';

/*
ERC-20 Balance Of, NFT-Gated

Options: {
  address: string,
  symbol: string,
  decimals: number,
  erc721GateAddress: string,
  erc1155GateAddress: string,
  tokenIds: number[]
}

*/

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const validAddresses = await gate(
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  const scores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    validAddresses,
    options,
    snapshot
  );
  // Set invalid addresses to 0
  addresses
    .filter((addr) => !validAddresses.includes(addr))
    .forEach((addr) => (scores[addr] = 0));
  return Object.fromEntries(
    Object.entries(scores).map((score) => [score[0], score[1]])
  );
}

async function gate(
  network: string,
  provider: any,
  addresses: string[],
  options: {
    erc721GateAddress: string;
    erc1155GateAddress: string;
    tokenIds: number[];
  },
  snapshot: number | string | undefined
): Promise<string[]> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const balanceOfABI = [
    'function balanceOf(address account) external view returns (uint256)'
  ];
  const balanceOfBatchABI = [
    {
      inputs: [
        {
          internalType: 'address[]',
          name: 'accounts',
          type: 'address[]'
        },
        {
          internalType: 'uint256[]',
          name: 'ids',
          type: 'uint256[]'
        }
      ],
      name: 'balanceOfBatch',
      outputs: [
        {
          internalType: 'uint256[]',
          name: '',
          type: 'uint256[]'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    }
  ];
  let erc721Gate: string[] = [];
  let erc1155Gate: string[] = [];

  if (options.erc721GateAddress) {
    const calls = addresses.map((address: string) => {
      return [options.erc721GateAddress, 'balanceOf', [address]];
    });
    const response: BigNumberish[][] = await multicall(
      network,
      provider,
      balanceOfABI,
      calls,
      { blockTag }
    );
    erc721Gate = response
      .map((value: BigNumberish[], i: number) => {
        const balance = parseFloat(formatUnits(value.toString(), 0));
        if (balance > 0) {
          return addresses[i];
        } else {
          return '';
        }
      })
      .filter((n) => n);
  }

  if (options.erc1155GateAddress) {
    if (!(options.tokenIds.length > 1)) {
      throw new Error(
        'At least 1 token ID must be passed for the ERC1155 gate'
      );
    }
    const calls = addresses.map((address: string) => {
      return [
        options.erc1155GateAddress,
        'balanceOfBatch',
        [options.tokenIds.map(() => address), options.tokenIds]
      ];
    });
    const response: BigNumberish[][] = await multicall(
      network,
      provider,
      balanceOfBatchABI,
      calls,
      { blockTag }
    );
    erc1155Gate = response
      .map((values: BigNumberish[], i: number) => {
        const balances = values
          .toString()
          .split(',')
          .map((val) => parseFloat(formatUnits(val, 0)));
        const balanceSum: number = balances.reduce(
          (acc: number, value: number) => acc + value,
          0
        );
        if (balanceSum > 0) {
          return addresses[i];
        } else {
          return '';
        }
      })
      .filter((n) => n);
  }
  // Concat and unique the results
  const result = [...new Set(erc721Gate.concat(erc1155Gate))];
  return result;
}
