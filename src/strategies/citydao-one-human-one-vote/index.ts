import { Multicaller } from '../../utils';

export const author = 'RosebuDAO';
export const version = '0.1.0';

const proofOfHumanityAbi = [
  'function isRegistered(address _submissionID) external view returns (bool)'
];
const erc1155BalanceOfAbi = [
  'function balanceOf(address owner, uint256 id) view returns (uint256)'
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

  //verify humanity
  const multi0 = new Multicaller(network, provider, proofOfHumanityAbi, { blockTag });
  addresses.forEach((address) =>
    multi0.call(address, options.proofOfHumanityContract, 'isRegistered', [address])
  );
  const result0: Record<string, number> = await multi0.execute();
  //get balanceOf for humans
  const multi1 = new Multicaller(network, provider, erc1155BalanceOfAbi, { blockTag });
  const votes = new Map();
  Object.entries(result0).forEach(([address, human]) => {
    if (human) {
      multi1.call(address, options.cityDaoCitizenNftContract, 'balanceOf', [address, options.cityDaoCitizenNftTokenId]);
    }
    else {
      votes.set(address, 0);
    }
  });
  const result1: Record<string, number> = await multi1.execute();
  Object.entries(result1).forEach(([address, balance]) => {
    votes.set(address, Math.min(balance, 1));
  });
  return Object.fromEntries(votes);
}
