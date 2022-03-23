# Staking RICE strategy

Allows to get Voting power based on voter's staking RICE amount in DKP pool.

## Strategy Parameters

| Param              | Type   | Description                                                                                                                |     |     |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------- | --- | --- |
| symbol             | string | The Ethereum address of the GovernanceStrategy contract to measure voting or proposition power from an address at a block. |     |     |
| address            | string | The RICE token address                                                                                                     |     |     |
| tokenId            | string | The RICE  tokenID                                                                                                          |     |     |
| decimals           | string | The RICE token decimal                                                                                                     |     
|     |
| NFTaddress         | string | The erc1155 NFT address use to restrict voter who holding it can vote                                                      |     
|     |
| ids                | string | The erc1155 NFT ids                                                                                                        |     
|     |