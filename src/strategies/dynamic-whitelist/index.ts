import fetch from 'cross-fetch';

export const author = 'russellinho';
export const version = '0.0.1';

/**
 * Gets all recipients of an NFT/token given from a smart contract
 */
const fetchVotingPower = async (
  contractAddress: string,
  etherscanApiKey: string
): Promise<any> => {
  const endpoint = 'https://api-rinkeby.etherscan.io/api?module=account&action=tokennfttx&contractaddress=' + contractAddress + '&apikey=' + etherscanApiKey;
  const response = await fetch(endpoint, {
    method: 'GET'
  });
  const payload = await response.json();
  return Object.fromEntries(
    payload.result.map((value) => [
      value.to.toLowerCase(),
      1
    ])
  );
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  try {
    const promise = fetchVotingPower(options['contractAddress'], options['etherscanApiKey']) as ReturnType<typeof fetchVotingPower>;
    const votingPowerResults = await Promise.resolve(promise);
    return votingPowerResults;
  } catch {
    return [];
  }
}
