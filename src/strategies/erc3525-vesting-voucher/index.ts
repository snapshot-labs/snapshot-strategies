import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { claimCoefficient, maturitiesCoefficient } from './utils';

export const author = 'charq';
export const version = '0.1.0';

const abi = [
  'function getSnapshot(uint256 tokenId_) view returns (uint8 claimType_, uint64 term_, uint256 vestingAmount_, uint256 principal_, uint64[] maturities_, uint32[] percentages_, uint256 availableWithdrawAmount_, string originalInvestor_, bool isValid_)'
];

export async function strategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
) {
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

    const snapshotData = await multicall(
        network,
        provider,
        abi,
        addresses.map((address: any) => [
            options.address,
            'getSnapshot',
            [options.tokenId]
        ]),
        { blockTag }
    );

    return Object.fromEntries(
        snapshotData.map((value, i) => [
            addresses[i],
            parseFloat(formatUnits(value[6].toString(), options.decimals)) * claimCoefficient(value[0]) * maturitiesCoefficient(value[4])
        ])
    );
}
