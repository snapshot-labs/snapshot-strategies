# Pocket Network Strategy v1

This strategy manages to fetch the latest PDAs' snapshot from Arweave and proceeds to calculate the voting power of each wallet using the following formula:
- If wallet is not a POKT Citizen their vote will be zero
- The ratio between impact house and stake house is 80:20
- Each builder from the impact house has one vote providing their point is more than 0
- Stakers are as follows:
-   Validators and liquidity providers collectively hold 50% of the stake house which will be calculated by summing all of their points and then SQRT of that total
-   Gateways hold 50% of the staker house which will be caclulated using SQRT of their points

# Example 
Here is an example of parameters:

```json
{
  "arweave_network": "DEVNET",
  "owner_address": "0x7adc6c9d79c8afd8700da4c3ca87d8aa68d31b9d",
  "decimals": 8
}
```
