import { BigNumber } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';

import { multicall } from '../../utils';

export const author = 'dominator008';
export const version = '0.2.0';

const v1StakingABI = [
  'function getValidatorNum() view returns (uint256)',
  'function validatorSet(uint256) view returns (address)',
  'function getDelegatorInfo(address _candidateAddr, address _delegatorAddr) view returns (uint256 delegatedStake, uint256 undelegatingStake, uint256[] intentAmounts, uint256[] intentProposedTimes)'
];

const v2StakingABI = [
  'function getDelegatorTokens(address _delAddr) view returns (uint256, uint256)'
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
  const v2DelegatorTokensMap = addresses.reduce((map, address, i) => {
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
