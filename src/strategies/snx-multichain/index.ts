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
  '10': {
    accountProxy: '0x0E429603D3Cb1DFae4E6F52Add5fE82d96d77Dac',
    coreProxy: '0xffffffaEff0B96Ea8e4f94b2253f31abdD875847'
  },
  '8453': {
    accountProxy: '0x63f4Dd0434BEB5baeCD27F3778a909278d8cf5b8',
    coreProxy: '0x32C222A9A159782aFD7529c87FA34b96CA72C696'
  }
};

const COLLATERAL_TYPES = {
  '1': '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
  '10': '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4',
  '8453': '0x22e6966b799c4d5b13be962e1d117b56327fda66'
};

const accountProxyABI = [
  'function balanceOf(address account) view returns (uint256)',
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

  if (validStrategies.length > 4) {
    throw new Error('Exceeded the maximum limit of 4 valid strategies.');
  }

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

    try {
      // Check if the user has a v3 account
      const balance = await accountProxy.balanceOf(address);
      if (balance.eq(0)) {
        return { [address]: 0 };
      }

      // Use only the first account (index 0)
      const accountId = await accountProxy.tokenOfOwnerByIndex(address, 0);

      // Select the appropriate collateralType based on the network
      const collateralType = COLLATERAL_TYPES[network];

      // Fetch only the totalDeposited value for the account ID
      const { totalDeposited } = await coreProxy.getAccountCollateral(
        accountId,
        collateralType
      );

      totalCollateral = Number(totalDeposited) / 1e18;
    } catch (err) {
      console.error(
        `Error fetching v3 collateral for address ${address}:`,
        err
      );
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
