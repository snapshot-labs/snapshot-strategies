# API POST strategy

## Description

This strategy can be used if you want to call a custom HTTP-Endpoint to request the voting power/score for the
participating addresses.

You can configure the endpoint via the options object when selecting the strategy in your settings.

The options object is passed to the API as well.<br/>
You may add an API-Key here for example

##Attention
Make sure your API is secured!<br/>
The request may contain values that can harm your system.<br/>
It's most unlikely to happen but it's good to keep this in mind!

### Example Request that is sent to your custom endpoint
```json
POST your-project.tld/path/to/your/endpoint
{
  "options": { your strategy options object},
  "network": "1",
  "addresses": [
    "0xEA2E9cEcDFF8bbfF107a349aDB9Ad0bd7b08a7B7",
    "0x3c4B8C52Ed4c29eE402D9c91FfAe1Db2BAdd228D",
    "0xd649bACfF66f1C85618c5376ee4F38e43eE53b63",
    "0x726022a9fe1322fA9590FB244b8164936bB00489",
    "0xc6665eb39d2106fb1DBE54bf19190F82FD535c19",
    "0x6ef2376fa6e12dabb3a3ed0fb44e4ff29847af68"
  ],
  "snapshot": 11437846
}
```

### Example Response
The response that is sent by your endpoint should look like this
```json
{
  "score": [
    {
      "score": 123,
      "address": "0xEA2E9cEcDFF8bbfF107a349aDB9Ad0bd7b08a7B7"
    },
    {
      "score": 456,
      "address": "0x3c4B8C52Ed4c29eE402D9c91FfAe1Db2BAdd228D"
    },
    {
      and so on
    }
  ]
}
```
