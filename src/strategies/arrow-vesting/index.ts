import { Contract } from '@ethersproject/contracts';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'BrassLion';
export const version = '0.1.1';

const vestingFactoryAbi = [
  'function escrows_length() public view returns (uint256)',
  'function escrows(uint256 index) public view returns (address)'
];

const vestingContractAbi = [
  'function recipient() public view returns (address)',
  'function total_locked() public view returns (uint256)',
  'function start_time() public view returns (uint256)',
  'function unclaimed() public view returns (uint256)'
  // don't need to check initialized?
  // don't need to check admin?
  // don't need to check future_admin?
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

  // Get all vesting contract addresses.
  const vestingFactory = new Contract(
    options.vestingFactory,
    vestingFactoryAbi,
    provider
  );

  const vestingContractCount = await vestingFactory.escrows_length({
    blockTag: blockTag
  });

  const vestingFactoryMulti = new Multicaller(
    network,
    provider,
    vestingFactoryAbi,
    { blockTag }
  );

  [...Array(vestingContractCount.toNumber()).keys()].forEach((contractIdx) => {
    vestingFactoryMulti.call(contractIdx, options.vestingFactory, 'escrows', [
      contractIdx
    ]);
  });

  const vestingContracts: Record<number, string> =
    await vestingFactoryMulti.execute();

  // Get all vesting contract parameters.
  const vestingContractMulti = new Multicaller(
    network,
    provider,
    vestingContractAbi,
    { blockTag }
  );

  Object.values(vestingContracts).forEach((vestingContractAddress) => {
    vestingContractMulti.call(
      `${vestingContractAddress}.recipient`,
      vestingContractAddress,
      'recipient',
      []
    );
    vestingContractMulti.call(
      `${vestingContractAddress}.total_locked`,
      vestingContractAddress,
      'total_locked',
      []
    );
    vestingContractMulti.call(
      `${vestingContractAddress}.start_time`,
      vestingContractAddress,
      'start_time',
      []
    );
    vestingContractMulti.call(
      `${vestingContractAddress}.unclaimed`,
      vestingContractAddress,
      'unclaimed',
      []
    );
  });

  const vestingContractParameters: Record<string, object> =
    await vestingContractMulti.execute();

  // Sum all vesting contract balances by recipient over requested addresses.
  const block = await provider.getBlock(blockTag);
  const time = block.timestamp;
  const addressBalances: Record<string, number> = {};

  addresses.forEach((address) => {
    addressBalances[address] = 0;
  });

  Object.entries(vestingContractParameters).forEach(([, params]) => {
    const recipient = params['recipient'];
    const start = params['start_time'];

    if (recipient in addressBalances && time > start) {
      const unclaimedTokens = parseFloat(
        formatUnits(params['unclaimed'], options.decimals)
      );

      // Vested arrow that can be claimed is all that is counted in this strategy
      addressBalances[recipient] += unclaimedTokens;
    }
  });

  return addressBalances;
}
