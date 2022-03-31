import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { Multicaller } from '../../utils';

export const author = 'Charles-repo';
export const version = '0.1.2';

const abi = [
  'function totalSupply() external view returns (uint256)',
  'function token0() external view returns (address)',
  'function getReserves() external view returns (uint112, uint112, uint32)',
  'function lockEntries(address account) external view returns (uint256, uint256, uint256)'
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
  const votingAddress = "0x48D1CcB09f771788F59c8aAAB613936eDfA267b7"; // voting contract

  const multi = new Multicaller(network, provider, abi, { blockTag });

  const result = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  let options_ve = {...options};
  options_ve.address = options.veaddress;
  const veresult = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options_ve,
    snapshot
  );

  addresses.forEach((address: any) =>
    multi.call(address, votingAddress, 'lockEntries', [address])
  );
  const lockresult: Record<string, BigNumberish> = await multi.execute();

  let options_voting = {...options};
  options_voting.address = votingAddress;
  const lockedamountresult = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options_voting,
    snapshot
  );

  let options_lp = {...options};
  options_lp.address = options.lpaddress;
  const resultLP1 = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options_lp,
    snapshot
  );

  let options_lp2 = {...options};
  options_lp2.address = options.harvaddress;
  const resultLP2 = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options_lp2,
    snapshot
  );

  multi.call('token0', options.lpaddress, 'token0', []);
  multi.call('getReserves', options.lpaddress, 'getReserves', []);
  multi.call('totalSupply', options.lpaddress, 'totalSupply', []);
  const { token0, getReserves, totalSupply } = await multi.execute();
  let totalGnomeAmount: BigNumberish;
  if (token0.toLowerCase() === options.address.toLowerCase()) {
    totalGnomeAmount = getReserves[0];
  } else {
    totalGnomeAmount = getReserves[1];
  }

  return Object.fromEntries(
    Object.entries(resultLP1).map(([address, balance]) => {
      let bal: BigNumber = BigNumber.from(parseUnits(balance.toFixed(options.decimals), options.decimals))
        .add(parseUnits(resultLP2[address].toFixed(options.decimals), options.decimals))
        .mul(totalGnomeAmount)
        .div(totalSupply);
      bal = bal.add(parseUnits(result[address].toFixed(options.decimals), options.decimals));
      if (BigNumber.from(lockresult[address][1]).gte(365))
        bal = bal.add(BigNumber.from(parseUnits(veresult[address].toFixed(options.decimals), options.decimals)).mul(5));
      if (BigNumber.from(lockresult[address][1]).gte(1)) {
        bal = bal.add(BigNumber.from(parseUnits(lockedamountresult[address].toFixed(options.decimals), options.decimals)).mul(110).div(100));
      }
      return [address, parseFloat(formatUnits(bal, options.decimals))];
    })
  );
}
