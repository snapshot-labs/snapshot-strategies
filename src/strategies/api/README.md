# API strategy

Voting strategy using a REST API endpoint. Number of votes depends on the return of the API endpoint.

## Cosntructing the API URL
This strategy will create an `api_url` based on the supplied parameters and the Proposal&Space settings. 

`api_url` is constructed as such:

### For IPFS endpoints
IPFS endpoint is defined as a url starting with any of the following:
  - https://gateway.pinata.cloud/ipfs/
  - https://ipfs.io/ipfs/
  - https://cloudflare-ipfs.com/ipfs/

1. `param.api`: The first part of the URL (e.g. https://gateway.pinata.cloud/ipfs/)

2. `param.strategy`: The IPFS hash

3. `param.additionalParameters` (optional): Any additional parameters you want to include

The final URL is expected to look something like: `https://gateway.pinata.cloud/ipfs/QmbmhTivxYuLE5uhNEALoBmvP7Yg9acA2Lkw9V9PqaEmw6`

## For static endpoints
If your endpoint is not IPFS, but API is returning static data:
You can use an API URL that ends with `.json` for example: `https://www.myapi.com/vote_count.json`
Or You can use the `staticFile` param so not all addresses are passed to the API. This is useful for APIs that have a limit on the number of addresses that can be passed in a single request.

1. `param.api`: The first part of the URL (e.g. https://www.myapi.com/)

2. `param.strategy`: The resource name (e.g. get_vote_count)

3. `param.staticFile`: Set to `true`

### For non-IPFS endpoints:

1. `param.api`: The first part of the URL (e.g. https://www.myapi.com/)

2. `param.strategy`: The resource name (e.g. get_vote_count)

3. `network`: Set by the Snapshot space settings (e.g. Ethereum = 1)

4. `snapshot`: Set by blockheight of the proposal (e.g. 11437846)

5. `addresses`: A comma separated list of addresses to be queried

The final URL is expected to look something like: `https://www.myapi.com/get_vote_count?network=1&snapshot=11437846&addresses=0xeD2bcC3104Da5F5f8fA988D6e9fAFd74Ae62f319,0x3c4B8C52Ed4c29eE402D9c91FfAe1Db2BAdd228D`

### List of params:
| Param | Description | Required | Default |
| --- | --- | --- | --- |
| `api` | The first part of the URL (e.g. https://www.myapi.com/) | Yes | |
| `strategy` (optional) | The resource name (e.g. get_vote_count) | Yes | '' |
| `staticFile` (optional) | Set to `true` if you want to use the `static` endpoint | No | `false` |
| `additionalParameters` (optional) | Any additional parameters you want to include | No | |
| `decimals` (optional) | The number of decimals to use when processing the scores from the API response | No | `0` |

## Expected return of API
The API should return an object with the following structure:
```
{
  "score": [
    {
      "address": "0xeD2bcC3104Da5F5f8fA988D6e9fAFd74Ae62f319",
      "score": "184000000000000000000"
    },
    {
      "address": "0x3c4B8C52Ed4c29eE402D9c91FfAe1Db2BAdd228D",
      "score": "7469258545106344000000000"
    },
    {
      "address": "0xd649bACfF66f1C85618c5376ee4F38e43eE53b63",
      "score": "2509787861801245"
    },
    {
      "address": "0x726022a9fe1322fA9590FB244b8164936bB00489",
      "score": "2179896139461561200000"
    },
    {
      "address": "0xc6665eb39d2106fb1DBE54bf19190F82FD535c19",
      "score": "0"
    },
    {
      "address": "0x6ef2376fa6e12dabb3a3ed0fb44e4ff29847af68",
      "score": "100420"
    }
  ]
}
```

Note that for the example above, `element.score` is a string representation in wei. Your response can return any value as long as:
  1. The return can be stringified `.toString()`
  2. The stringified version of your response can be passed into the second argument of `formatUnits`: https://docs.ethers.org/v3/api-utils.html?highlight=formatunits#ether-strings-and-wei

## Testing
You can test this strategy by updating the `examples.json` file and running `npm run test --strategy=api`

To test local changes, change to this directory and run: `npm run build & npm run test --strategy=api`
