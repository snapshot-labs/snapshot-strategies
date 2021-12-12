# Dark Forest v6.4 Score strategy

Gets player score from Dark Forest Contract. *Must be from a round with a `score` field on the `Player` struct*

Due to the exponential nature of Dark Forest scoring, this stategy takes the log2 of each player's score.


