import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
export const author = 'razor-network';
export const version = '0.1.0';

const RAZOR_NETWORK_SUBGRAPH_URL =
  'https://graph-indexer.razorscan.io/subgraphs/name/razor/razor';

// a method to calculate corresponding razor amount for delegators
function sRZR_to_RZR(
  stake: BigNumber,
  totalSupply: BigNumber,
  amount: BigNumber
) {
  try {
    return stake.mul(amount).div(totalSupply);
  } catch (err) {
    return BigNumber.from(0);
    // do nothing
  }
}

function wei_to_ether(amount: number) {
  return amount / 10 ** 18;
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
  const params = {
    delegators: {
      __args: {
        where: {
          delegatorAddress_in: addresses
        } // delegatorAddress
      }, // Amount_Delegated
      staker: {
        totalSupply: true,
        stake: true,
        staker: true
      },
      delegatorAddress: true,
      sAmount: true
    },
    stakers: {
      __args: {
        where: {
          staker_in: addresses //  stakerAddress
        }
      },
      stake: true,
      totalSupply: true,
      staker: true,
      sAmount: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.delegators.__args.block = { number: snapshot };
  }

  const score = {};

  // subgraph request 1 : it fetches all the details of the stakers and delegators.
  const result = await subgraphRequest(RAZOR_NETWORK_SUBGRAPH_URL, params);
  if (result.delegators || result.stakers) {
    result.delegators.forEach(
      async (delegator: {
        sAmount: string;
        staker: { stake: string; totalSupply: string; staker: string };
        delegatorAddress: string;
      }) => {
        const razor_amount = sRZR_to_RZR(
          BigNumber.from(delegator.sAmount),
          BigNumber.from(delegator.staker.totalSupply),
          BigNumber.from(delegator.staker.stake)
        );
        if (
          getAddress(delegator.delegatorAddress) !=
          getAddress(delegator.staker.staker)
        ) {
          //if delegator has delegated to more than one staker, we need to add that amount also to calculate score.
          if (!score[getAddress(delegator.delegatorAddress)]) {
            //if score[delegator] has no score setup already we will put it as intial amount
            score[getAddress(delegator.delegatorAddress)] = wei_to_ether(
              Number(razor_amount)
            );
          } else {
            // update the score of delegator by adding new Stoken -> razor Value
            score[getAddress(delegator.delegatorAddress)] += wei_to_ether(
              Number(razor_amount)
            );
          }
        }
      }
    );

    // for stakers
    result.stakers.forEach(
      async (Staker: {
        staker: string;
        stake: string;
        sAmount: string | number;
        totalSupply: string;
      }) => {
        const razor_amount = sRZR_to_RZR(
          BigNumber.from(Staker.sAmount),
          BigNumber.from(Staker.totalSupply),
          BigNumber.from(Staker.stake)
        );
        //score will be based on the current stake in the block Number
        if (!score[getAddress(Staker.staker)]) {
          //if score[delegator] has no score setup already we will put it as intial amount
          score[getAddress(Staker.staker)] = wei_to_ether(Number(razor_amount));
        } else {
          // update the score of delegator by adding new Stoken -> razor Value
          score[getAddress(Staker.staker)] += wei_to_ether(
            Number(razor_amount)
          );
        }
      }
    );
  }

  // it returns the array of scores.
  return score || {};
}
