# dps-nft-strategy-nova

This is a strategy similar with ERC721, which it calculates the voting power as the balances of the voters for a specific ERC721 token, but this takes into account locked NFTs
and claimed NFTs. It is a strategy using for a game, where users can lock their NFTs in order to achive different things.

Here is an example for calculating voting power:

Bob balance: 40 NFTs

Bob locked NFTs: 7     

Bob claimed NFTs: 3

=> Bob voting power: 40 + 7 - 3 = 44

