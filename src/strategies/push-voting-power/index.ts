import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

export const author = 'mujtaba1747';
export const version = '0.1.0';

const tokenBNtoNumber = (tokenBn) => {
  return (tokenBn).div(BigNumber.from(10).pow(BigNumber.from(10))).toNumber() / 100000000
}

const sharedABI = [
  {
    inputs: [
      {
        internalType:"address",
        name:"user",
        type:"address"
      },
      {
        internalType:"address",
        name:"token",
        type:"address"
      }
    ],

    name : "balanceOf",
    outputs: [
      {
         internalType:"uint256",
         name:"",
         type:"uint256"
      }
    ],

    stateMutability: "view",  
    type: "function"
  },
  
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountIn",
        type: "uint256"
      },
      {
        internalType: "address[]",
        name: "path",
        type: "address[]"
      }
    ],
    name: "getAmountsOut",
    outputs: [
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },

];

const wethABI = [
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
];

const epnsTokenABI = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'getCurrentVotes',
    outputs: [
      {
        internalType: 'uint96',
        name: '',
        type: 'uint96'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },

  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
];

const epnsLpABI = [
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  }
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
){

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const responseEPNSToken = await multicall(
    network,
    provider,
    epnsTokenABI,
    [
      [
        options.pushTokenAddr,
        'balanceOf',
        [options.pushLPTokenAddr]
      ]
    ]
    .concat(
      addresses.map((address: any) => [
        options.pushTokenAddr,
        'getCurrentVotes',
        [address.toLowerCase()]
      ])
    ),
    { blockTag }
  );

  // Used .slice, as 2 different type of calls to the same contract were made in a 
  // single Multicall using .concat
  // This was done because the number of Multicalls allowed is limited to 5 by Snapshot

  const responseDelegatedPUSH = responseEPNSToken.slice(1);

  const pushAmountReserve = tokenBNtoNumber(responseEPNSToken.slice(0, 1)[0][0]);

  const responseStaked =  await multicall(
    network,
    provider,
    sharedABI,
    
    addresses.map((address: any) => [
      options.stakingAddr,
      'balanceOf',
      [address.toLowerCase(), options.pushTokenAddr]
    ])
    .concat(
      addresses.map((address: any) => [
        options.stakingAddr,
        'balanceOf',
        [address.toLowerCase(), options.pushLPTokenAddr]
      ])
    ),

    { blockTag }
  );
  
  const responseStakedPUSH = responseStaked.slice(0, addresses.length);

  const responseStakedLP = responseStaked.slice(addresses.length);

  const responseWETH = await multicall (
    network,
    provider,
    wethABI,
    [
      [
        options.WETHAddress,
        'balanceOf',
        [options.pushLPTokenAddr]
      ],
    ],
    { blockTag }
  );

  const wethAmountReserve = tokenBNtoNumber(responseWETH[0][0]);

  const responseLPConversion = await multicall(
    network,
    provider,
    sharedABI,
    [
      [
        options.uniswapV2Router02,
        'getAmountsOut',
        ["1000000000000000000", [ options.pushTokenAddr, options.WETHAddress, options.USDTAddress]],
      ],

      [
        options.uniswapV2Router02,
        'getAmountsOut',
        ["1000000000000000000", [options.WETHAddress, options.USDTAddress]],
      ],
    ],
    { blockTag }
  );

  // pushPrice and wethPrice are in terms of USDT
  const pushPrice = responseLPConversion[0]["amounts"][2].toNumber() / 1e6;

  const wethPrice = responseLPConversion[1]["amounts"][1].toNumber() / 1e6;

  const responseEPNSLPToken = await multicall(
    network,
    provider,
    epnsLpABI,
    [
      [
        options.pushLPTokenAddr,
        'totalSupply',
        []
      ]
    ],
    {blockTag}
  )

  // Calculating price of EPNS-LP Tokens in terms of EPNS Tokens
  const uniLpTotalSupply = tokenBNtoNumber(responseEPNSLPToken[0][0]);

  const uniLpPrice = ((pushAmountReserve * pushPrice) + (wethAmountReserve * wethPrice)) / uniLpTotalSupply;

  const lpToPushRatio = uniLpPrice / pushPrice;

  return Object.fromEntries(
    responseDelegatedPUSH.map((value, i) => [
      addresses[i],

      // Voting Power = Delegated PUSH + Staked PUSH + Staked UNI-LP PUSH
      parseFloat(formatUnits(value.toString(), options.decimals)) +

      parseFloat(formatUnits(responseStakedPUSH[i].toString(), options.decimals)) +

      parseFloat(formatUnits(responseStakedLP[i].toString(), options.decimals)) * lpToPushRatio

    ])
  );
}