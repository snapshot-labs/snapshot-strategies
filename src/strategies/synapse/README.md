# Synapse Strategy

This strategy calculates voting power by combining two components:
1. SYN token balance
2. Locked SYN tokens in the staking contract

## Overview

The strategy sums up:
- The regular SYN token balance (`balanceOf`)
- The locked amount in the staking contract (`lockedAmountOf`)

## Parameters

Here is an example of parameters:

```json
{
  "symbol": "SYN",
  "tokenAddress": "0x0f2D719407FdBeFF09D87557AbB7232601FD9F29",
  "stakingAddress": "0x00000010cd90b3688d249d84c616de3a0343e60f",
  "decimals": 18
}
```

### Parameter Details

- `symbol`: Token symbol (default: "SYN")
- `tokenAddress`: The SYN token contract address for the specific network
- `stakingAddress`: The staking contract address (default: 0x00000010cd90b3688d249d84c616de3a0343e60f)
- `decimals`: Token decimals (default: 18)

## Networks & Addresses

The strategy works across multiple networks. Here are the SYN token addresses for each supported chain:

- Ethereum: `0x0f2D719407FdBeFF09D87557AbB7232601FD9F29`
- Arbitrum: `0x080f6aed32fc474dd5717105dba5ea57268f46eb`
- Aurora: `0xd80d8688b02B3FD3afb81cDb124F188BB5aD0445`
- Avalanche: `0x1f1E7c893855525b303f99bDF5c3c05Be09ca251`
- Base: `0x432036208d2717394d2614d6697c46DF3Ed69540`
- Blast: `0x9592f08387134e218327E6E8423400eb845EdE0E`
- Boba: `0xb554A55358fF0382Fb21F0a478C3546d1106Be8c`
- BSC: `0xa4080f1778e69467e905b8d6f72f6e441f9e9484`
- Canto: `0x555982d2E211745b96736665e19D9308B615F78e`
- Cronos: `0xFD0F80899983b8D46152aa1717D76cba71a31616`
- DFK Chain: `0xB6b5C854a8f71939556d4f3a2e5829F7FcC1bf2A`
- Fantom: `0xE55e19Fb4F2D85af758950957714292DAC1e25B2`
- Harmony: `0xE55e19Fb4F2D85af758950957714292DAC1e25B2`
- Metis: `0x67c10c397dd0ba417329543c1a40eb48aaa7cd00`
- Moonbeam: `0xF44938b0125A6662f9536281aD2CD6c499F22004`
- Moonriver: `0xd80d8688b02B3FD3afb81cDb124F188BB5aD0445`
- Optimism: `0x5A5fFf6F753d7C11A56A52FE47a177a87e431655`
- Polygon: `0xf8f9efc0db77d8881500bb06ff5d6abc3070e695`

Note: Staking functionality is only available on Ethereum, Arbitrum, Avalanche, Optimism, BSC, Polygon, and Base networks.

## Example

If a user has:
- 100 SYN tokens in their wallet
- 50 SYN tokens locked in staking

Their total voting power would be 150 SYN tokens.
