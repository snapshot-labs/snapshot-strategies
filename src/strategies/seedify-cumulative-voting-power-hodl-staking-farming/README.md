# seedify-cumulative-voting-power-hodl-staking-farming

Strategy which calculates SFUND Cumulative Voting Power (hodl, farming & staking):

- SFUND (raw balance)
- Farming
  - SFUND-BNB farming:
    - LP_CONTRACT_SFUND_BNB = 0x74fA517715C4ec65EF01d55ad5335f90dce7CC87
    - SFUND_FARM_CONTRACT_LEGACY = 0x1F10564BAD9367CfF4247A138eBbA9a9aaeb789E
    - SFUND_FARM_CONTRACT_NEW = 0x71d058369D39a8488D8e9F5FD5B050610ca788C0
  - SFUND-SNFTS farming (only calculates SFUND amount):
    - LP_CONTRACT_SNFTS_SFUND = 0xe4399d0c968fBc3f5449525146ea98B0dC7Fc203
    - SNFTS_FARM_CONTRACT = 0x19ee35c5B2CcaBaAE367B6f99b2f5747E6a6C0d0
- Staking:
  - SFUND_STAKE_CONTRACT_7_DAYS_LEGACY = 0xb667c499b88AC66899E54e27Ad830d423d9Fba69
  - SFUND_STAKE_CONTRACT_14_DAYS_LEGACY = 0x027fC3A49383D0E7Bd6b81ef6C7512aFD7d22a9e
  - SFUND_STAKE_CONTRACT_30_DAYS_LEGACY = 0x8900475BF7ed42eFcAcf9AE8CfC24Aa96098f776
  - SFUND_STAKE_CONTRACT_60_DAYS_LEGACY = 0x66b8c1f8DE0574e68366E8c4e47d0C8883A6Ad0b
  - SFUND_STAKE_CONTRACT_90_DAYS_LEGACY = 0x5745b7E077a76bE7Ba37208ff71d843347441576
  - SFUND_STAKE_CONTRACT_180_DAYS_LEGACY = 0xf420F0951F0F50f50C741f6269a4816985670054
  - SFUND_STAKE_CONTRACT_30_DAYS_NEW = 0x60b9F788F4436f0B5c33785b3499b2ee1D8dbFd4
  - SFUND_STAKE_CONTRACT_90_DAYS_NEW = 0x5b384955ac3460c996402Bf03736624A33e55273
  - SFUND_STAKE_CONTRACT_180_DAYS_NEW = 0xd01650999BB5740F9bb41168401e9664B28FF47f
  - SFUND_STAKE_CONTRACT_270_DAYS_NEW = 0x89aaaB217272C89dA91825D9Effbe65dEd384859

Here is an example of parameters that can be usde in `examples.json`:

```json
{
  "sfundAddress": "0x477bC8d23c634C154061869478bce96BE6045D12",
  "symbol": "SFUND",
  "decimals": 18
  // Calculate SFUND from staked LP tokens use:
  "lpAddress_SFUND_BNB": "0x74fA517715C4ec65EF01d55ad5335f90dce7CC87",
  "farmingAddress_SFUND_BNB": "0x71d058369D39a8488D8e9F5FD5B050610ca788C0",
  "legacyfarmingAddress_SFUND_BNB": "0x1f10564bad9367cff4247a138ebba9a9aaeb789e",
  "lpAddress_SNFTS_SFUND": "0xe4399d0c968fBc3f5449525146ea98B0dC7Fc203",
  "farmingAddress_SNFTS_SFUND": "0x19ee35c5B2CcaBaAE367B6f99b2f5747E6a6C0d0",
  // Calculate SFUND staked in ALL staking contracts use:
  "sfundStakingAddresses": [
    "0x60b9F788F4436f0B5c33785b3499b2ee1D8dbFd4",
    ...
  ],
  "legacySfundStakingAddresses": [
    "0xb667c499b88AC66899E54e27Ad830d423d9Fba69",
    ...
  ]
}
```

All fields above are required except `legacyfarmingAddress_SFUND_BNB`.

Run tests: `yarn test --strategy=seedify-cumulative-voting-power-hodl-staking-farming`

Tests fails with current data in `examples.json` as wallet addresses do not hold any funds in `legacyfarmingAddress_SFUND_BNB` anymore. To prevent tests from failing them comment calculation for `legacyfarmingAddress_SFUND_BNB`.

```
"addresses": [
  "0x756ea9Ae4866B962326d588CdF39d558e671dF61", // 30, 90 days sataking & SFUND-BNB farming
  "0x000F06844e849E39E9661cAd08Bf39e1E762f99D", // 270 days & SFUND-BNB + SNFTS-SFUND farming
  "0xf6320ae5459332C2dCDE9abB8F1708232D7Bed3E", // hodl
  "0x043a0199506E671Ed03e883e64288E5cf003EF93" // 7 staking legacy
]
```
