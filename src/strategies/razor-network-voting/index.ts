import { subgraphRequest } from "../../utils";
import { BigNumber } from '@ethersproject/bignumber';
export const author = 'adi44'
export const version = '0.1.0'

const RAZOR_NETWORK_SUBGRAPH_URL = 
    'https://api.thegraph.com/subgraphs/name/rajkharvar/indexer'

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
    //symbol: string,
    snapshot: string
) {
    const params = {                                                                                    // delegators (where : {delegatorAddress : address[1]}){
        delegators : {                                                                                  //  staker () {
            __args : {                                                                                  //     totalSupply
                where : {                                                                               //     newStake
                    delegatorAddress_in : addresses                                                   //      }
                },                                                                                      // delegatorAddress
            },                                                                                          // Amount_Delegated
            staker :{                                                                                   //  }
                totalSupply : true,
                stake : true
            },
            delegatorAddress : true,
            sAmount : true
                
        },
        stakers : {                                                                                     // stakers (where : {stakerAddress : address[0]}){
            __args : {                                                                                  //  newStake
                where : {                                                                               //  totalSupply
                    staker_in : addresses                                                       //  stakerAddress
                },                                                                                      // }
            },
            stake : true,
            totalSupply : true,
            staker : true,
            sAmount : true,
        }

    };

    if(snapshot !== 'latest'){
        // @ts-ignore
        params.delegators.__args.block = {number : snapshot};
    }

    const score = {};
    

    // subgraph request 1 : it fetches all the details of the stakers and delegators.
    const result = await subgraphRequest(RAZOR_NETWORK_SUBGRAPH_URL, params);
    console.log(result)
    if(result && result.delegators){
            result.delegators.forEach(async (delegator: { sAmount: string; staker: { stake: string; totalSupply: string; }; delegatorAddress: string | number; }) => {
                let razor_amount = await sRZR_to_RZR(BigNumber.from(delegator.sAmount), BigNumber.from(delegator.staker.totalSupply), BigNumber.from(delegator.staker.stake))
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
        result.stakers.forEach(async (Staker: { staker: string | number; stake: string; sAmount : string|Number; totalSupply : string}) => {
            let razor_amount = await sRZR_to_RZR(BigNumber.from(Staker.sAmount), BigNumber.from(Staker.totalSupply), BigNumber.from(Staker.stake))
            //score will be based on the current stake in the block Number
            if(!score[Staker.staker])
                { 
                    //if score[delegator] has no score setup already we will put it as intial amount
                    score[Staker.staker] = wei_to_ether(Number(razor_amount))
                }
                else{
                    // update the score of delegator by adding new Stoken -> razor Value
                    score[Staker.staker] += wei_to_ether(Number(razor_amount))
                }
            
        });
    }
    
    // it returns the array of scores.
    return score || {};
}