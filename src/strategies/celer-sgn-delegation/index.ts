import { BigNumber } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';

import { multicall } from '../../utils';

export const author = 'dominator008';
export const version = '0.2.0';

const v1StakingABI = [
  {
    constant: true,
    inputs: [],
    name: 'getValidatorNum',
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
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'validatorSet',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },

  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: '_candidateAddr',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_delegatorAddr',
        type: 'address'
      }
    ],
    name: 'getDelegatorInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'delegatedStake',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'undelegatingStake',
        type: 'uint256'
      },
      {
        internalType: 'uint256[]',
        name: 'intentAmounts',
        type: 'uint256[]'
      },
      {
        internalType: 'uint256[]',
        name: 'intentProposedTimes',
        type: 'uint256[]'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const v2StakingABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_delAddr',
        type: 'address'
      }
    ],
    name: 'getDelegatorTokens',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  space: string,
  network: string,
  provider: Provider,
  addresses: string[],
  options: { v1StakingAddress: string; v2StakingViewerAddress: string },
  snapshot: string | number
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Staking V1
  // 1.1. Get the number of validators
  const validatorNum: BigNumber = (
    await multicall(
      network,
      provider,
      v1StakingABI,
      [[options.v1StakingAddress, 'getValidatorNum', []]],
      { blockTag }
    )
  )[0][0];

  // 1.2. Get the addresses of the validators
  const validatorAddresses: string[] = (
    await multicall(
      network,
      provider,
      v1StakingABI,
      Array.from(Array(validatorNum.toNumber()).keys()).map((index: number) => [
        options.v1StakingAddress,
        'validatorSet',
        [index]
      ]),
      { blockTag }
    )
  ).map((value: string[]) => value[0]);

  // 1.3. Get the delegation of all addresses to all validators
  const callInfos = validatorAddresses.reduce<any[]>(
    (infos, validatorAddress) =>
      infos.concat(
        addresses.map((address: string) => [
          address,
          [
            options.v1StakingAddress,
            'getDelegatorInfo',
            [validatorAddress, address]
          ]
        ])
      ),
    []
  );
  const callInfosCopy = [...callInfos];
  const batchSize = 2000;
  const batches = new Array(Math.ceil(callInfos.length / batchSize))
    .fill(0)
    .map(() => callInfosCopy.splice(0, batchSize));
  let delegatorInfoResponse: any[] = [];
  for (let i = 0; i < batches.length; i++) {
    delegatorInfoResponse = delegatorInfoResponse.concat(
      await multicall(
        network,
        provider,
        v1StakingABI,
        batches[i].map((info) => info[1]),
        { blockTag }
      )
    );
  }

  // 1.4. For each address, aggregate the delegations to each validator
  const delegations = delegatorInfoResponse.map((info, i) => [
    callInfos[i][0],
    info.delegatedStake
  ]);
  const aggregatedDelegations = delegations.reduce((aggregates, delegation) => {
    const delegatorAddress = delegation[0];
    if (aggregates[delegatorAddress]) {
      aggregates[delegatorAddress] = aggregates[delegatorAddress].add(
        delegation[1]
      );
    } else {
      aggregates[delegatorAddress] = delegation[1];
    }
    return aggregates;
  }, {});

  // Staking V2
  // 2.1. Get delegator tokens for all addresses
  const v2DelegatorTokens: string[] = (
    await multicall(
      network,
      provider,
      v2StakingABI,
      addresses.map((address: string) => [
        options.v2StakingViewerAddress,
        'getDelegatorTokens',
        [address]
      ]),
      { blockTag }
    )
  ).map((value: string[]) => value[0]);
  const v2DelegatorTokensMap = addresses.reduce((map, address, i, _) => {
    map[address] = v2DelegatorTokens[i];
    return map;
  }, {});

  // 3. Sum up V1 and V2 delegations
  return Object.entries<BigNumber>(aggregatedDelegations).reduce(
    (transformed, [delegatorAddress, delegatedStake]) => {
      transformed[delegatorAddress] = parseFloat(
        formatUnits(delegatedStake.toString(), 18)
      );
      if (v2DelegatorTokensMap[delegatorAddress]) {
        transformed[delegatorAddress] += parseFloat(
          formatUnits(v2DelegatorTokensMap[delegatorAddress].toString(), 18)
        );
      }
      return transformed;
    },
    {}
  );
}
