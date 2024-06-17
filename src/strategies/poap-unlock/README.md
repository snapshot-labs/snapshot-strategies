# POAP-unlock (erc721)

Each POAP is implemented as an erc721 with a max supply tokens.

Returns 1 if account owns any tokens. If `eventsIds` is passed, than it returns 1 if account owns tokens where the event id is included in `eventIds`.

Here are some examples of parameters:

```json
{
  "symbol": "POAP",
  "eventIds": ["1213", "1293"]
}
```
