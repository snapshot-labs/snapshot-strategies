# Offchain delegation

This strategy is used to handle offchain delegations.

## Getting started
- Check the template here: https://docs.google.com/spreadsheets/d/1IQDXROyxavyZ03ZtNW-2uuDjcI_oME-OmY1VFPTAO-M/edit?usp=sharing
- Select: File > Make a copy
- On the newly created file select: File > Share > Publish to web
- On the modal "Publish to web" click "Publish" button
- Copy the long id within the URL and use it as "sheetId" parameter for the strategy
- And use the id after "pub?gid=" as "gid" parameter
- You are ready!

## Parameters
- `sheetId`: The id of the spreadsheet
- `gid`: The id of the sheet
- `strategies`: The strategies to use, to calculate the score of the delegations

Here is an example of the strategy parameters:
```json
{
  "sheetId": "2PACX-1vTAo2yFq6GyBZcB3BOnIw_Rzub7KEEzqhhgFY5CD6eCW-Rfx9d4NaMJP8IP67G9YnV3PNPHKvgJeSNY",
  "gid": "1557274211",
  "strategies": [
    {
      "name": "erc20-balance-of",
      "params": {
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "decimals": 18
      }
    }
  ]
}
```
