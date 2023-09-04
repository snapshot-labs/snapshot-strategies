# Contract call strategy

Allows any contract method to be used to calculate voter scores.

## Params

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| address | `string` | `undefined` | The address of the contract |
| symbol (optional) | `string` | `undefined` | The symbol of the token |
| decimals | `number` | `undefined` | The decimals of the output |
| methodABI | `object` | `undefined` | The ABI of the method to call |
| output (optional) | `string` | `undefined` | If the method return an array or object, the key to use as output |

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
{
  "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
  "symbol": "Cake",
  "decimals": 18,
  "methodABI": {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
}
```
