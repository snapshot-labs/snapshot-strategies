import { Strategy } from "../../types";
import { getAddress } from "@ethersproject/address";

export const author = "archethic-core";
export const version = "0.1.0";

const abi = [
  "function getVotingPower(address account) view returns (uint256)"
];

export const strategy: Strategy = async (
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) => {
  const blockTag = typeof snapshot === "number" ? snapshot : "latest";

  const response = await Promise.all(
    addresses.map(async (address: string): Promise<[string, number]> => {
      try {
        const votingPower: bigint = await provider.call({
          to: options.address,
          data: provider.encodeFunctionData(abi[0], [getAddress(address)])
        }, blockTag);

        return [address, Number(votingPower.toString())];
      } catch (error) {
        return [address, 0];
      }
    })
  );

  return Object.fromEntries(response);
};
