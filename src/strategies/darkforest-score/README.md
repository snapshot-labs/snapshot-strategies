# Dark Forest Score strategy

Gets player score from Dark Forest Contract. *Must be from a round with a `score` field on the `Player` struct*

Due to the exponential nature of Dark Forest scoring, this stategy takes the log2 of each player's score.

The only parameter you need to set is the Dark Forest Contract Address.

For v6.4: `"address": "0x27a166aE00C33Bef64306760aCd7C9fD3c2fEB74"`

