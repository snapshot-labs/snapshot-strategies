# POAP (erc721)

Each POAP is implemented as an erc721 with a max supply tokens.

If no `eventIds` are passed, then this strategy returns the number of tokens owned by each account. Otherwise, it returns the number of tokens per account where the event id is included in `eventIds`.

Here are some examples of parameters:

```json
{
  "symbol": "POAP",
  "eventIds": ["1213", "1293"]
}
```
