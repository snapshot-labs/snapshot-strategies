# ticket

Ticket strategy gives one voting power per one address, you can also pass a `value` parameter to give more voting power to the voter.

For better sybil resistance, use this strategy with a voting validation.

## Params

| param | type | description | default |
| --- | --- | --- | --- |
| `value` | `number` | The number of votes to give to the voter | 1 |
| `symbol` | `string` | The symbol of the token | optional |
