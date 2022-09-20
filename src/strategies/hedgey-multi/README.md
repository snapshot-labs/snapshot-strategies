# Hedgey strategy

Calculates voting rights based on the underlying tokens locked in the Hedgey protocol from multiple contracts with a multiplyer

## Examples

### Input parameters

An array of ContractDetails

  - address: The address of the contract
  - token: The address of the token that is taken into account for the score
  - decimal: The decimal value the token uses
  - contractType: Can be NFT for the standard NFT contract or TokenInfusedNFT for the token infused NFT contract
  - multiplyer: a function to manipulate the scores based on the values in the deal
