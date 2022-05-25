import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Multicaller, call } from '../../utils';

export const author = 'pepperstepper';
export const version = '0.0.3';

const minoContractAddress = '0x3A1138075bd97a33F23A87824b811146FA44288E';
const sMinoContractAddress = '0xB46fe6791A30d51970EA3B840C9fa5F1F107b86F';

//const mmfPoolAddressOld = '0x57E8f8F7447D8d02fe4D291378D37E67D393257A';
const mmfPoolAddressOld = '0x849f97c5452cc4bad1069b8efe2b3561b06694c3';
const mmfPoolAddressNew = '0xf6a96e753dec01acb659acbe75deba46d53ebc5e';

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

  const makeMulticaller = (abi, contractAddress, functionSignature) => {
    const multiCaller = new Multicaller(network, provider, abi, {
      blockTag
    });
    addresses.forEach((address) =>
      multiCaller.call(address, contractAddress, functionSignature, [address])
    );
    return multiCaller;
  };

  const minoMulti = makeMulticaller(
    erc20ContractAbi,
    minoContractAddress,
    'balanceOf'
  );

  const sMinoMulti = makeMulticaller(
    erc20ContractAbi,
    sMinoContractAddress,
    'balanceOf'
  );

  const wsMinoInMMFMultiOld = makeMulticaller(
    mmfPoolAbi,
    mmfPoolAddressOld,
    'userInfo'
  );

  const wsMinoInMMFMultiNew = makeMulticaller(
    mmfPoolAbi,
    mmfPoolAddressNew,
    'userInfo'
  );

  const [index, minoBalances, sMinoBalances, mmfUserInfosOld, mmfUserInfoNew]: [
    BigNumber,
    MultiCallResult,
    MultiCallResult,
    MultiCallObjectResult,
    MultiCallObjectResult
  ] = await Promise.all([
    callIndex(),
    sMinoMulti.execute(),
    minoMulti.execute(),
    wsMinoInMMFMultiOld.execute(),
    wsMinoInMMFMultiNew.execute()
  ]);

  const scores: Record<string, BigNumber> = {};

  for (const address of addresses) {
    const wsMinoScore = BigNumber.from(
      mmfUserInfosOld[address]
        ? BigNumber.from(mmfUserInfosOld[address]['amount'])
        : 0
    )
      .add(
        mmfUserInfoNew[address]
          ? BigNumber.from(mmfUserInfoNew[address]['amount'])
          : 0
      )
      .mul(index)
      .div(BigNumber.from(10).pow(18));

    const minoScore = wsMinoScore
      .add(sMinoBalances[address] || 0)
      .add(minoBalances[address] || 0);

    scores[address] = minoScore;
  }

  const scoresNumber = Object.fromEntries(
    Object.entries(scores).map(([address, balance]) => [
      address,
      balance.toNumber() / 1000000000
    ])
  );

  return scoresNumber;
}
