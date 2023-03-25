# erc1155-weighted-by-id

This strategy takes in an array of ERC1155 token ids and the weight attached to each token ID. It returns the highest value a wallet holds, and does not calculate a sum.

## Params

| Param                                                                             | Description                                                 | Required |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| ids                                                                               | Array of ERC1155 Token IDs                                  | Yes      |
| weight                                                                            | Array of Weights that map to the TokenID of the same index. |
| The balance of an owners token is multiplied by the weight to calculate the score | Yes                                                         |
