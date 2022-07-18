import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { claimCoefficient, maturitiesCoefficient } from './utils';

export const author = 'charq';
export const version = '0.1.0';

const abi = [
    {
        inputs: [
            {
                internalType: "uint256",
                name: "tokenId_",
                type: "uint256"
            }
        ],
        name: "getSnapshot",
        outputs: [
            {
                internalType: "uint8",
                name: "claimType_",
                type: "uint8"
            },
            {
                internalType: "uint64",
                name: "term_",
                type: "uint64"
            },
            {
                internalType: "uint256",
                name: "vestingAmount_",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "principal_",
                type: "uint256"
            },
            {
                internalType: "uint64[]",
                name: "maturities_",
                type: "uint64[]"
            },
            {
                internalType: "uint32[]",
                name: "percentages_",
                type: "uint32[]"
            },
            {
                internalType: "uint256",
                name: "availableWithdrawAmount_",
                type: "uint256"
            },
            {
                internalType: "string",
                name: "originalInvestor_",
                type: "string"
            },
            {
                internalType: "bool",
                name: "isValid_",
                type: "bool"
            }
        ],
        stateMutability: "view",
        type: "function"
    }
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
