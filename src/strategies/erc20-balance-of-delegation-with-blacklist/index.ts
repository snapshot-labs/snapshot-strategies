import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { getDelegations } from '../../utils/delegation';

export const author = 'bonustrack';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const delegationSpace = options.delegationSpace || space;
  const delegations = await getDelegations(
    delegationSpace,
    network,
    addresses,
    snapshot
  );
  if (Object.keys(delegations).length === 0) return {};

  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    Object.values(delegations).reduce((a: string[], b: string[]) =>
      a.concat(b)
    ),
    options,
    snapshot
  );

  const exclude = new Set<string>(
    options.blacklist?.map((x) => x.toLowerCase()) ?? []
  );

  return Object.fromEntries(
    addresses
      .filter((a) => !exclude.has(a.toLowerCase()))
      .map((address) => {
        const addressScore = delegations[address]
          ? delegations[address].reduce((a, b) => a + score[b], 0)
          : 0;
        return [address, addressScore];
      })
  );
}
