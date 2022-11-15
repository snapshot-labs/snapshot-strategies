export const SWAPR_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-arbitrum-one-v2',
  '100': 'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-xdai-v2',
  '42161':
    'https://api.thegraph.com/subgraphs/name/dxgraphs/swapr-arbitrum-one-v2'
};

export const mergeBalanceMaps = (
  outputMap: { [address: string]: number },
  inputMap: { [address: string]: number }
) => {
  Object.entries(inputMap).forEach(([account, balance]) => {
    outputMap[account] = (outputMap[account] || 0) + balance;
  });
};
