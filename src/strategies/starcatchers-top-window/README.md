# Starcatchers Top Wallet Window Strategy

Fetches Starcatchers Intergalactic Alliance subgraph to calculate top delegated
wallets.  It then uses a block based window of time to determine the active
delegates in the selected cycle.

## Parameters

|    Parameter     |                        Desc                        |
| ---------------- | -------------------------------------------------- |
| origin           | At what block height does Intergalactic time begin |
| delegateLimit    | Max delegates allowed to vote                      |
| delegateDuration | How many blocks do delegates last                  |
