import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'ShantyCottageCheese';
export const version = '0.1.0';

const abi = [
  'function getVotingPower(address _user, address _targetToken) view returns (uint256)'
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
  const result: Record<string, number> = {};

  const votingPowerContract = options.votingPowerContract;
  const shroomyToken = options.shroomyToken;
  const lpTokens = options.lpTokens || [];

  const multicaller = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address) =>
    multicaller.call(
      `${address}-${shroomyToken}`,
      votingPowerContract,
      'getVotingPower',
      [address, shroomyToken]
    )
  );

  for (const lpToken of lpTokens) {
    addresses.forEach((address) =>
      multicaller.call(
        `${address}-${lpToken.address}`,
        votingPowerContract,
        'getVotingPower',
        [address, lpToken.address]
      )
    );
  }

  const powers = await multicaller.execute();

  addresses.forEach((address) => {
    result[address] = parseFloat(
      formatUnits(
        powers[`${address}-${shroomyToken}`] || 0,
        options.shroomyDecimals
      )
    );

    for (const lpToken of lpTokens) {
      const lpValue =
        parseFloat(
          formatUnits(
            powers[`${address}-${lpToken.address}`] || 0,
            lpToken.decimals
          )
        ) * (lpToken.multiplier || 1);

      result[address] += lpValue;
    }
  });

  return result;
}
