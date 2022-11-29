# Hedgey strategy

Calculates voting rights based on the underlying tokens locked in the Hedgey protocol from multiple contracts with a multiplyer

## Examples

### Input parameters

An array of ContractDetails

  - address: The address of the contract
  - token: The address of the token that is taken into account for the score
  - decimal: The decimal value the token uses
  - contractType: Can be NFT for the standard NFT contract or TokenInfusedNFT for the token infused NFT contract
  - lockedTokenMultiplier: a simple multiplyer for locked tokens
  - lockedTokenMonthlyMultiplier: a multiplier based on the amount of time the tokens will be unlocked for
