# API V2 strategy

Voting strategy using a REST API endpoint. Number of votes depends on the return of the API endpoint.
(Unlike the `api` strategy, this strategy does not depend on voting power of other addresses)

> Note: Use this strategy only if you are not using any override strategies (For example using `delegation` strategy).

## Parameters

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `url` | `string` | URL of the API endpoint | `undefined` |
| `type` | `string` | Type of the API endpoint ( `api-get` or `api-post` or `ipfs` or `json` ) | `api-get` |
| `additionalParams` | `string` | Additional parameters for the API endpoint (optional) | `` |

If you are passing an IPFS url use following format:

```JSON
{
  "url": "ipfs://...",
  "type": "ipfs"
}
```

If you are passing a JSON url use following format:

```JSON
{
  "url": "https://...",
  "type": "json"
}
```

If you are passing a API url use following format: (all voter addresses will be passed in the query string)

```JSON
{
  "url": "https://...",
  "type": "api-get"
}
```

If you are passing an API url with POST method use following format:

```JSON
{
  "url": "https://...",
  "type": "api-post"
}
```

### Example response from API

```JSON
{
  "score": [
    {
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "score": "100"
    },
    {
      "address": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      "score": "200"
    }
  ]
}
```
