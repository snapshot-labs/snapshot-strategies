// import { multicall } from '../../utils';
import { subgraphRequest } from '../../utils';
// import { formatUnits } from '@ethersproject/units';
// import { BigNumberish } from '@ethersproject/bignumber';
// import { Multicaller } from '../../utils';
import { utils } from 'ethers';
import { Multicaller } from '../../utils';

const subgraphURL = `https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-optimism`;

export const author = 'hotmanics';
export const version = '0.1.1';

const abi = [
  'function isEligible(address _wearer, uint256 _hatId) external view returns (bool eligible)'
];

async function subgraphRequestHats() {
  const params = {
    tree: {
      __args: {
        id: `0x00000002`
      },
      id: true,
      hats: {
        id: true,
        wearers: {
          id: true
        }
      }
    }
  };
  const result = await subgraphRequest(subgraphURL, params);
  return result;
}

function checkIfExists(address, tree) {
  const addressWithHats = <any>[];
  tree.hats.forEach((hat) => {
    hat.wearers.forEach((wearer) => {
      if (utils.getAddress(wearer.id) === address) {
        const addressWithHat = {
          address: utils.getAddress(wearer.id),
          hat: BigInt(hat.id)
        };
        addressWithHats.push(addressWithHat);
      }
    });
  });
  return addressWithHats;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const result = await subgraphRequestHats();
  let wearersInAddresses = <any>[];

  addresses.forEach((address) => {
    const res = checkIfExists(address, result.tree);
    wearersInAddresses = wearersInAddresses.concat(res);
  });

  const multi = new Multicaller(network, provider, abi, { blockTag });

  wearersInAddresses.forEach((wearer) => {
    multi.call(wearer.address, options.address, 'isEligible', [
      wearer.address,
      wearer.hat
    ]);
  });

  const multiResult: Record<any, any> = await multi.execute();

  return Object.fromEntries(
    Object.entries(multiResult).map(([address, isValid]) => [
      address,
      isValid ? 1 : 0
    ])
  );
}
