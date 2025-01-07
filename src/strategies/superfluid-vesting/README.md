# Superfluid Vesting

Superfluid Vesting is done in the typical Superfluid way, not requiring prior capital lockup.
The Vesting Scheduler contract allows for the creation of Vesting Schedules which are then automatically executed.

Vesting Schedules are created by the _vesting sender_.
This sender, by creating a schedule, expresses the intent to provide the promised funds, as specified in the schedule.
In order for this intent to become executable, the sender also needs to
- grant the necessary ACL permissions to the VestingScheduler contract
- have enough funds available when needed

Note: In order to create a vesting schedule with hard guarantees of successful execution, a vesting sender needs to be a contract which is pre-funded and has no means to withdraw funds.

## Voting

In order to map vesting schedules to voting power, we need to monitor vesting schedules.
We need to restrict the schedules taken into consideration to those originating from a known and trusted vesting sender. Otherwise anybody could trivially cheat and gain more voting power by creating schedules for themselves.

With a trusted vesting sender defined, we can enumerate the vesting schedules created by it (where it is the _sender_) via subgraph query.
The total vesting amount of a vesting schedule is to be calculated as `cliffAmount + (endDate - startDate) * flowRate)`.
We need to subtract from this amount the already vested amount in order to not double-count it. This is assuming that another strategy accounts for the voting power of the already vested portion.

## Dev

Run test with
```
yarn test --strategy=superfluid-vesting
```
