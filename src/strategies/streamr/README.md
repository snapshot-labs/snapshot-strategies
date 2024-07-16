# Streamr snapshot strategy

The Streamr Network is a peer-to-peer network for publishing and subscribing to data in real-time. Applications use it for decentralized messaging, for example sharing data across applications or broadcasting real-time state changes to large audiences. The decentralized nature of the system makes the data transport scalable, robust, secure, tamper proof, and censorship resistant.

Operators are the node running "miners" in the Streamr Network. They run Streamr nodes, subscribe to streams, and stake DATA in the Sponsorship contract(s) of those streams. When they subscribe, they help making that stream more robust. In return, they receive DATA tokens from the Sponsorship contract, in proportion to their stake.

This is why part of the Operators' DATA tokens are staked in Sponsorships (through an Operator contract that they control). Only a small portion of DATA is expected to be in the Streamr Network participants' wallets, the rest is staked or delegated into the Streamr Network.

'''The point of the Streamr snapshot strategy''' is to allocate voting power not only according to DATA token holding (as in the plain erc-20-balance-of strategy), but also counting in the DATA tokens the token holders control via staking and delegation (NOTE: at first, only implemented for stakers. Counting delegated DATA may be added later).

## Parameters

```json
{
  "tokenAddress": "0x3a9A81d576d83FF21f26f325066054540720fC34",
  "operatorFactoryAddress": "0x935734e66729b69260543Cf6e5EfeB42AC962183"
}
```
