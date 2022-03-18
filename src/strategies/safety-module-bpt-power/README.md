# staked-psp-balance

This strategy computes the voting power of a staker relative to one token involved in a Aave like safety module that accepts arbitrary balancer LP token as staked token.
It uses balancer-pool-id strategy.

To simplify async flow, it requires to pass couple of parameters: 
- balancer pool id
- safety module (address, decimals)
- voting token (address, decimals)


This strategy works under 2 different regimes:

1/ if voting_token matches reward_token of safety module 
-> count for staked tokens and unclaimed rewards

2/ else 
-> count for staked tokens only