import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';


export const author = 'luhuimao';
export const version = '0.1.0';

const abiBalanceOfBatch = [
    'function balanceOfBatch(address[], uint256[]) external view returns (uint256[])'
];

const abiBalanceOf = [
    {
        inputs: [
            {
                internalType: 'address',
                name: 'account',
                type: 'address'
            },
            {
                internalType: 'uint256',
                name: 'id',
                type: 'uint256'
            }
        ],
        name: 'balanceOf',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
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

    const responseBalanceOf = await multicall(
        network,
        provider,
        abiBalanceOf,
        addresses.map((address: any) => [
            options.address,
            'balanceOf',
            [address, options.tokenId]
        ]),
        { blockTag }
    );
    const responseBalanceOfBatch = await multicall(
        network,
        provider,
        abiBalanceOfBatch,
        addresses.map((address: any) => [
            options.NFTaddress,
            'balanceOfBatch',
            [Array(options.ids.length).fill(address), options.ids]
        ]),
        { blockTag }
    );
    let entries: any;
    entries = responseBalanceOfBatch.map((value, i: number) => {
        if (value > 0) {
            return [addresses[i], parseFloat(formatUnits(responseBalanceOf[i].toString(), options.decimals))]
        } else {
            return [
                addresses[i], 0
            ]
        }
    });
    return Object.fromEntries(entries);
}
