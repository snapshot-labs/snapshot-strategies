import { formatUnits } from '@ethersproject/units';
import { getBlockNumber } from '../../utils';
import { Multicaller } from '../../utils';

export const author = 'marcelomorgado';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const snapshotBlock =
    typeof snapshot === 'number' ? snapshot : await getBlockNumber(provider);
  const snapshotBlocks: number[] = [];

  const { blocksPerPeriod, minBlock } = options;

  const periods = 4;

  for (let i = 0; i < periods; i++) {
    const blockTag = snapshotBlock - blocksPerPeriod * i;
    if (blockTag < minBlock) {
      break;
    }
    snapshotBlocks.push(blockTag);
  }

  const scores = await Promise.all([
    ...snapshotBlocks.map((blockTag) =>
      getScores(provider, addresses, options, blockTag)
    )
  ]);

  const averageScore = {};
  addresses.forEach((address: string) => {
    const userScore = scores
      .map((score) => score[address])
      .reduce((accumulator, score) => (accumulator += score), 0);
    averageScore[address] = userScore / snapshotBlocks.length;
  });

  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const score = averageScore[addresses[i]];
        return [addresses[i], score];
      })
  );
}

async function getScores(provider, addresses, options, blockTag) {
  const { votingPower: votingPowerAddress } = options;
  const erc20Abi = ['function balanceOf(address) view returns (uint256)'];

  const multi = new Multicaller('1', provider, erc20Abi, { blockTag });
  addresses.forEach((address: string) => {
    multi.call(`token.${address}`, votingPowerAddress, 'balanceOf', [address]);
  });

  const result = await multi.execute();

  const score = {};
  addresses.forEach((address: string) => {
    const balance = result.token[address];
    score[address] = parseFloat(formatUnits(balance, 18));
  });

  return score;
}
