# hashflow-vehft-v1

This strategy is used to account for the veHFT power that the Hashflow
staking vaults yield to the user.

The voting power in the Hashflow DAO is a function of three parameters:

- the amount of HFT staked
- the lock duration (normalized to 4 years between 0 and 1)
- ownership of a Creation's Coffer NFT

The formula is as follows:

[HFT amount] x [normalized time lock] x [1.1 if an NFT is owned]

Here is an example of parameters:

```json
{
  "hftVault": "0x15725391A37A5fFeB04F79cf25DA8460A3f068F6",
  "nftContract": "0xb99E4E9b8Fd99c2C90aD5382dBC6ADfDfE3A33f3"
}
```
