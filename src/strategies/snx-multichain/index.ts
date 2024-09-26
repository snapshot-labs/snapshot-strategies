import { getProvider, getSnapshots } from '../../utils';
import strategies from '..';
import { Contract } from '@ethersproject/contracts';

export const author = 'barrasso';
export const version = '1.0.0';

const CONTRACT_ADDRESSES = {
  '1': {
    accountProxy: '0x0E429603D3Cb1DFae4E6F52Add5fE82d96d77Dac',
    coreProxy: '0xffffffaEff0B96Ea8e4f94b2253f31abdD875847'
  },
  '8453': {
    accountProxy: '0x63f4Dd0434BEB5baeCD27F3778a909278d8cf5b8',
    coreProxy: '0x32C222A9A159782aFD7529c87FA34b96CA72C696'
  }
};

const accountProxyABI = [
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
];

const coreProxyABI = [
  'function getAccountCollateral(uint128 accountId, address collateralType) view returns (uint256 totalDeposited, uint256 totalAssigned, uint256 totalLocked)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const promises: any = [];
  const validStrategies = options.strategies.filter(
    (s) => s.network === '1' || s.network === '10' || s.network === '8453'
  );
  const blocks = await getSnapshots(
    network,
    snapshot,
    provider,
    validStrategies.map((s) => s.network || network)
  );

  for (const strategy of validStrategies) {
    if (
      options.startBlocks &&
      blocks[strategy.network] < options.startBlocks[strategy.network]
    ) {
      continue;
    }

    promises.push(
      strategies[strategy.name].strategy(
        space,
        strategy.network,
        getProvider(strategy.network),
        addresses,
        strategy.params,
        blocks[strategy.network]
      )
    );
  }

  // Fetch v3 collateral values
  const v3CollateralPromises = addresses.map(async (address) => {
    const networkAddresses = CONTRACT_ADDRESSES[network];
    if (!networkAddresses) return { [address]: 0 };

    const accountProxy = new Contract(
      networkAddresses.accountProxy,
      accountProxyABI,
      provider
    );
    const coreProxy = new Contract(
      networkAddresses.coreProxy,
      coreProxyABI,
      provider
    );

    let totalCollateral = 0;
    let index = 0;

    try {
      // Enumerate all account IDs owned by the address
      while (true) {
        const accountId = await accountProxy.tokenOfOwnerByIndex(
          address,
          index
        );
        index++;

        // Fetch collateral details for the account ID
        const { totalDeposited, totalAssigned, totalLocked } =
          await coreProxy.getAccountCollateral(
            accountId,
            options.collateralType
          );

        // Sum the collateral values
        totalCollateral += totalDeposited + totalAssigned + totalLocked;
      }
    } catch (err) {
      // Exit the loop when all tokens are enumerated
    }

    return { [address]: totalCollateral };
  });

  const v3Results = await Promise.all(v3CollateralPromises);
  const results = await Promise.all(promises);

  // Sum collateral values from v2 and v3 systems for each address
  const finalResults = results.reduce((acc, strategyResult) => {
    for (const [address, value] of Object.entries(strategyResult)) {
      if (!acc[address]) {
        acc[address] = 0;
      }
      acc[address] += value as number;
    }
    return acc;
  }, {});

  // Add v3 collateral values to the final results
  v3Results.forEach((v3Result) => {
    for (const [address, value] of Object.entries(v3Result)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }
      finalResults[address] += value as number;
    }
  });

  return finalResults;
}
