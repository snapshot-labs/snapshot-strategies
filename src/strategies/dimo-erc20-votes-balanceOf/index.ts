import {
    strategy as erc20VotesStrategy,
} from '../erc20-votes';

import {
    strategy as erc20BalanceOf
} from '../erc20-balance-of';

export const author = 'RedDuck-Software';
export const version = '0.1.1';

type StrategyOptions = {
    address: string,
    decimals: number,
    symbol: string,
    balanceOfContract: string
}

export async function strategy(
    space,
    network,
    provider,
    addresses: string[],
    options: StrategyOptions,
    snapshot
): Promise<Record<string, number>> {
    const erc20votesScore = await erc20VotesStrategy(
        space,
        network,
        provider,
        addresses,
        options,
        snapshot
    );

    const balanceOfScore = await erc20BalanceOf(
        space,
        network,
        provider,
        addresses,
        options,
        snapshot
    );

    return Object.fromEntries(
        addresses.map((address) => {
            const addressScoreTokenVotes = erc20votesScore[address] ?? 0;
            const addressContractScore = balanceOfScore[address] ?? 0;

            return [
                address,
                addressContractScore + addressScoreTokenVotes
            ];
        })
    );
}
