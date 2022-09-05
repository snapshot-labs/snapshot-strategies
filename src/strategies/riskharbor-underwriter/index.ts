import { getAddress } from '@ethersproject/address';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

export const author = 'dewpe';
export const version = '0.1.1';

export async function strategy(
  _space,
  _network,
  _provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const positionsQuery = {
    underwriterPositions: {
      __args: {
        where: {
          shares_not: '0',
          vault: options.VAULT_ADDR.toLowerCase(),
          user_in: addresses.map((addr: string) => addr.toLowerCase())
        },
        block: blockTag != 'latest' ? { number: blockTag } : null,
        first: 1000
      },
      shares: true,
      user: {
        id: true
      }
    }
  };

  const decimalsQuery = {
    vault: {
      __args: {
        id: options.VAULT_ADDR.toLowerCase(),
        block: blockTag != 'latest' ? { number: blockTag } : null
      },
      underwritingToken: {
        decimals: true
      }
    }
  };

  const decimals = (await subgraphRequest(options.SUBGRAPH_URL, decimalsQuery))
    .vault.underwritingToken.decimals;

  const positions = (
    await subgraphRequest(options.SUBGRAPH_URL, positionsQuery)
  ).underwriterPositions;

  // Go through each position and reduce it down to the form:
  // userAddr: balance
  const agUserBals: Record<string, BigNumberish> = {};
  positions.forEach((position) => {
    const shares = BigNumber.from(position.shares);
    if (shares.isZero()) return;
    // If key already has a value, then increase it
    if (agUserBals[position.user.id]) {
      agUserBals[position.user.id] = (
        agUserBals[position.user.id] as BigNumber
      ).add(shares);
    } else {
      agUserBals[position.user.id] = shares;
    }
  });

  return Object.fromEntries(
    Object.entries(agUserBals).map(([address, balance]) => [
      getAddress(address),
      // Divide each bal by 1eDecimals
      parseFloat(formatUnits(balance, decimals))
    ])
  );
}
