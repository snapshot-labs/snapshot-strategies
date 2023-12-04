import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';

export const author = 'hotmanics';
export const version = '1.0.0';

const abi = [
  'function isWearerOfHat(address _user, uint256 _hatId) view returns (bool isWearer)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const hatId = BigNumber.from(HatIpToHex(options.hatId));

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'isWearerOfHat', [address, hatId])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  const res = Object.fromEntries(
    Object.entries(result).map(([address, isWearer]) => [
      getAddress(address),
      isWearer ? 1 : 0
    ])
  );

  return res;
}

function HatIpToHex(hatIp) {
  let observedChunk = hatIp;

  const sections: number[] = [];

  while (true) {
    if (observedChunk.indexOf('.') === -1) {
      const section = observedChunk.substring(0, observedChunk.length);
      sections.push(Number(section));
      break;
    }

    const section = observedChunk.substring(0, observedChunk.indexOf('.'));
    observedChunk = observedChunk.substring(
      observedChunk.indexOf('.') + 1,
      observedChunk.length
    );

    sections.push(Number(section));
  }

  let constructedResult = '0x';

  for (let i = 0; i < sections.length; i++) {
    const hex = sections[i].toString(16);

    if (i === 0) {
      constructedResult += hex.padStart(8, '0');
    } else {
      constructedResult += hex.padStart(4, '0');
    }
  }

  constructedResult = constructedResult.padEnd(66, '0');

  return constructedResult;
}
