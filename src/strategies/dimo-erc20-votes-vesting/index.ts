import { BigNumberish } from '@ethersproject/bignumber';
import { strategy as erc20VotesStrategy } from '../erc20-votes';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'RedDuck-Software';
export const version = '0.1.0';

const abi = [
    'function totalUnclaimedOf(address user) external view returns (uint256)'
];

export async function strategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
): Promise<Record<string, number>> {
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

    const erc20votesScore = await erc20VotesStrategy(
        space,
        network,
        provider,
        addresses,
        options,
        snapshot
    );

    const multi = new Multicaller(network, provider, abi, { blockTag });
    addresses.forEach((address) =>
        multi.call(address, options.vesting, 'totalUnclaimedOf', [address])
    );

    const vestingScore: Record<string, BigNumberish> = await multi.execute();

    return Object.fromEntries(
        (addresses as string[]).map((address) => {
            const addressScoreVotes = erc20votesScore[address] ?? 0;
            const addressVestingScore = parseFloat(formatUnits((vestingScore[address] ?? '0').toString(), options.decimals));

            return [
                address,
                addressVestingScore +
                addressScoreVotes
            ];
        })
    );
}
