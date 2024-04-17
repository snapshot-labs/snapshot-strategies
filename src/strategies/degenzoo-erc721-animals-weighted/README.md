# degenzoo-erc721-animals-weighted

This strategy allows you to determine the voting power by reading the metadata attribute of holding NFT.
`tokenURI(tokenID)` returns the individual metadata URI in ERC721.

Each animal has it's own "Staked Tokens" attribute. 

The voting power is the sum of all Staked tokens of each Zoo owner. 


Example: 

```tokenURI(36)
[
  {
      "0x91646c2c2fF05C4e9822740b0aD9d8B3DA51382b-36": "data:application/json;base64,eyJuYW1lIjogIkRlZ2VuWm9vICM2NDAxIiwgImRlc2NyaXB0aW9uIjogIkRlZ2Vuem9vICM2NDAxIGlzIHN0aWxsIGFuIGVnZy4uLiB3aHkgbm90IGhhdGNoIGl0PyIsICJpbWFnZSI6ICJpcGZzOi8vYmFmeWJlaWNqaXltb3VneHVqczJmenN4anVrbTdlNjU0eXRlcjRhb2hkcDc0ZWJvbXhjZDN5dnJzcWEvZWdnLnBuZyIsImF0dHJpYnV0ZXMiOiBbeyJ0cmFpdF90eXBlIjogIkxldmVsIiwgInZhbHVlIjogIjAifSwgeyJ0cmFpdF90eXBlIjogIlJhcml0eSIsICJ2YWx1ZSI6ICIwIn1dfQ==",
  }
]
```

This data are encoded onchain and decoding them is providing the metadata attribute of each animal. The 'Staked Tokens' value is used to calculate the weight of each user

``` example metadata of an animal 
[
      { trait_type: 'Rank', value: '42' },
      { trait_type: 'Rarity', value: 'Endangered' },
      { trait_type: 'Shininess', value: 'false' },
      { trait_type: 'Variant', value: '2' },
      { trait_type: 'Multiplier', value: '12012' },
      { trait_type: 'Staked Tokens', value: '12012' },
      { trait_type: 'Level', value: '1' },
      { trait_type: 'Evolve Time', value: '1987200' },
      { trait_type: 'Hatch Timestamp', value: '1680706434' }
    ]

```