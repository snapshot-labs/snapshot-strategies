# Giveth Balances Supply Weighted 

This strategy is used to get the balance of tokens a user holds + the amount they have staked in GIVpower. It gets the sum of those balances, divides it by the circulating supply of the GIV token from an API endpoint then applies a weight to it. 