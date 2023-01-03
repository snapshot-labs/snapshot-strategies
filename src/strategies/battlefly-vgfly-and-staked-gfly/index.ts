import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'Archethect';
export const version = '0.0.1';

const calcVotingPower = (
  stakedAsString: string,
  stakedLPAsString: string,
  vestingAsString: string
) => {
  const staked = BigNumber.from(stakedAsString);
  const stakedLP = BigNumber.from(stakedLPAsString);
  const vesting = BigNumber.from(vestingAsString);
  return staked.add(vesting).add(stakedLP);
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const DF_SUBGRAPH_URL = options.graphUrl;

  const params = {
    accounts: {
      __args: {
        where: {
          id_in: addresses.map((addr: string) => addr.toLowerCase())
        },
        first: 1000
      },
      id: true,
      staked: true,
      stakedLP: true,
      vesting: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.accounts.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(DF_SUBGRAPH_URL, {
    ...params
  });

  return Object.fromEntries(
    result.accounts.map((a) => [
      getAddress(a.id),
      parseFloat(
        formatUnits(
          calcVotingPower(a.staked, a.stakedLP, a.vesting),
          options.decimals
        )
      )
    ])
  );
}
