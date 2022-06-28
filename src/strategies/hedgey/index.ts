import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'Hedgey';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address owner) external view returns (uint256 balance)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)',
  'function futures(uint256 index) external view returns (uint256 amount, address token, uint256 unlockDate)'
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const balanceOfMulti = new Multicaller(network, provider, abi, {
    blockTag
  });

  addresses.forEach((address: string) => {
    balanceOfMulti.call(address, options.contractAddress, 'balanceOf', [
      address
    ]);
  });

  const balanceOfResult = await balanceOfMulti.execute();

  const nftHolderMulti = new Multicaller(network, provider, abi, {
    blockTag
  });

  for (const [address, balance] of Object.entries<number>(balanceOfResult)) {
    for (let index = 0; index < balance; index++) {
      nftHolderMulti.call(
        `${address}-${index}`,
        options.contractAddress,
        'tokenOfOwnerByIndex',
        [address, String(index)]
      );
    }
  }

  const nftHolders = await nftHolderMulti.execute();

  const dealsMulti = new Multicaller(network, provider, abi, { blockTag });

  for (const [address, nftId] of Object.entries(nftHolders)) {
    dealsMulti.call(address, options.contractAddress, 'futures', [nftId]);
  }
  const ownerToDeal = await dealsMulti.execute();

  const votes = {};
  for (const [index, deal] of Object.entries<any>(ownerToDeal)) {
    const address = index.split('-')[0];
    if (!votes[address]) {
      votes[address] = BigNumber.from(0);
    }

    if (deal.token.toLowerCase() === options.token.toLowerCase()) {
      votes[address] = votes[address].add(deal.amount);
    }
  }

  const result = [];

  Object.keys(votes).forEach((address) => {
    const score = votes[address].div(BigNumber.from(10).pow(options.decimals));
    result[address] = score.toNumber();
  });

  return result;
}
