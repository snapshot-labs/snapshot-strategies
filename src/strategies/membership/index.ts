import _strategies from '..';

export const author = 'blakewest';
export const version = '1.0.0';

/*
Membership Based Voting Strategy

Options: {
  membershipStrategy: {
    name: {strategyName},
    options: {
      ... options for the strategy
    }
  },
  votingPowerStrategy: {
    name: {strategyName},
    options: {
      ... options for the strategy
    }
  }
}

*/

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: {
    name: string;
    membershipStrategy: {
      name: string;
      params: Record<string, string | number | boolean>;
    };
    votingPowerStrategy: {
      name: string;
      params: Record<string, string | number | boolean>;
    };
  },
  snapshot
) {
  const validAddresses = await membershipCheck(
    space,
    network,
    provider,
    addresses,
    options.membershipStrategy,
    snapshot
  );
  const votingPowerStrategy =
    _strategies[options.votingPowerStrategy.name].strategy;
  const scores = await votingPowerStrategy(
    space,
    network,
    provider,
    validAddresses,
    options.votingPowerStrategy.params,
    snapshot
  );

  // Set invalid addresses to 0
  addresses
    .filter((addr) => !validAddresses.includes(addr))
    .forEach((addr) => (scores[addr] = 0));

  return scores;
}

async function membershipCheck(
  space: any,
  network: string,
  provider: any,
  addresses: string[],
  strategy: {
    name: string;
    params: Record<string, unknown>;
  },
  snapshot: number | string | undefined
): Promise<string[]> {
  const strategyFn = _strategies[strategy.name].strategy;
  const result: { [address: string]: number } = await strategyFn(
    space,
    network,
    provider,
    addresses,
    strategy.params,
    snapshot
  );
  return Object.entries(result)
    .map(([address, val]) => {
      if (val > 0) {
        return address;
      } else {
        return '';
      }
    })
    .filter((item) => item);
}
