# degenzoo-erc721-animals-weighted

This strategy allows you to determine the voting power by reading the metadata attribute of holding NFT.
`tokenURI(tokenID)` returns the individual metadata URI in ERC721.

Each animal has it's own "Staked Tokens" attribute. 

The voting power is the sum of all Staked tokens of each Zoo owner. 
