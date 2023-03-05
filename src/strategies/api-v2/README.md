# API V2 strategy

Voting strategy using a REST API endpoint. Number of votes depends on the return of the API endpoint.
(Unlike the `api` strategy, this strategy does not depend on voting power of other addresses)

> Note: Better to use this strategy only if you are not using any override strategies (example: delegation strategy).

## Parameters

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `url` | `string` | URL of the API endpoint | `undefined` |
| `type` | `string` | Type of the API endpoint ( `api-get` or `api-post` or `ipfs` or `json` ) | `api-get` |
| `additionalParams` | `string` | Additional parameters for the API endpoint (optional) | `` |

If you are passing a IPFS url use following format:

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

If you are passing a API url with POST method use following format:

```JSON
{
  "url": "https://...",
  "type": "api-post"
}
```
