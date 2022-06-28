import { defaultAbiCoder } from '@ethersproject/abi';
import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';
import { subgraphRequest } from '../../utils';

export const author = 'RobAnon';
export const version = '0.1.0';

export const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/alexvorobiov/eip1155subgraph'
};

const abi2 = [
  'function getDisplayValues(uint fnftId, uint) external view returns (bytes memory)',
  'function rewardsHandlerAddress() external view returns (address)',
  'function getAsset(uint fnftId) external view returns (address)'
];

const abi = [
  'function getFNFT(uint fnftId) external view returns (tuple(address asset, address pipeToContract, uint depositAmount, uint depositMul, uint split, uint depositStopTime, bool maturityExtension, bool isMulti, bool nontransferrable))'
];

const abi3 = [
  'function totalLPAllocPoint() external view returns (uint)',
  'function totalBasicAllocPoint() external view returns (uint)'
];

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const PRECISION = BigNumber.from('1000000000000000000000');
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const eip1155OwnersParams = {
    accounts: {
      __args: {
        where: {
          id_in: addresses.map((a) => a.toLowerCase())
        }
      },
      id: true,
      balances: {
        value: true,
        token: {
          registry: {
            id: true
          },
          identifier: true
        }
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    eip1155OwnersParams.accounts.__args.block = { number: snapshot };
  }
  const idsToCheck = new Set<string>();

  const result = await subgraphRequest(
    SUBGRAPH_URL[network],
    eip1155OwnersParams
  );
  result.accounts.forEach((element) => {
    element.relBal = element.balances.filter((balance) => {
      const isRightAddress =
        balance.token.registry.id.toLowerCase() ===
          options.address.toLowerCase() && balance.value != '0';
      if (isRightAddress) {
        idsToCheck.add(balance.token.identifier);
      }
      return isRightAddress;
    });
  });
  let ids = Array.from(idsToCheck);
  const response = await multicall(
    network,
    _provider,
    abi2,
    ids.map((id: any) => [options.staking, 'getDisplayValues', [id, 0]]),
    { blockTag }
  );

  const fnfts = Object.fromEntries(
    response.map((value, i) => [
      ids[i],
      defaultAbiCoder.decode(['uint', 'uint'], value[0])[0]
    ])
  );
  Object.keys(fnfts).forEach((element) => {
    if (fnfts[element].eq('0')) {
      delete fnfts[element];
    }
  });
  ids = Object.keys(fnfts);
  const response2 = await multicall(
    network,
    _provider,
    abi,
    ids.map((id: any) => [options.tokenVault, 'getFNFT', [id]]),
    { blockTag }
  );
  const completeFNFTs = Object.fromEntries(
    response2.map((value, i) => [
      ids[i],
      {
        allocPoints: fnfts[ids[i]],
        isRVST: value[0].asset.toLowerCase() == options.token.toLowerCase()
      }
    ])
  );
  let rewards = await multicall(
    network,
    _provider,
    abi2,
    [''].map(() => [options.staking, 'rewardsHandlerAddress', []]),
    { blockTag }
  );
  rewards = rewards[0][0];
  let allocLP = await multicall(
    network,
    _provider,
    abi3,
    [
      [rewards, 'totalLPAllocPoint', []],
      [rewards, 'totalBasicAllocPoint', []]
    ],
    { blockTag }
  );
  const allocToken = allocLP[1][0];
  allocLP = allocLP[0][0];

  //allocToken = allocToken[0][0];

  const finalResult = {};
  result.accounts.forEach((account) => {
    account.relBal.forEach((relBalEle) => {
      if (completeFNFTs.hasOwnProperty(relBalEle.token.identifier)) {
        const score = completeFNFTs[relBalEle.token.identifier].allocPoints
          .mul(PRECISION)
          .div(
            completeFNFTs[relBalEle.token.identifier].isRVST
              ? allocToken
              : allocLP
          );
        if (finalResult.hasOwnProperty(getAddress(account.id))) {
          finalResult[getAddress(account.id)].add(score);
        } else {
          finalResult[getAddress(account.id)] = score;
        }
      }
    });
  });
  const returnVals = {};
  Object.keys(finalResult).forEach((element) => {
    returnVals[element] = parseInt(finalResult[element].toString(), 10);
  });
  return returnVals;
}
