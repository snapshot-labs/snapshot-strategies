# Reverse Voting Escrow Strategy

This strategy calculates voting power using the token contract address and a vesting contract.

It is custom-built for [SeedClub](https://seedclub.xyz/).

## Overview

There are 3 states votable tokens can be in:
- In a users wallet
- Unclaimed in the vesting contract but vested
- Unvested in the vesting contract

When a user connects to snapshot to vote on a Seed Club proposal their voting power should be calculated as follows.

**Voting power formula**
```md
Voting power = tokens in wallet + unclaimed tokens in vesting contract + vesting tokens * 0.1
```


## Contract Details

[$CLUB Contract](https://etherscan.io/address/0xf76d80200226ac250665139b9e435617e4ba55f9)
[Vesting Contract](https://etherscan.io/address/0xD46f00d9F1f6d2e65D9572F9ce283ba925FE591a)
[Vesting Backend](https://github.com/agoraxyz/club-backend#endpoints) (hosted at club.agora.space/api/ )

Vesting data is currently stored off-chain on a backend. All the data is encoded in a merkle tree and only the root is stored in the contract. When someone wants to claim, their data and proof are checked if they are a valid node of the tree.


## Contributing & Issues

Contribute to this strategy on [Nascent's](https://nascent.xyz) Snapshot Strategies Github fork: [nascentxyz/snapshot-strategies](https://github.com/nascentxyz/snapshot-strategies).

For technical assistance, reach out to [@andreasbigger](https://twitter.com/andreasbigger) on twitter or email `andreas@nascent.xyz`.

## Custom Testing

Install `ts-node` if it's not already installed on your machine:
```sh
npm install -g typescript
npm install -g ts-node
```

Then, run the test script from the root project directory:
```sh
ts-node src/strategies/reverse-voting-escrow/test.ts
```

