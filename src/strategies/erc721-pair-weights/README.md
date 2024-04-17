# ERC721 Weighted Pairs

This strategy determines the voting powers for a pair of ERC721 NFT registries. This strategy supports 2 different NFT collections and it provides different voting powers to the holders of these collections, and also supports bonus powers for holders which have items from both the collections.

```json
{
    "symbol": "OCMONK",
    "registries": [
      "0x960b7a6bcd451c9968473f7bbfd9be826efd549a",
      "0x86cc280d0bac0bd4ea38ba7d31e895aa20cceb4b"
    ],
    "weights": [
      2,
      3
    ],
    "pairWeight": 4 
 }
```

In `example.json`, address `0xE052113bd7D7700d623414a0a4585BCaE754E9d5` has 31 items of `collection1` NFT and 35 items of `collection2` NFT. 

As we can see, there are 31 pairs, 0 items exclusively for collection1 and 4 items exclusively for collection2. So, the voting power of the address will be 

```
(31 * pairWeight) + (collection1 * weights[0]) + (collection2 * weights[1])`
= 31*4 + 0*2 + 4*3
= 136
```
which can be seen in the snapshot:

```
    [
      {
        '0x5F9345FdAd91Bf9757445ADc82e477B33FD3349c': 6,
        '0xE052113bd7D7700d623414a0a4585BCaE754E9d5': 136
      }
    ]
```