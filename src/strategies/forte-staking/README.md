# forte-staking

## Description

This strategy works with staking contracts with the optionality of adding an external-contract call to be used as a multiplier factor. The voting power is calculated based on the amount of tokens staked, the amount of days staked, an internal multiplier factor, and an optional external multiplier factor. The staking contract must comply with a specific interface shown below as it takes into account different stakes deposited at different times by the same account.

```solidity
struct StakeBatch {
    uint256 amount; // total amount of tokens staked in the batch
    uint256 timestamp; // timestamp when the batch was created
}

interface IStakedBatches {
  /**
     * @dev get the current stake batches of the user
     * @param _user the address of the user to check
     * @return the list of all the staked batches of the user
     */
    function getStakedBatches(address _user) external view returns (StakeBatch[] memory);
}
```

The external-multiplier function can have any name as long as it takes only an address as argument, and the return value is an unsigned integer of any size.

```solidity
function <YOUR_EXTERNAL_CALL>(address _user) external view returns (uint8)
```

Notice that the return type can be of any size. For example, a `uint256` would be also valid.

## Calculation

The equation of the voting power is:

$votingPower(snapshot) = \sum_{i=1}^n amountStaked(i) * (1 + (daysStaked(i) + daysOffset) * \frac{multiplierNumerator}{ multiplierDenominator}) * [externalMultiplier]$

This is only true for each stake batch that has been deposited for more than 1 day. Otherwise, the voting power of the batch is equal to zero.

where _n_ is the number of batches of staked tokens by the user, and _daystStaked_ is a rounded down integer that represents the number of days since the batch was created.

Notice that the external multiplier is a function of a range due to the ceiling parameter:

$externalMultiplier =
  \begin{cases}
    externalMultiplier > externalMultiplierCeiling  & \quad externalMultiplierCeiling\\
    externalMultiplier ≤ externalMultiplierCeiling  & \quad externalMultiplier
  \end{cases}$

## Examples

### Using KYC as an external multiplier

In this example, the external multiplier is the KYC level of the user stored in an external contract. The KYC level itself can be any positive number. However, any value greater than 2 will be treated as 2 due to the ceiling parameter:

```json
{
  "stakingAddress": "0x249E662fe228Eff1e7dCE7cF3E78dFD481C7Ba3E",
  "externalMultiplierAddress": "0x86f53212865b6fddb99633dc002a7f7aacaaa8db",
  "externalMultiplierABI": "function getAccessLevel(address _account) external view returns (uint8)",
  "externalMultiplierFunction": "getAccessLevel",
  "multiplierNumerator": 4,
  "multiplierDenominator": 1461,
  "daysOffset": -1,
  "externalMultiplierCeiling": 2
}
```

### No external multiplier

This is the same example as the one above but without the external multiplier which makes it simpler. Just remove the external multiplier parameters:

```json
{
  "stakingAddress": "0x249E662fe228Eff1e7dCE7cF3E78dFD481C7Ba3E",
  "multiplierNumerator": 4,
  "multiplierDenominator": 1461,
  "daysOffset": -1
}
```
