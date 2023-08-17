# ens-all-club-digits

This strategy is for All Club Digits members, holders of ENS names 000.eth - 999.eth, 0000.eth - 9999.eth, 00000.eth to 99999.eth and beyond
This script queries The Graph for all ENS names owned by voter and checks for 10K Club names.
Pass the number of digits as the requirement


Here is an example of parameters, we want 999 so we put numberOfDigits set to 3:

```json
{
  "address": "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
  "symbol": "DIGITS",
  "numberOfDigits": 3
}
```
