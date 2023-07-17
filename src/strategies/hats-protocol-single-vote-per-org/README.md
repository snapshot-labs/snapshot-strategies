# hsts-protocol-single-vote-per-org

So far I have found many avenues to get the desired result, but none of them are scalable.
Within this project you will find several such avenues. None are completed entirely as I stop work once it reaches an unscalable state.

index.ts provides some early iterations along with the current subgraph implementation.
index2.ts provides a simulated implementation calling directly tot he smart contract. It quickly becomes unscalable after 5+ hats are introduced.

## description
A strategy to get a single voting power based on passing in a set of addresses and checking if
they have any number of provided hats.

Here is an example of parameters:

```json
{
  "address": "0x9d2dfd6066d5935267291718e8aa16c8ab729e9d",
  "hats": [
    "5958148624822707922439278857855523455031332026375859258334522873217024",
    "5958148624828985024174665538619359244454539692791961613778986907729920",
    "5958148624835262125910052219383195033877747359208063969223450942242816",
    "5958148624841539227645438900147030823300955025624166324667914976755712"
  ]
}
```