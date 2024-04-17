# Nation3 voting power strategy

Calculates voting power based on a user's staked tokens and ownership of nation3 passport (_erc721 NFT_). It also takes into account whether the NFT owner delegated his voting power to another account (using the `setSigner` function)

## Requires 2 input parameters:

**erc20**

The address of veNation tokens contract

**erc721**

The address of nation3 passport tokens contract