import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Multicaller, call } from '../../utils';

export const author = 'pepperstepper';
export const version = '0.0.4';

const minoContractAddress = '0x3A1138075bd97a33F23A87824b811146FA44288E';
const sMinoContractAddress = '0xB46fe6791A30d51970EA3B840C9fa5F1F107b86F';
const wsMinoContractAddress = '0x1066c6753FFaf8540F691643A6D683e23599c4ab';

//const mmfPoolAddressOld = '0x57E8f8F7447D8d02fe4D291378D37E67D393257A';
//const mmfPoolAddressOld = '0x849f97c5452cc4bad1069b8efe2b3561b06694c3';
//const mmfPoolAddressNew = '0xf6a96e753dec01acb659acbe75deba46d53ebc5e';
const mmfPoolAddressNewNew = '0x687a0275aE620FB7868b09f16d3FeF862824317d';

const erc20ContractAbi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];
const sMinoContractAbi = ['function index() external view returns (uint256)'];
const mmfPoolAbi = [
  'function userInfo(address) view returns (uint256 amount, uint256 rewardDebt)'
];

type MultiCallResult = Record<string, BigNumberish>;
type MultiCallObjectResult = Record<string, any>;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const callIndex = () => {
    return call(provider, sMinoContractAbi, [
      sMinoContractAddress,
      'index',
      []
    ]);
  };

  const makeMulticaller = (
    abi,
    contractAddress,
    functionSignature,
    multicaller,
    callBatchIdx = '0'
  ) => {
    let multiCaller = new Multicaller(network, provider, abi, { blockTag });
    if (callBatchIdx !== '0') {
      multiCaller = multicaller;
    }
    addresses.forEach((address) =>
      multiCaller.call(
        address + callBatchIdx,
        contractAddress,
        functionSignature,
        [address]
      )
    );
    return multiCaller;
  };

  const sMinoMulti = makeMulticaller(
    erc20ContractAbi,
    sMinoContractAddress,
    'balanceOf',
    null,
    '0'
  );

  const wsMinoMulti = makeMulticaller(
    erc20ContractAbi,
    wsMinoContractAddress,
    'balanceOf',
    sMinoMulti,
    '1'
  );

  const minoMulti = makeMulticaller(
    erc20ContractAbi,
    minoContractAddress,
    'balanceOf',
    wsMinoMulti,
    '2'
  );
  const wsMinoInMMFMulti = makeMulticaller(
    mmfPoolAbi,
    mmfPoolAddressNewNew,
    'userInfo',
    null,
    '0'
  );

  const [index]: [BigNumber] = await Promise.all([callIndex()]);

  const [minoBalances, mmfUserInfo]: [MultiCallResult, MultiCallObjectResult] =
    await Promise.all([minoMulti.execute(), wsMinoInMMFMulti.execute()]);

  const scores: Record<string, BigNumber> = {};

  for (const address of addresses) {
    const wsMinoScore = BigNumber.from(
      mmfUserInfo[address + '0'] //from mmf pool
        ? mmfUserInfo[address + '0']['amount']
        : 0
    )
      .add(minoBalances[address + '1'] || 0) // wsMinoBalances
      .mul(index); // timeses by 10^9 effectively

    const minoScore = wsMinoScore
      .add(
        BigNumber.from(minoBalances[address + '0'] || 0).mul(
          BigNumber.from(10).pow(18)
        )
      ) // mino balances
      .add(
        BigNumber.from(minoBalances[address + '2'] || 0).mul(
          BigNumber.from(10).pow(18)
        )
      ); // sMino balances

    scores[address] = minoScore;
  }

  const scoresNumber = Object.fromEntries(
    Object.entries(scores).map(([address, balance]) => [
      address,
      balance.div(BigNumber.from(10).pow(18)).toNumber() / 1000000000
    ])
  );

  return scoresNumber;
}
