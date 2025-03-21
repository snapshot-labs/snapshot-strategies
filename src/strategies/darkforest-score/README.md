# Dark Forest Score strategy

Gets player score from Dark Forest Contract. *Must be from a round with a `score` field on the `Player` struct*

Due to the exponential nature of Dark Forest scoring, this stategy takes the log2 of each player's score.

The only input parameter is `"graph_url"`, which requires the subgraph API URL for the round in question.

