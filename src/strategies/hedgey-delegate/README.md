# Hedgey-delegate

This strategy counts voting power for Hedgeys where the token locked has delegated voting rights to another address.

Below is an example of the parameters:

```json
[
  {
    "name": "Hedgey Delegate",
    "strategy": {
      "name": "hedgey-delegate",
      "params": {
        "delegateContract": "0xd3dc59C9cf3E4896CA8094EDE203D9D30c4569AA",
        "token": "0x4d06C34f978F9158052705c46fC8d9E2FE5C30b8",
        "hedgeyNFT": "0x400a0F8f027938D766538B8fD0CC4AAc8604e501"
      }
    },
    "network": "5",
    "addresses": [
      "0xe31D847B47465cC2745319dAc9E0c6ac711cA10b",
      "0x040B6bD961eEd76667D7b4F2a6615657C6b9a303",
      "0x92d9802eFcD0485876DDC13c16cEA67e6aD5EB35"
    ],
    "snapshot": 8492389
  }
]
```