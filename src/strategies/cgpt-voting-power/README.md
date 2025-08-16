# cgpt-voting-power: Voting Power by Contract for ChainGPT DAO

This strategy determines the voting power of DAO users based on the `getVotingPower` function of a specified contract.

## Configuration

The strategy requires the following parameters:

- `address`: The contract address where the `getVotingPower` function is defined.
- `decimals`: The number of decimals used by the token.

An optional parameter is:

- `symbol`: The token symbol (for informational purposes or UI display).

Here is an example of parameters:

```json
{
  "address": "0xf97f22eddcaf2e891f0d528bda6113874f292b91",
  "symbol": "CGPT",
  "decimals": 18
}
