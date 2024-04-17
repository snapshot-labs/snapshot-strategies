# Synthetic Nouns

This strategy allows you to determine if an address is eligible to vote by checking if it holds the unique NFT claimed by it originally.

It uses the Zora API to find the minting event associated with the user address on the Synthetic Nouns contract and then checks if the NFT is still owned by the user.

Here is an example of parameters:

```json
{
  "address": "0x8761b55af5a703d5855f1865db8fe4dd18e94c53",
  "symbol": "sNOUN"
}
```
