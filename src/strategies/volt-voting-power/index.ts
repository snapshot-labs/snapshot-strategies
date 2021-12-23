
import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

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



    const params = {
        users: {
            __args: {
                where: {
                    id_in: addresses.map((address) => address.toLowerCase())
                },
                first: 1000
            },
            id: true,

            vaults: {
                locks: {
                    __args: {
                        where: {
                            token: lpTokenAddress
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

    const params2 = {
        users: {
            __args: {
                where: {
                    id_in: addresses.map((address) => address.toLowerCase())
                },
                first: 1000
            },
            id: true,

            liquidityPositions: {

                liquidityTokenBalance: true,
                pair: {
                    id: true,
                    token0: {
                        id: true
                    },
                    reserve0: true,
                    token1: {
                        id: true
                    },
                    reserve1: true,
                    totalSupply: true
                }
            }
        }
    };





    // For Volt single token pool    
    if (options.lpTokenAddress.toLowerCase() === options.voltAddress.toLowerCase()) {
        const geyserData = await subgraphRequest(SUBGRAPH_URL[options.network || network], params2)
        const result = await subgraphRequest(SUBGRAPH_URL[options.network || network], params);

        let userObj = {};
        const results: object[] = [];


        if (geyserData && geyserData.geysers.length && result && result.users) {
            const totalStake = parseFloat(formatUnits(geyserData.geysers[0].totalStake, tokenDecimals))


            result.users.forEach((u) => {
                userObj['userAddress'] = getAddress(u.id)
                u.vaults.forEach((v) => {
                    userObj['vaultAddress'] = v.id
                    userObj['currentStake'] = 0
                    v.locks.forEach(lock => {
                        const userCurrentStake = parseFloat(formatUnits(lock.amount, tokenDecimals))
                        const userLpShare = (userCurrentStake / totalStake) * 100


                        userObj['currentStake'] = userCurrentStake
                        userObj['userLpShare'] = userLpShare
                    });

                });
                results.push(userObj)
                userObj = {}


            });

            return Object.fromEntries(
                results.map((value, i) => [
                    value['userAddress'],
                    value['userLpShare']
                ])
            );
        }
    }


    const result = await subgraphRequest(UNISWAP_SUBGRAPH_URL[options.network || network], params2);
    const score = {};
    if (result && result.users) {
        result.users.forEach((u) => {

            u.liquidityPositions.filter(
                (p) =>
                    p.pair.id.toLowerCase() === options.lpTokenAddress.toLowerCase()
            )
                .forEach((lp) => {
                    const userBalance = Number(lp.liquidityTokenBalance)
                    const isToken0 = lp.pair.token0.id.toLowerCase() === options.voltAddress.toLowerCase()
                    const totalDeposit = Number(lp.pair.reserve0) + Number(lp.pair.reserve1)
                    let userScore = 0
                    const userLpShare = userBalance / totalDeposit
                  
                    if (isToken0) {
                        // total VOLT in the pool * user's pool percentage
                        userScore = lp.pair.reserve0 * userLpShare
                    } else {
                        userScore = lp.pair.reserve1 * userLpShare
                    }


                    const userAddress = getAddress(u.id);
                    if (!score[userAddress]) score[userAddress] = 0;
                    score[userAddress] = score[userAddress] + userScore;
                    console.log(score)
                });
        });
    }
    return score || {};

}


