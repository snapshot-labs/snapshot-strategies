import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'profwobble';
export const version = '0.1.0';

// const Jelly = '0x387426F2C00B569B763584B2e0C6c3b2C34793E8';
// const veJelly = '0x387426F2C00B569B763584B2e0C6c3b2C34793E8';
const stickyHelper = '0x1eb65F4b6e1eE207c9Bd931Fe9FB53ED356B43b6';

const helperAbi = ['function getUserPoolVotes(address, address) view returns (uint256)'];
// const balanceAbi = ['function balanceOfNFT(uint256) view returns (uint256)'];



interface Params {
  votingEscrow: string;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Params,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const jellyBalance = await multicall(
    network,
    provider,
    helperAbi,
    addresses.map((address: any) => [
      stickyHelper,
      'getUserPoolVotes',
      [address, options.votingEscrow]
    ]),
    { blockTag }
  );

  // const jellyBalance = await multicall(
  //   network,
  //   provider,
  //   balanceAbi,
  //   addresses.map(() => [
  //     veJelly,
  //     'balanceOfNFT',
  //     [1]
  //   ]),
  //   { blockTag }
  // );

  
  const userWalletBalances = jellyBalance.map((amount, i) => {
    return [
      addresses[i].toLowerCase(),
      parseFloat(formatUnits(amount.toString(), 18))
    ];
  });

  const userTotal = {};

  userWalletBalances.forEach(([address, amount]) => {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  });

  const finalUserBalances = Object.fromEntries(
    addresses.map((addr) => [getAddress(addr), userTotal[addr.toLowerCase()]])
  );
  console.log(finalUserBalances);
  return finalUserBalances;


}
