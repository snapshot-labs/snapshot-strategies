// import { multicall } from '@snapshot-labs/snapshot.js/dist/utils';
import { subgraphRequest } from '../../utils';
// import { formatUnits } from '@ethersproject/units';
// import { BigNumberish } from '@ethersproject/bignumber';
// import { Multicaller } from '../../utils';
import { utils } from 'ethers';

const subgraphURL = `https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-optimism`;

export const author = 'hotmanics';
export const version = '0.1.1';

// const abi = [
//   'function balanceOf(address _wearer, uint256 _hatId) public view returns (uint256 balance)',
//   'function viewHat(uint256 _hatId) public view returns (string memory details, uint32 maxSupply, uint32 supply, address eligibility, address toggle, string memory imageURI, uint16 lastHatId, bool mutable_, bool active)',
//   'function isEligible(address _wearer, uint256 _hatId) external view returns (bool eligible)'
// ];

//The goal:
//Within 5 requests, get all hats and their wearers.
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
  let flag = false;
  tree.hats.forEach((hat) => {
    hat.wearers.forEach((wearer) => {
      if (utils.getAddress(wearer.id) === address) {
        flag = true;
      }
    });
  });

  return flag;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const result = await subgraphRequestHats();

  const wearersInAddresses = {};

  addresses.forEach((address) => {
    wearersInAddresses[address] = checkIfExists(address, result.tree) ? 1 : 0;
  });

  console.log(wearersInAddresses);
  // const response = await multicall(network, provider, abi, wearer)
  return wearersInAddresses;
}
