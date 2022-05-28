const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../').default;
const networks = require('@snapshot-labs/snapshot.js/src/networks.json');

const space = 'yam.eth';
const network = '137';
const snapshotBlockNumber = 13995858;
const strategies = [
  {
    name: 'ens-domains-owned',
    params: {
      domain: 'sismo.eth'
    }
  }
];
const addresses = [
  "0x0000000000000000000000000000000000000000",
  '0x05e57688C639b0742ea3E940b4E9DC0fb69B1B88',
  '0x1D911BCC079660aaFB772D48B992d50815b7a66d',
  '0xCe2EF28C65e5Db090d75630c98A807da003fb36f',
  '0xeeF8d9e9DcbfC8E54f94c033B9f686D5fC58035B',
  '0x2B5beb1A7e4c1ae1022b8152ee342C9862C3C187',
  '0x477430E5d51a00A0d09f8c3CBe3dB4AeF7ca8eD6',
  '0x5FBeD051405C7dAc3f8C5E545e235AeFdD4AA6b1',
  '0x8eBed0FF2B0232B0AedbFe6e9c0f72AC72577869',
  '0x96aea12D5e0e7F7C027649F11Bd038BfEAB33A1E',
  '0x4a9A2F31E2009045950DF5aAb36950609DE93c78',
  '0x99655CA16C742b46A4a05AFAf0f7798C336Fd279',
  '0x04A0f10c0Dcfa5a4C060E5421f385c2A0E541a94',
  '0x112F0732E59E7600768dFc35Ba744b89F2356Cd8',
  '0x4e486E7eee27500b8851d63d003119c4DA4825f6',
  '0x3e3672B23eB22946A31263d2D178bF0fB1f4BBFD',
  '0x33E580CEe928D83a61B98905a1F9bE68eA6279B8',
  '0x8728C811F93Eb6AC47D375E6a62dF552d62ed284',
  '0xDb18957bE8fb364E2F293E7cA6e689Dc55991688',
  '0xE874946c5876E5e6a9Fbc1e17DB759e06E3B3ffe',
  '0xe6a42207C3e008df25EDB2cDeF9d0373a3858c4A',
  '0x37b3fAe959F171767E34e33eAF7eE6e7Be2842C3',
  '0xBa67b35E3CA6E6686Da67aBE4EB98400e8995214',
  '0x9cbBCD3B4129B1c00F0cd851BAf118ebb0c4F168',
  '0x124d05e1cF1316141463224e3b9a9592044eE325',
  '0x5bb3e1774923b75Ecb804E2559149BbD2a39A414',
  '0x4BC496f7B1806A46Aa048b97FDc180c0c79Ce29d',
  '0x19Fa5828b99C82172FC48D282F1194FDe0B67783',
  '0x2B81cF00392506d1cCBa003d400E32aF8d0861a9',
  '0x4AA24D7Dd60760D672B8cbc07B4bC409b4338488',
  '0xD71C552a4954673a30893BF1Db0A77f1aFA1accD',
  '0x6Cd68E8f04490Cd1A5A21cc97CC8BC15b47Dc9eb',
  '0x9e2363e885Ed2f1A65DF589D99723458C637A3AF',
  '0x2849735A064De9930B5c799a37e9E33ddd6E83E1',
  '0x69536933efB3f6056869405dfa0941F0c7D84d13',
  '0x88e0a61798A3cED52f7654a5D79A90737f346631',
  '0xdea5f0ced7F50e0A2b37C7Ad9df0e2eD368739D4',
  '0x0952ecc0080Ed9A0cBD5839a3CC6758b85C3a835',
  '0x79b1A32EC97537486E75d99850BD56ECfA09D643',
  '0x0F045a0D77D24c326316E0315354E7Df28B4aC50',
  '0x710aa48Cff5e5235126aFc0033E15f3DA1c5cDD8',
  '0xb1D186bC6512E972dB0255B33DeD0f57f26927f5',
  '0x1C494f1919C1512ebE74a5dCc17DAC9A64069023',
  '0x1A91bD78f536523ac1217bbE23b5c1844053cBa6',
  '0xB4FEcf7774E36d7Bc534AbFf5d970eEdABEde653',
  '0x37b699d7eeAD58433d352D1c77b2dB1391F11Ce5',
  '0x7aeFc3d46e3F07CF929FA8a2070FFDe2feA4bA75',
  '0xDebfDB2baa4bb879D6Cb983609929d813E9bC39C',
  '0x77aD5d16Ca853E84B9B07Ee5359D706D00D65F8D',
  '0x068e9989EFF6ee3746DE4498e5Bbc0Ecc7f968Fb',
  '0x574A782a00dd152D98fF85104F723575d870698e',
  '0x7Afc7465Ea61ADaDe40045548496c2e1116ffe14',
  '0x87BdB4879138276E241116d54c7f67C3bb375593',
  '0xDaF545190666F7b7FC42B946D1AE9A91FB784d3E',
  '0x397bdFFd614628fE57327BD0B0D4F8C6eC2d9065',
  '0xea12735deA23d7Ad19ab9c5467aEc829dbeb650d',
  '0xCDEf06D81219c87Bcfd41e1d78e4DefdAB381eFF',
  '0xd80AE6951F8FE208D55f9cC7BE6d53476f14d8B8',
  '0x9a1Ce61815C2e7cAFd55a8cA2F03Af7dA34B1b84',
  '0x6bFE350873CC600035C6697A748fBff708A6e14f',
  '0x13928F482a3483Cd5fFAdE46A98797561230805a',
  '0x3b04F42507442408B8385ADfBaE74b6a43f5f7dD',
  '0xA7239A6c9E8151A887d45cfD64e854eF9207Cca4',
  '0x1ca661110Bf33560498DC1d955961AFb05CC4972',
  '0x5d2249B3e1675d56CCFDC8b4318942e88eA3f127',
  '0x8c81fA9Ae3CA9499e7FC374aFB09d9219d26a866',
  '0xd884808c8D9c40Af3108c853b0455D991105c8cA',
  '0x96430447cc9E9816100d9c5E365de6463F9BBB66',
  '0x3f2a9A1DB4D1CF4bcAbCeF32F2E25cA6419Ad1F6',
  '0x36b7562e9087cd0D2fdA4870997fd2ac2dEF4C70',
  '0x7E491C2Abe6fa9e39c96bBCBc3f142B2E160A604',
  '0x774699AE2615EFD12f93Cf90ff7213E6D61b6d06',
  '0x74C3b2d22ED5990B9aB1f77BD3054D4fD4AfCF96',
  '0x17256EC32f4c6759582f4d272D92Ef68F6d3004C',
  '0x74a191ff18e99A7eB7c6E58269ABBD9a86a5D930',
  '0xc645303a36d7313f1414250DdfDdD58A972e1a35',
  '0xA547478BdfA44eAA7650905fe95034187C3dc96D',
  '0xcDAF5Fd2a2D199B9C8E05f7C7079A1E4bbC87fDd',
  '0x7e4D4C3F1e36CD5E3E1f933Efd4A88f5b27e49FA',
  '0x7F57AD6d2FEad3609A541e9EeCE99b0474784c51',
  '0xD0c5817fc7989fDc13cf8E4E0c53948BA4E9eC9f',
  '0xC74B2EC0fF1a0F37Dc9F88B476a45941cF28a473',
  '0x3D764EF787cb2D5A4326EFB126b3C87C41dea03E',
  '0x451B6B19E0B84730c0306628fFf4BE7A9509affd',
  '0x455Ca2eEEB67bd243993C58Afea5268F2af9de9A',
  '0x9EB1a1f5252fC6cDC857497e883a4500b88c04BE',
  '0xca8937ccfd9486A69e1299184ee39f50B098d1F4',
  '0xaDAe85E5438e81AE5F272A394EF9B0E8d8152185',
  '0x3E1daf2C9477D7b0C9E8500180e80D7Ef93584d8',
  '0x9BdFAeB9CB28DC05b09B37c0F14ECBc9A876CEe0',
  '0xCa253fE65D86E0a1848864184C170FaaC021F862',
  '0x0FD2Cf82D6D0131233b4793BdEeAc02e76A16207',
  '0x4B188a3c642762c21d6bDeb44819c40a61873Dc1',
  '0x7c67Ec08525672a4703c51125709DEe33C24A240',
  '0xD6ccfDf5cC9aB482eE1d6b8D29904f2D08420Abf',
  '0x68cdD84267c53882271a93221a18FE5515fb8921',
  '0xa473855ec37a981a4FaBAa196A1D536AB904e674',
  '0x4b1C21C93Ff275Cbe80Eed552964dA91d5eBafb3',
  '0xA4117d4a882C1a569963f42DcF56c8287442A99A',
  '0x79dBa1d434c26746B21233d3a46660523FB934A0',
  '0xbACAF16F83ea0511123D937bBE83480d6eeBC118',
  '0xf8df9716c5b83d02F09a34E9d62C9e22F62C616C',
  '0x4f855Cd9c9e47890ED7E394379E7ad5cE048dDd9',
  '0x5b295AA92ddD008D4042773E8DF91A9F848ebC58',
  '0x4A4b673A5e61fD895717Fc887F20D2c0F0F201d6',
  '0xEC63913528365fc4B845df57171b63D71eC68442',
  '0x3ceAdAe144d357f9d0D429e5429Ff64C574D2735',
  '0xba96a2ba89eA249148ee599d2BBcD669DE94d4B6',
  '0xf3aeDFE55A7142b4fBC8a077F65F827Fc61Cec4A',
  '0x207053a23d86fe3697dC073461f293894a931a72',
  '0x533A0Ea2994fE49df6886f493231dcD161108e51',
  '0x13532b842aDB6144Ac5a4fBce11c0934dbD2f16f',
  '0x54e44B2185A7E2217d2A110A3eE8025bfa56349C',
  '0x8F5dAd7f4DB78df43A082ebE6A9B8311A8888888',
  '0xD60e645C391ED4374829D7Ec6439B7E1C7a5438c',
  '0x0619FaF1247845c4188D1bC1Eb8E11fd0C658494',
  '0x58805f572924b83b8c224184d2Cf60ad3302DBDF',
  '0x1220D8c528aFA28165a1F065b3749E717DB98A2E',
  '0x4a0D9E1aa64d284cfB211E38AAdB14df96CA6B2A',
  '0x04F71A91733F55c82fD29F064b37F7D83B2eE86D',
  '0x2F23C81827fFdAe92B52e03233aD9Da9B1A55008',
  '0xbe0C04ec30D93feC3384f070dDb0252dDE38B4fE',
  '0x2fD932137355F5D04d7D84E13a9637739E1f2909',
  '0x266557ABC87afD40582fc535fbb677Ae5B993Ea9',
  '0x6A4406F5be648B406c0c20334E8a5DE6B4999516',
  '0x13fA821CF4eD2d4FD5F3088E0c3B759128915077',
  '0xC77FA6C05B4e472fEee7c0f9B20E70C5BF33a99B',
  '0x30fe54136f14df7db7B8a7750c30c47A9ca8082B',
  '0x4Cd83f7Cf066e05C4fC69F79DE324418481a5a9a',
  '0xc4C24cf03c502403805F4e9E65C4Bf2c5478Ef48',
  '0xACbbf0094bd28FdcE18026395219E6be3874Ef52',
  '0x968a0e5603c5D4dbF24cbd7df562921d158aD19C',
  '0x725Fc8fE91DcF9343DD80342A93E45F2923c7334',
  '0x0D41f544b18B779389081833791c24AE5075B888',
  '0xce3696f3B57Db19e5EbE014aA2d5636E87f9f22D',
  '0xe4fb9ca52E39B83BE69E74E7Fac8f807A9c16eF9',
  '0x4709B84407DD559C08764fd5dC25bf842b001893',
  '0xb8688028c54EFe7D6e27405616526B23C7Ae6948',
  '0x3360E49aE7551275D9Bc4Fef223Ef72D22C6Ffb0',
  '0x806346b423dDB4727C1f5dC718886430aA7CE9cF',
  '0x7441CB7D4940cE9Ecd8738A44aFC7b94a089C207',
  '0xF61CabBa1e6FC166A66bcA0fcaa83762EdB6D4Bd',
  '0x43a7a118501CD5D22c42be163865A404015126db',
  '0xECD02810Db92Ff027ea1b0850d46BdA963676D74',
  '0x9edd2B78A279d1e30D8361729164e03fBe8C84C9',
  '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
  '0x2D52F7BaE61912f7217351443eA8a226996a3Def',
  '0x652880DE887495F956bbF66e76c127b59791e510',
  '0x28B9667e89e8340b8cFacb35F85D18E2C81006D7',
  '0x78947805246FA30f80533d77486dbEe786aCCe6E',
  '0xdd6CA7D9D4d2A190a5C940F499Cb32494a6Fd31C',
  '0xBd12aa424c207E90B66402c1F0aeC357e8b1Ded7',
  '0x74184bFF3CF29E82E4D8cb3B7f1D5A89FDD0eB15',
  '0x26bBec292e5080ecFD36F38FF1619FF35826b113',
  '0x26f580E930D7982f82138621F074A01a75adc920',
  '0x8ab1760889F26cBbf33A75FD2cF1696BFccDc9e6',
  '0xc323053eF49BE080300134d7C6a05834C4FfFd0A',
  '0x8867c12738F4cA3b530AFe7EfC7aC4ee1d286cBC',
  '0x75d4bdBf6593ed463e9625694272a0FF9a6D346F',
  "0xd00faF7c2a837DC457389758Ea1271aE6256dc44",
  "0x9Cf28Be69D1c88ff7ECC1D2332577CB9671aBF70",
  "0xabc1c404424bdf24c19a5cc5ef8f47781d18eb3e",
  "0x5AB5844Dd55Ab73212D1527e4CF72FEA884e39DD",
  "0x0C2bBdD40855Df7Ed68b5EC999c8F8931645E477",
  "0x7eb791413ccfd3f763c3561ed820824eb2e46a10",
  "0xa89a9290dd214b9341dc09fe23ef0a6a633f9a9f",
  "0xf862c9413f2cc21ebfda534ecfa6df4f59f0b197",
  "0x0008d343091ef8bd3efa730f6aae5a26a285c7a2",
  "0x1679c892d593bf0a8eaba6f15caffbe04926a346",
  "0x6ec85b83d60b0ad3c2c2782c1cd554671980d734",
  "0xf55dbe5039b72f50dec88df436006f66ec22d910",
  "0xf98a24c6e63d514feeb68142eb9c5e91a20c502e"
];

(async () => {
  console.time('getScores');
  try {
    const scores = await snapshot.utils.getScoresDirect(
      space,
      strategies,
      network,
      new JsonRpcProvider(networks[network].rpc[0]),
      addresses,
      snapshotBlockNumber
    );
    console.log(scores);
  } catch (e) {
    console.log('getScores failed');
    console.error(e);
  }
  console.timeEnd('getScores');
})();
