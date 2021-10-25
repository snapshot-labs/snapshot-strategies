import { subgraphRequest } from "../../utils";
import { BigNumber } from '@ethersproject/bignumber';
export const author = 'adi44'
export const version = '0.1.0'

const RAZOR_NETWORK_SUBGRAPH_URL = 
    'https://api.thegraph.com/subgraphs/name/adi44/subgraphrazor'

// a method to calculate corresponding razor amount for delegators
async function sRZR_to_RZR(
    stake: BigNumber,
    totalSupply: BigNumber,
    amount: BigNumber
){
    return (stake.mul(amount)).div(totalSupply)

}

function wei_to_ether(amount : number ){
    return amount/10**18
}

export async function strategy(
    space: any,
    network: any,
    provider: any,
    addresses: any[],
    options: any,
    snapshot: string
) {
    const params = {                                                                                    // delegators (where : {delegatorAddress : address[1]}){
        delegators : {                                                                                  //  staker () {
            __args : {                                                                                  //     totalSupply
                where : {                                                                               //     newStake
                    delegatorAddress_in : addresses                                                     //      }
                },                                                                                      // delegatorAddress
            },                                                                                          // Amount_Delegated
            staker :{                                                                                   //  }
                totalSupply : true,
                newStake : true
            },
            delegatorAddress : true,
            Amount_Delegated : true
                
        },
        stakers : {                                                                                     // stakers (where : {stakerAddress : address[0]}){
            __args : {                                                                                  //  newStake
                where : {                                                                               //  totalSupply
                    stakerAddress_in : addresses                                                        //  stakerAddress
                },                                                                                      // }
            },
            newStake : true,
            totalSupply : true,
            stakerAddress : true
        }

    };

    if(snapshot !== 'latest'){
        // @ts-ignore
        params.delegators.__args.block = {number : snapshot};
    }

    const score = {};
    // for delegators
    /* 
        id10x2 Delegator 1    200    
        id20x1 Delegator 2    100
        id20x2 Delegator 2    200
        id20x3 Delegator 1    100
    
    
    */

    // subgraph request 1 : it fetches all the details of the stakers and delegators.
    const result = await subgraphRequest(RAZOR_NETWORK_SUBGRAPH_URL, params);

    if(result && result.delegators){
            result.delegators.forEach(async (delegator: { Amount_Delegated: string; staker: { newStake: string; totalSupply: string; }; delegatorAddress: string | number; }) => {
                let razor_amount = await sRZR_to_RZR(BigNumber.from(delegator.Amount_Delegated), BigNumber.from(delegator.staker.totalSupply), BigNumber.from(delegator.staker.newStake))
                //if delegator has delegated to more than one staker, we need to add that amount also to calculate score.
                if(!score[delegator.delegatorAddress])
                { 
                    //if score[delegator] has no score setup already we will put it as intial amount
                    score[delegator.delegatorAddress] = wei_to_ether(Number(razor_amount))
                }
                else{
                    // update the score of delegator by adding new Stoken -> razor Value
                    score[delegator.delegatorAddress] += wei_to_ether(Number(razor_amount))
                }
            });

        }
    
    // for stakers
    if(result && result.stakers){
        result.stakers.forEach((staker: { stakerAddress: string | number; newStake: string; }) => {
            //score will be based on the current stake in the block Number
            if(!score[staker.stakerAddress])
                { 
                    //if score[delegator] has no score setup already we will put it as intial amount
                    score[staker.stakerAddress] = wei_to_ether(parseInt(staker.newStake))
                }
                else{
                    // update the score of delegator by adding new Stoken -> razor Value
                    score[staker.stakerAddress] += wei_to_ether(parseInt(staker.newStake))
                }
            
        });
    }
    
    // it returns the array of scores.
    return score || {};
}