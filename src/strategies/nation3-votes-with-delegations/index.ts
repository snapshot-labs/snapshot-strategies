import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

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
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

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

  addresses.forEach((address) => {
    erc20BalanceCaller.call(address, options.erc20, 'balanceOf', [address]);
  });

  const [erc20Balances, lastIndex]: [
    Record<string, BigNumberish>,
    Record<string, BigNumberish>
  ] = await Promise.all([
    erc20BalanceCaller.execute(),
    erc721LastTokenIdCaller.execute()
  ]);

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
  const delegatedTokens = erc721OwnersArr.filter(
    ([id, address]) => address != erc721Signers[id]
  );

  const result = Object.fromEntries(
    addresses.map((address) => {
      const tokenDelegations = delegatedTokens.find(
        ([, addr]) => addr === address
      );

      if (tokenDelegations?.length) {
        const realOwners = erc721OwnersArr.find(([id]) =>
          tokenDelegations.includes(id)
        );

        if (!realOwners?.length) {
          return [address, 0.0];
        }

        const ownerAddresses = realOwners.map(([, addr]) => addr);
        const erc20Balance = ownerAddresses.reduce((sum, addr) => {
          return sum + parseFloat(formatUnits(erc20Balances[addr], DECIMALS));
        }, 0);

        return [address, parseFloat(formatUnits(erc20Balance, DECIMALS))];
      } else {
        const erc20Balance = erc20Balances[address];
        const erc721Token = erc721OwnersArr.find(
          ([, addr]) => addr === address
        );

        if (!erc721Token) {
          return [address, 0.0];
        }

        const isUsersTokenDelegated = delegatedTokens.find(
          ([id]) => id === erc721Token[0]
        );

        if (erc721Token && !isUsersTokenDelegated) {
          return [address, parseFloat(formatUnits(erc20Balance, DECIMALS))];
        }

        return [address, 0.0];
      }
    })
  );
  return result;
}
