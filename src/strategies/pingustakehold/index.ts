import { BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = '0xBluePingu';
export const version = '0.1.0';

const stakingAbi = [
	'function getBalance(address account) external view returns (uint256)'
];
export async function strategy(
	space,
	network,
	provider,
	addresses,
	options,
	snapshot
) {
	const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

	const multi = new Multicaller(network, provider, stakingAbi, { blockTag });
	addresses.forEach((address) =>
		multi.call(address, options.staking, 'getBalance', [address])
	);
	const result: Record<string, BigNumberish> = await multi.execute();

	return Object.fromEntries(
		Object.entries(result).map(([address, balance]) => [
			address,
			parseInt(balance.toString()) / 1e18
		])
	);
}