# Fountainhead

Calulates the amount of tokens which are locked, staked, unlocked or in transition (stream-unlock).

The _Locker__ is a contract holding tokens on behalf of users. Each account can have zero or one Locker.

In order to calculate the amount of staked tokens, the strategy first checks if the account has a locker, using `ILockerFactory.getLockerAddress()`.
Then the amount is calculated using `ILocker.getStakedBalance()` and `ILocker.getAvailableBalance()`.
Then the addresses of all fontaines created by the Locker are fetched, and their token balances.

Note: the Locker contract puts no limit on the number of fontaines (other than the data type of its counter).
In practice we don't expect a high number of fontaines per locker. But in order to avoid a DoS vector, the strategy anyway limits the number of fontaines iterated. It does so by going from most recently created backwards in order to minimize the probability of missing active lockers.

Here is an example of parameters for Base Sepolia:

```json
{
  "tokenAddress": "0x3A193aC8FcaCCDa817c174D04081C105154a8441",
  "lockerFactoryAddress": "0xeFE0b1044c26b8050F94A73B7213394D2E0aa504"
}
```

## Dev

Run test with
```
yarn test --strategy=fountainhead
```

0x7269B0c7C831598465a9EB17F6c5a03331353dAF has locker 0x37db1380669155d6080c04a5e6db029e306cd964
0x6e7A82059a9D58B4D603706D478d04D1f961107a has locker 0x56ba69c4fb8d62ed5a067d79cee01fec0a023c0a
0x264Ff25e609363cf738e238CBc7B680300509BED has locker 0x664409c2bb818f7ccfb015891f789b4b52e94129

cli helper commands during development using foundry's cast:

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

unlock with 7 days unlock period:
```
cast send --account testnet --rpc-url $RPC <LOCKER_ADDRESS> "unlock(uint128,address)" 604800 <RECEIVER_ADDRESS>
```
