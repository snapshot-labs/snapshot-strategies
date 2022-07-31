import { getDelegations } from '../../utils/delegation';
import { getScoresDirect } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const invalidStrategies = [
    '{"name":"erc20-balance-of","params":{"symbol":"HOP","address":"0xed8Bdb5895B8B7f9Fdb3C087628FD8410E853D48","decimals":18}}' //https://snapshot.org/#/hop.eth/proposal/0x603f0f6e54c7be8d5db7e16ae7145e6df4b439b8aac49654cdfd6b0c03eb6492
  ];

  if (
    options.strategies.some((s) =>
      invalidStrategies.includes(JSON.stringify(s))
    )
  )
    return {};
  const delegationSpace = options.delegationSpace || space;
  const delegations = await getDelegations(
    delegationSpace,
    network,
    addresses,
    snapshot
  );
  if (Object.keys(delegations).length === 0) return {};

  const scores = (
    await getScoresDirect(
      space,
      options.strategies,
      network,
      provider,
      Object.values(delegations).reduce((a: string[], b: string[]) =>
        a.concat(b)
      ),
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce(
            (a, b) => a + scores.reduce((x, y) => (y[b] ? x + y[b] : x), 0),
            0
          )
        : 0;
      return [address, addressScore];
    })
  );
}
