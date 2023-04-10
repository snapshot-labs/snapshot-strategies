# hashflow-governance-power

This strategy is used for the Hashflow DAO to consider both held HFT and LP'd HFT equally.

It was implemented as a result of community proposal [#272](https://gov.hashflow.com/t/allow-hashgang-to-use-their-hft-lp-tokens-to-vote/272/20), which was passed via a [snapshot vote](https://snapshot.org/#/hashflowdao.eth/proposal/0x0fe602a533b10fab93a66b155770ba948ff23209412487ec1ba3c5a4d75357ef).

It allows users who are LP'ing HFT in public HFT pools to use those for voting. This eliminates the need to withdraw from pools to participate in voting.

The exact implementation uses the fact that the `payout` field of a pool's `function assetDetails()` call shares how many HFT are claimable in the pool. This can then be combined with the totalSupply of each pool's LP token to determine the HFT value of funds deposited by any given address.

Here is an example of parameters:

```json
{
  "hftContract": "0xb3999f658c0391d94a37f7ff328f3fec942bcadc",
  "hftPool": "0x5afe266ab4e43c32bad5459fe8df116dd5541222",
  "hToken": "0x8a96b94bee6636042f2019c60c43b4f1c8c177a9"
}
```
