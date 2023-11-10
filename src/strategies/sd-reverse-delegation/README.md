# reverse delegation

The reserve delegation allow the delegation address to receive automatically all the voting power, even if an user didn't delegate to the delegation address.
Each user can still delegate to the delegation address, it will change nothing.
If an user delegate to another address then the delegation address, the delegation address will not receive his voting power.

Here is an example of parameters:

```json
[
  {
    "name": "Stake DAO reverse delegation",
    "strategy": {
      "name": "sd-reverse-delegation",
      "params": {
        "strategies": [
          {
            "name": "sd-vote-boost-twavp",
            "params": {
              "veToken": "0x0C462Dbb9EC8cD1630f1728B2CFD2769d09f0dd5",
              "liquidLocker": "0xD13F8C25CceD32cdfA79EB5eD654Ce3e484dCAF5",
              "sdTokenGauge": "0xE55843a90672f7d8218285e51EE8fF8E233F35d5",
              "symbol": "sdToken",
              "decimals": 18,
              "sampleSize": 30,
              "sampleStep": 5,
              "avgBlockTime": 12.0
            }
          }
        ],
        "delegationSpace": "sdangle.eth",
        "delegationAddress": "0x52ea58f4fc3ced48fa18e909226c1f8a0ef887dc",
        "sdTokenGauge": "0xE55843a90672f7d8218285e51EE8fF8E233F35d5"
      }
    },
    "network": "1",
    "addresses": [
      "0x12d3D411d010891a88BFf2401bD73FA41fb1316e",
      "0xDdB50FfDbA4D89354E1088e4EA402de895562173",
      "0x1A162A5FdaEbb0113f7B83Ed87A43BCF0B6a4D1E",
      "0x52ea58f4fc3ced48fa18e909226c1f8a0ef887dc",
      "0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063",
      "0xb0e83C2D71A991017e0116d58c5765Abc57384af"
    ],
    "snapshot": 18430677
  }
]

```