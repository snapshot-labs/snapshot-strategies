import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'caranell';
export const version = '0.1.0';
const DECIMALS = 18;

const balanceAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const ownerAbi = ['function ownerOf(uint256 id) public view returns (address)'];

const signerAbi = [
  'function signerOf(uint256 id) external view  returns (address)'
];

const lastTokenIdAbi = ['function getNextId() external view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const formattedAddressesThatVoted = addresses.map((addr) => getAddress(addr));

  const erc721OwnerCaller = new Multicaller(network, provider, ownerAbi, {
    blockTag
  });
  const erc721SignerCaller = new Multicaller(network, provider, signerAbi, {
    blockTag
  });
  const erc721LastTokenIdCaller = new Multicaller(
    network,
    provider,
    lastTokenIdAbi,
    { blockTag }
  );

  const erc20BalanceCaller = new Multicaller(network, provider, balanceAbi, {
    blockTag
  });

  erc721LastTokenIdCaller.call('lastTokenId', options.erc721, 'getNextId');

  const lastIndex = await erc721LastTokenIdCaller.execute();
  const lastTokenId = BigNumber.from(lastIndex.lastTokenId).toNumber();

  for (let i = 0; i < lastTokenId; i++) {
    erc721SignerCaller.call(i, options.erc721, 'signerOf', [i]);
    erc721OwnerCaller.call(i, options.erc721, 'ownerOf', [i]);
  }

  const [erc721Signers, erc721Owners]: [
    Record<string, string>,
    Record<string, string>
  ] = await Promise.all([
    erc721SignerCaller.execute(),
    erc721OwnerCaller.execute()
  ]);

  const erc721OwnersArr = Object.entries(erc721Owners);
  const erc721SignersArr = Object.entries(erc721Signers);

  const delegatedTokens = erc721SignersArr.filter(
    ([id, address]) => address !== erc721Owners[id]
  );

  const votingAddressToOwnerAddressMap = erc721OwnersArr.reduce(
    (acc, [id, addr]) => {
      if (!formattedAddressesThatVoted.includes(addr)) {
        return acc;
      }
      if (delegatedTokens.some((delegated) => delegated[0] === id)) {
        return acc;
      }
      acc.set(addr, [addr]);
      return acc;
    },
    new Map<string, string[]>()
  );

  erc721SignersArr.reduce((acc, [id, addr]) => {
    if (!formattedAddressesThatVoted.includes(addr)) {
      return acc;
    }

    if (!delegatedTokens.some((delegated) => delegated[0] === id)) {
      return acc;
    }

    if (!votingAddressToOwnerAddressMap.has(addr)) {
      acc.set(addr, []);
    }
    acc.get(addr)?.push(erc721OwnersArr[id][1]);

    return acc;
  }, votingAddressToOwnerAddressMap);

  votingAddressToOwnerAddressMap.forEach((addresses) => {
    addresses.forEach((address) => {
      erc20BalanceCaller.call(address, options.erc20, 'balanceOf', [address]);
    });
  });

  const erc20Balances: Record<string, BigNumberish> =
    await erc20BalanceCaller.execute();

  const agg = formattedAddressesThatVoted.map((addr) => {
    const holderAddresses = votingAddressToOwnerAddressMap.get(addr);
    const total =
      holderAddresses?.reduce((sum, addr) => {
        return sum.add(erc20Balances[addr] || 0);
      }, BigNumber.from(0)) || 0;
    return [addr, parseFloat(formatUnits(total, DECIMALS))];
  });
  const result = Object.fromEntries(agg);
  return result;
}
