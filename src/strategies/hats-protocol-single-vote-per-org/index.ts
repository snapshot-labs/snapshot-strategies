import { subgraphRequest } from '../../utils';
// import { formatUnits } from '@ethersproject/units';
// import { BigNumberish } from '@ethersproject/bignumber';
// import { Multicaller } from '../../utils';

const subgraphURL = `https://api.thegraph.com/subgraphs/name/hats-protocol/hats-v1-optimism`;

export const author = 'hotmanics';
export const version = '0.1.1';

// const abi = [
//   'function balanceOf(address _wearer, uint256 _hatId) public view returns (uint256 balance)',
//   'function viewHat(uint256 _hatId) public view returns (string memory details, uint32 maxSupply, uint32 supply, address eligibility, address toggle, string memory imageURI, uint16 lastHatId, bool mutable_, bool active)'
// ];

//The goal:
//Within 5 requests, get all hats and their wearers.
async function subgraphRequestHats() {
  //Every hat belongs to a tree, which root is a top hat.
  //The ID of a tree, is it's top hat domain
  //(first 4 bytes of the top hat ID).
  //Get a specific tree:
  const params = {
    tree: {
      __args: {
        id: `0x00000002`
      },
      id: true,
      hats: {
        id: true
      }
    }
  };
  const result = await subgraphRequest(subgraphURL, params);
  console.log(result);

  result.tree.hats.forEach((hat) => {
    console.log(hat);
  });

  //It works wonderfully. We get all of the hats under a give top hat. However we are not done yet.
  //We have several paths forward

  //Possible Solution 1:
  //The following query will get the wearers of the hat:
  //{
  //  hat(
  //  id: "0x0000000100010000000000000000000000000000000000000000000000000000"
  //  ) {
  //    id
  //    wearers {
  //       id
  //    }
  //  }
  //}
  //Of course this gives me the answer, but fails on scaling if there are more than 5 hats involved.

  //   The following query will get all hats of a wearer:
  // {
  //   wearer(id: "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd") {
  //     id
  //     currentHats {
  //       id
  //     }
  //   }
  // } This could also work, but suffers the same problem if there are more than 5 addresses
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

  await subgraphRequestHats();

  //The following are very early attempts which quickly reach an unscalable state.
  //
  //
  //
  //
  //
  //
  // const multi = new Multicaller(network, provider, abi, { blockTag });
  // multi.call(addresses[0], options.address, 'viewHat', [options.baseHat]);
  // const hat = await multi.execute();
  // console.log(hat);

  // for (let i = 1; i <= hat.lastHadId; i++) {
  // }

  // const myObj = {};
  // addresses.forEach(async (address) => {
  //   myObj[address] = 0;
  // });

  // for (let i = 0; i < options.hats.length; i++) {
  //   const multi = new Multicaller(network, provider, abi, { blockTag });

  //   addresses.forEach(async (address) => {
  //     multi.call(address, options.address, 'balanceOf', [
  //       address,
  //       options.hats[i]
  //     ]);
  //   });

  //   const result = await multi.execute();

  //   addresses.forEach(async (address) => {
  //     myObj[address] += parseFloat(result[address]);
  //   });
  // }

  const testReturnObj = {};
  addresses.forEach((address) => {
    testReturnObj[address] = 1;
  });

  return testReturnObj;

  // return Object.fromEntries(
  //   Object.entries(myObj).map(([address, totalScore]) => [
  //     address,
  //     (totalScore as number) >= 1 ? 1 : 0
  //   ])
  // );
}
