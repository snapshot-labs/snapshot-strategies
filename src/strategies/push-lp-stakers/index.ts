import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'mujtaba1747';
export const version = '0.1.0';

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
        options.epnsTokenAddr,
        'balanceOf',
        [options.epnsLPTokenAddr]
      ]
    ]
    .concat(
      addresses.map((address: any) => [
        options.epnsTokenAddr,
        'getCurrentVotes',
        [address.toLowerCase()]
      ])
    ),
    { blockTag }
  );

  // Used .slice, as 2 different type of calls to the same contract were made in a 
  // single Multicall using .concat
  // This was done because the number of Multicalls allowed is limited to 5 by Snapshot

  const responseDelegatedVotes = responseEPNSToken.slice(1);

  const pushAmountReserve = parseFloat(responseEPNSToken.slice(0, 1)[0][0].toString()) / 1e18;
  
  const responseStaked =  await multicall(
    network,
    provider,
    sharedABI,
    
    addresses.map((address: any) => [
      options.stakingAddr,
      'balanceOf',
      [address.toLowerCase(), options.epnsTokenAddr]
    ])
    .concat(
      addresses.map((address: any) => [
        options.stakingAddr,
        'balanceOf',
        [address.toLowerCase(), options.epnsLPTokenAddr]
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
        [options.epnsLPTokenAddr]
      ],
    ],
    { blockTag }
  );

  const wethAmountReserve = parseFloat(responseWETH[0][0].toString()) / 1e18;

  const responseLPConversion = await multicall(
    network,
    provider,
    sharedABI,
    [
      [
        options.uniswapV2Router02,
        'getAmountsOut',
        ["1000000000000000000", [ options.epnsTokenAddr, options.WETHAddress, options.USDTAddress]],
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
  const pushPrice = parseFloat(responseLPConversion[0]["amounts"][2].toString()) / 1e6;

  const wethPrice = parseFloat(responseLPConversion[1]["amounts"][1].toString()) / 1e6;

  const responseEPNSLPToken = await multicall(
    network,
    provider,
    epnsLpABI,
    [
      [
        options.epnsLPTokenAddr,
        'totalSupply',
        []
      ]
    ],
    {blockTag}
  )

  // Calculating price of EPNS-LP Tokens in terms of EPNS Tokens
  const uniLpTotalSupply = parseFloat(responseEPNSLPToken[0][0].toString()) / 1e18;

  const uniLpPrice = ((pushAmountReserve * pushPrice) + (wethAmountReserve * wethPrice)) / uniLpTotalSupply;

  const lpToPushRatio = uniLpPrice / pushPrice;

  return Object.fromEntries(
    responseDelegatedVotes.map((value, i) => [
      addresses[i],

      // Voting Power = Delegated PUSH + Staked PUSH + Staked UNI-LP PUSH
      parseFloat(formatUnits(value.toString(), options.decimals)) +

      parseFloat(formatUnits(responseStakedPUSH[i].toString(), options.decimals)) + 

      parseFloat(formatUnits(responseStakedLP[i].toString(), options.decimals)) * lpToPushRatio

    ])
  );
}