# orange-reputation-nft-based-voting

This strategy distributes voting power based on user reputation scores represented by reputation NFTs they hold. You can ask users to claim an Orange issued NFT or [issue an NFT yourself](https://docs.orangeprotocol.io/developer-guides/issue-reputation-nfts).
Users must [claim reputation NFTs](https://docs.orangeprotocol.io/user-guides/claim-orange-nfts) on the [Orange platform](https://www.orangeprotocol.io/) to vote.

## Use this strategy

1. Issue an NFT or select one from [Orange issued NFTs](https://app.orangeprotocol.io/) (Crypto Whale, NFT Collector or Web3 Citizen).
2. In your Space settings, select "orange-reputation-nft-based-voting" as the voting strategy.
3.  Select a blockchain network according to the NFT you choose. Orange supported networks are listed on each NFT page, for example, [Crypto Whale](https://app.orangeprotocol.io/nft/1). Make sure your users can claim NFTs on the selected network.
4. Fill in `symbol` and `contract` fields as the example below to indicate the NFT you select.
5. Specify the NFT name and the network in the proposal description so your users can easily find out.

## Example of parameters

|   Param    | Description                                                                                               |
| :------: | :-------------------------------------------------------------------------------------------------------- |
|  symbol  | `calcUserAsset` for [Crypto Whale](https://app.orangeprotocol.io/nft/1); <br> or `calcNFTAsset` for [NFT Collector](https://app.orangeprotocol.io/nft/2); <br> or `calcActivity` for [Web3 Citizen](https://app.orangeprotocol.io/nft/3); <br>or the method name your set for your issued NFT. |
| contract | NFT contract address. <br>Contract address of Orange issued NFTs: <br>`0xdc63554f403E281f30B6103a6355F08a34d4DeB8`                  |

```
{
  "symbol": "calcUserAsset",
  "contract": "0xdc63554f403E281f30B6103a6355F08a34d4DeB8"
}
```

## Vote on a proposal

Users of your space should follow these steps to vote:

1. Read the proposal and confirm the NFT and network information.
2. Claim the required NFT on the Orange platform.
3. Vote on the proposal.
