# API strategy

Voting strategy using a REST API endpoint. Number of votes depends on the return of the API endpoint.

## How the URL is constructed
This strategy will create an `api_url` based on the supplied parameters and the Proposal&Space settings. 

`api_url` is constructed as such:

### For IPFS endpoints

IPFS endpoint is defined as a url starting with any of the following:
  - `https://gateway.pinata.cloud/ipfs/'
  - 'https://ipfs.io/ipfs/'
  - 'https://cloudflare-ipfs.com/ipfs/'

```javascript
1. `param.api`: The first part of the URL (e.g. `https://gateway.pinata.cloud/ipfs/`)

2. `param.strategy`: The IPFS hash

3. `param.additionalParameters`: Any additional parameters you want to include (i.e. `decimals`)

The final URL is expected to look something like: `https://gateway.pinata.cloud/ipfs/QmQnW3TtpN8WS2YMXtWB1p7DFcVjetfZmMfJvXm5yAZ6QN`
```

### For non-IPFS endpoints:
```javascript
1. `param.api`: The first part of the URL (e.g. `https://www.myapi.com/`)

2. `param.strategy`: The resource name (e.g. `get_vote_count`)

3. `network`: Set by the Snapshot space settings (i.e. Ethereum = 1)

4. `snapshot`: Set by blockheight of the proposal (i.e. 11437846)

5. `addresses`: A comma separated list of addresses to be queried

The final URL is expected to look something like: `https://www.myapi.com/get_vote_count?network=1&snapshot=11437846&addresses=0xeD2bcC3104Da5F5f8fA988D6e9fAFd74Ae62f319,0x3c4B8C52Ed4c29eE402D9c91FfAe1Db2BAdd228D`
```

## Expected return of API
The API should return an object with the following structure:
```javascript
{
  score: [
    {
      address: `0xeD2bcC3104Da5F5f8fA988D6e9fAFd74Ae62f319`,
      score: 1
    },
    {
      address: `0x3c4B8C52Ed4c29eE402D9c91FfAe1Db2BAdd228D`,
      score: 69
    },
        {
      address: `0xd649bACfF66f1C85618c5376ee4F38e43eE53b63`,
      score: 420
    },
    ...
  ]
}
```

## Testing
You can test this strategy by updating the `examples.json` file and running `npm run test --strategy:api`