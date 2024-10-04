# garden-stakes

This strategy is used to get the votes of the users based on the amount of stakes they have in the garden staker contract.

Getting the votes from the contract is not straightforward. First, we need to fetch the nonce of the user in the contract, which represents the number of stakes the user has. Then, we calculate an ID called stakeId, which is the hash of the user address and the nonce. Finally, we can get the user's votes by calling the `stakes` function with the stakeId. Users can have multiple stakes, so we need to iterate over all the stakes to get the total votes of the user.

Here is an example of parameters:

```json
{
  "gardenStakerAddress": "0xe2239938Ce088148b3Ab398b2b77Eedfcd9d1AfC"
}
```
