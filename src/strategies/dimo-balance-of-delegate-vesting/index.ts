import { strategy as erc20DelegationStrategy } from '../erc20-balance-of-delegation';

export const author = 'kostyamospan';
export const version = '0.1.0';

// const abi = [
//     'function getUnvestedOf(address account) external view returns (uint256)'
// ];

export async function strategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
) {
    const erc20BalanceDelegationScore = await erc20DelegationStrategy(
        space,
        network,
        provider,
        addresses,
        options,
        snapshot
    );

    console.debug('Delegation score', erc20BalanceDelegationScore);

    /// get a vesting score here
    const vestingScore: Record<string, number> = {};


    return Object.fromEntries(
        addresses.map((address) => {
            const addressScoreBalanceOfDelegation = erc20BalanceDelegationScore[address] ?? 0;
            const addressVestingScore = vestingScore[address] ?? 0;

            return [
                address,
                addressVestingScore +
                addressScoreBalanceOfDelegation
            ];
        })
    );
}
