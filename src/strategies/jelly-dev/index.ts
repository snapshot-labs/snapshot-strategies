import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'profwobble';
export const version = '0.1.0';

const Jelly = '0xf5f06fFa53Ad7F5914F493F16E57B56C8dd2eA80';
const abi = ['function balanceOf(address) view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const merkleURI =  'https://jelly-merkle-proofs.s3.amazonaws.com/proof-f5c0285a019ef4bc9f2170e29280f996e58d5335cb3f45e00136d756df3d4784.json';
  const remappedMerkleDataRes = await fetch(
    merkleURI ,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );
  const remappedMerkleRaw = await remappedMerkleDataRes.json();
  const remappedMerkleData = await remappedMerkleRaw.claims;

  const retroAddrs = Object.keys(remappedMerkleData);

  const retroUserBalances = {};
  retroAddrs.forEach((addr, i) => {
    retroUserBalances[addr.toLowerCase()] = parseFloat(
      formatUnits(remappedMerkleData[addr].amount, 18)
    );

  });

  const jellyBalance = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      Jelly,
      'balanceOf',
      [address]
    ]),
    { blockTag }
  );

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

  for (const [address, amount] of Object.entries(retroUserBalances)) {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  }

  const finalUserBalances = Object.fromEntries(
    addresses.map((addr) => [addr, userTotal[addr.toLowerCase()]])
  );

  return finalUserBalances;


}
