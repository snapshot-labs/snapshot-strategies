# Offchain delegation

This strategy is used to handle offchain delegations for pre-distribution tokens.

## Getting started
- Check the template here: https://docs.google.com/spreadsheets/d/1IQDXROyxavyZ03ZtNW-2uuDjcI_oME-OmY1VFPTAO-M/edit?usp=sharing
- Select: File > Make a copy
- On the newly created file select: File > Share > Publish to web
- On the modal "Publish to web" click "Publish" button
- Copy the long id within the URL and use it as "sheetId" parameter for the strategy
- And use the id after "pub?gid=" as "gid" parameter
- You are ready!

## Parameters
- `sheetId`: The id of the published spreadsheet
- `gid`: The id of the sheet
- `decimals`: The number of decimals used by the native token

Here is an example of the strategy parameters:
```json
{
  "name": "offchain-delegation-2",
  "params": {
    "symbol": "TEST (delegated)",
    "sheetId": "2PACX-1vSiB0k576wpy0jEb5y2YFDTZEoCpfF-FM9O-PdUyFFTBUaqjyArc-nbc6h0Ob6ckQxv3W0lK6QK_x0G",
    "gid": "0",
    "decimals": 18
  }
}
```
