import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'dramacrypto';
export const version = '0.1.0';

const v1Abi = [
  'function lockCount(address account_) external view returns (uint256)',
  'function viewLocks(address account_, uint256 offset_, uint256 count_) external view returns (tuple(uint256 lid, uint256 amount, uint256 lockAt, uint256 duration, uint256 lastRewardAt, bool unlocked, uint256[] nfts)[])'
];
const v2Abi = [
  'function userAllLockCount(address account) external view returns (uint256)',
  'function userAllLocks(address account, uint256 from, uint256 count) external view returns (tuple(address owner, uint256 id, uint256 tokenAmount, uint256 lockAt, uint256 duration, uint256 lastRewardAt, uint256 listPrice, uint256[] nftIds, uint8[] nftRarities)[])'
];

interface V1LockData {
  lid: BigNumber;
  unlocked: boolean;
  amount: BigNumber;
  lockAt: BigNumber;
  duration: BigNumber;
  lastRewardAt: BigNumber;
  nfts: BigNumber[];
}

interface V2LockData {
  owner: string;
  id: BigNumber;
  tokenAmount: BigNumber;
  lockAt: BigNumber;
  duration: BigNumber;
  lastRewardAt: BigNumber;
  listPrice: BigNumber;
  nftIds: BigNumber[];
  nftRarities: number[];
}

async function v1_scores(
  network,
  provider,
  addresses,
  snapshot,
  contract_address,
  token_decimals
): Promise<[string, number][]> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const lockDataMulti = new Multicaller(network, provider, v1Abi, { blockTag });
  addresses.forEach((address) =>
    lockDataMulti.call(address, contract_address, 'viewLocks', [
      address,
      0,
      1000
    ])
  );
  const lockDatasMulti: Record<string, any> = await lockDataMulti.execute();

  return Object.entries(lockDatasMulti).map(([address, userLocks]) => {
    const userLockedTokenAmount = userLocks
      .filter((userLock: V1LockData) => !userLock.unlocked)
      .reduce((cur, acc: V1LockData) => cur + acc.nfts.length, 0);
    return [address, userLockedTokenAmount];
  });
}

async function v2_3_scores(
  network,
  provider,
  addresses,
  snapshot,
  contract_address,
  token_decimals
): Promise<[string, number][]> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const lockDataMulti = new Multicaller(network, provider, v2Abi, { blockTag });
  addresses.forEach((address) =>
    lockDataMulti.call(address, contract_address, 'userAllLocks', [
      address,
      0,
      1000
    ])
  );
  const lockDatasMulti: Record<string, any> = await lockDataMulti.execute();

  return Object.entries(lockDatasMulti).map(([address, userLocks]) => {
    const userLockedTokenAmount = userLocks.reduce(
      (cur, acc: V2LockData) => cur + acc.nftIds.length,
      0
    );
    return [address, userLockedTokenAmount];
  });
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const v1Scores = await v1_scores(
    network,
    provider,
    addresses,
    snapshot,
    options.v1_address,
    options.decimals
  );
  const v2Scores = await v2_3_scores(
    network,
    provider,
    addresses,
    snapshot,
    options.v2_address,
    options.decimals
  );
  const v3Scores = await v2_3_scores(
    network,
    provider,
    addresses,
    snapshot,
    options.v3_address,
    options.decimals
  );

  return Object.fromEntries(
    v1Scores.map(([address, v1Score], index) => {
      const totalScore = v1Score + v2Scores[index][1] + v3Scores[index][1];
      return [address, totalScore];
    })
  );
}
