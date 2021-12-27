
import { formatUnits } from '@ethersproject/units';

import { subgraphRequest, multicall } from '../../utils';

export const author = 'philip';
export const version = '0.1.0';

const UNISWAP_SUBGRAPH_URL = {
    '82': 'https://graph.voltswap.finance/subgraphs/name/meterio/uniswap-v2-subgraph',
    '361': 'https://theta-graph.voltswap.finance/subgraphs/name/theta/uniswap-v2-subgraph'
}

const SUBGRAPH_URL = {
    '82': 'https://newgraph.voltswap.finance/subgraphs/name/meter/geyser-v2',
    '361': 'https://geyser-graph-on-theta.voltswap.finance/subgraphs/name/theta/geyser-v2'

}


const abi = [
    {
        constant: true,
        inputs: [
            {
                internalType: 'address',
                name: 'user',
                type: 'address'
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
        payable: false,
        stateMutability: 'view',
        type: 'function'
    }
];



export async function strategy(
    _space,
    network,
    _provider,
    addresses,
    options,
    snapshot
) {

    const lpTokenAddress = options.lpTokenAddress.toLowerCase();
    const tokenDecimals = options.tokenDecimals



    const voltDataparams = {
        users: {
            __args: {
                where: {
                    id_in: addresses.map((address) => address.toLowerCase())
                },
                first: 1000
            },
            id: true,

            vaults: {
                id: true,
                locks: {
                    __args: {
                        where: {
                            token_in: [options.voltAddress.toLowerCase(), options.lpTokenAddress.toLowerCase()]
                        }
                    },
                    id: true,
                    token: true,
                    amount: true,
                    stakeUnits: true
                }


            }
        }
    }




    const subgraphDataParams = {


        pairs: {
            __args: {
                where: {
                    id: lpTokenAddress.toLowerCase()
                },
                first: 1
            },
            id: true,
            token0:
            {
                id: true
            },
            reserve0: true,
            token1: {
                id: true
            },
            reserve1: true,
            totalSupply: true


        }
    };






    const poolData = await subgraphRequest(SUBGRAPH_URL[options.network || network], voltDataparams)

    const subgraphData = await subgraphRequest(UNISWAP_SUBGRAPH_URL[options.network || network], subgraphDataParams);


    let totalVoltComposition = 0
    let totalStake = 0


    if (subgraphData && subgraphData.pairs) {

        subgraphData.pairs.forEach((lp) => {
            const isToken0 = lp.token0.id.toLowerCase() === options.voltAddress.toLowerCase()
            if (isToken0) {
                totalVoltComposition = lp.reserve0

            } else {
                totalVoltComposition = lp.reserve1
            }
            totalStake = Number(lp.reserve0) + Number(lp.reserve1)

        });

    }










    if (addresses.length && addresses.length > 200) {

        const remainder1 = Math.floor(addresses.length / 3)
        let remainder2 = remainder1 + remainder1
        let remainder3 = remainder2
        const response1 = await multicall(
            network,
            _provider,
            abi,
            addresses.slice(0, remainder1).map((address: any) => [
                options.voltAddress,
                'balanceOf',
                [address]
            ]),

        );



        const response2 = await multicall(
            network,
            _provider,
            abi,
            addresses.slice(remainder1, remainder2).map((address: any) => [
                options.voltAddress,
                'balanceOf',
                [address]
            ]),

        );


        const response3 = await multicall(
            network,
            _provider,
            abi,
            addresses.slice(remainder3).map((address: any) => [
                options.voltAddress,
                'balanceOf',
                [address]
            ]),

        );


        return Object.fromEntries(
            [...response1, ...response2, ...response3].map((u, i) => {
                let userLpShare = 0
                let userCurrentStakeInVolt = 0
                let userCurrentStakeInLP = 0
                let stakesOfVoltInLp = 0

                if (poolData && poolData.users.length) {

                    let user = poolData.users.find(r => r.id.toLowerCase() === addresses[i].toLowerCase())
                    if (user && user.vaults.length) {
                        user.vaults.forEach((v) => {
                            let voltLock = v.locks.find(r => r.token.toLowerCase() === options.voltAddress.toLowerCase())
                            let lpLock = v.locks.find(r => r.token.toLowerCase() === options.lpTokenAddress.toLowerCase())
                            if (voltLock) userCurrentStakeInVolt = parseFloat(formatUnits(voltLock.amount, tokenDecimals))
                            if (lpLock) userCurrentStakeInLP = parseFloat(formatUnits(lpLock.amount, tokenDecimals))
                            userLpShare = (userCurrentStakeInLP / totalStake) * 100
                            stakesOfVoltInLp = (userLpShare / 100) * totalVoltComposition
                        });
                    }

        
                    // user address => user's volt balance + staked volt balance + User LP share mapped volt balance                    

                }

                return [
                    addresses[i],
                    parseFloat(formatUnits(u.toString(), options.decimals)) + userCurrentStakeInVolt + stakesOfVoltInLp
                ]
            }

            )
        );

    }


    const response = await multicall(
        network,
        _provider,
        abi,
        addresses.map((address: any) => [
            options.voltAddress,
            'balanceOf',
            [address]
        ]),

    );



    return Object.fromEntries(
        response.map((u, i) => {

            let userLpShare = 0
            let userCurrentStakeInVolt = 0
            let userCurrentStakeInLP = 0
            let stakesOfVoltInLp = 0

            if (poolData && poolData.users.length) {

                let user = poolData.users.find(r => r.id.toLowerCase() === addresses[i].toLowerCase())
                if (user && user.vaults.length) {
                    user.vaults.forEach((v) => {
                        let voltLock = v.locks.find(r => r.token.toLowerCase() === options.voltAddress.toLowerCase())
                        let lpLock = v.locks.find(r => r.token.toLowerCase() === options.lpTokenAddress.toLowerCase())
                        if (voltLock) userCurrentStakeInVolt = parseFloat(formatUnits(voltLock.amount, tokenDecimals))
                        if (lpLock) userCurrentStakeInLP = parseFloat(formatUnits(lpLock.amount, tokenDecimals))
                        userLpShare = (userCurrentStakeInLP / totalStake) * 100
                        stakesOfVoltInLp = (userLpShare / 100) * totalVoltComposition
                    });
                }

                // user address => user's volt balance + staked volt balance + User LP share 
            }

            return [
                addresses[i],
                parseFloat(formatUnits(u.toString(), options.decimals)) + userCurrentStakeInVolt + stakesOfVoltInLp
            ]

        })
    );



}

