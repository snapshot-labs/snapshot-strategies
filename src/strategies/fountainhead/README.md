# Fountainhead

Calulates the amount of tokens which are locked, staked, unlocked or in transition (stream-unlock).

A _Locker_ is a contract holding tokens on behalf of users. Each account can have zero or one Locker.
A _Fontaine_ is a contract stream-unlocking tokens. Each Locker can have zero or more Fontaines.

In order to calculate the amount of tokens belonging to an address, the strategy first checks if the account has a locker, using `ILockerFactory.getLockerAddress()`.
Then the Locker balance is calculated using `ILocker.getStakedBalance()` and `ILocker.getAvailableBalance()`.
Then the addresses of all Fontaines created by the Locker are fetched, and their token balances queried.

Note: the Locker contract puts no limit on the number of Fontaines which can be created for a Locker (other than the data type of its counter).
In practive, we don't expect Lockers to have any Fontaines. But since it's theoretically possible, the strategy limits the number of Fontaines per Locker it will query. This limit is defined in `MAX_FONTAINES_PER_LOCKER`. By iterating from most to least recently created Fontaine, the probability of omitting Fontaines which are still active is minimized.

## Dev

Run test with
```
yarn test --strategy=fountainhead
```

**cli helper commands during development using foundry's cast**

get the owner of a locker:
```
cast call --rpc-url $RPC <LOCKER_ADDRESS> "lockerOwner()"
```

get the locker address for an account (zero if not exists):
```
cast call --rpc-url $RPC $LOCKER_FACTORY "getLockerAddress(address)" <ACCOUNT_ADDRESS>
```

create locker:
```
cast send --account <ACCOUNT_NAME>--rpc-url $RPC $LOCKER_FACTORY "createLockerContract()"
```

unlock with 7 days unlock period (creates a Fontaine):
```
cast send --account <ACCOUNT_NAME> --rpc-url $RPC <LOCKER_ADDRESS> "unlock(uint128,address)" 604800 <RECEIVER_ADDRESS>
```
