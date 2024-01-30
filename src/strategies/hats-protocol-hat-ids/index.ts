import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';

export const author = 'hotmanics';
export const version = '1.0.0';

const abi = [
  'function isWearerOfHat(address _user, uint256 _hatId) external view returns (bool isWearer)'
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

  const hatIds = options.hatIds.map((hatId) =>
    BigNumber.from(HatIpToHex(hatId))
  );

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) => {
    hatIds.forEach((hatId) => {
      multi.call(`${address}.${hatId}`, options.address, 'isWearerOfHat', [
        address,
        hatId
      ]);
    });
  });

  const multicallResult: Record<
    string,
    Record<string, boolean>
  > = await multi.execute();

  const res = Object.fromEntries(
    Object.entries(multicallResult).map(([address, isWearerPerHat]) => [
      getAddress(address),
      Object.values(isWearerPerHat).includes(true) ? 1 : 0
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
