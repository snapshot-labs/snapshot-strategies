import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
//import { formatUnits } from '@ethersproject/units';
import { Multicaller, call } from '../../utils';

export const author = 'pepperstepper';
export const version = '0.0.0';

const minoContractAddress = '0x3A1138075bd97a33F23A87824b811146FA44288E';
const sMinoContractAddress = '0xB46fe6791A30d51970EA3B840C9fa5F1F107b86F';
const wsMinoContractAddress = '0x1066c6753FFaf8540F691643A6D683e23599c4ab';

const mmfPoolAddress = '0x57E8f8F7447D8d02fe4D291378D37E67D393257A';

const erc20ContractAbi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
];
const sMinoContractAbi = ['function index() external view returns (uint256)'];
const mmfPoolAbi = ['function userInfo(address) view returns (uint256 amount, uint256 rewardDebt)']

type MultiCallResult = Record<string, BigNumberish>;
type MultiCallObjectResult = Record<string, object>;

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

  const callMinoTotalSupply = () => {
    return call(provider, erc20ContractAbi, [
      minoContractAddress,
      'totalSupply',
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

  const wsMinoMulti = makeMulticaller(
    erc20ContractAbi,
    wsMinoContractAddress,
    'balanceOf'
  );

  const wsMinoInMMFMulti = makeMulticaller(
    mmfPoolAbi,
    mmfPoolAddress,
    'userInfo'
  );

  const [minoTotalSupply, index, minoBalances, sMinoBalances, wsMinoBalances, mmfUserInfos]: [
    BigNumber,
    BigNumber,
    MultiCallResult,
    MultiCallResult,
    MultiCallResult,
    MultiCallObjectResult,
  ] = await Promise.all([
    callMinoTotalSupply(),
    callIndex(),
    minoMulti.execute(),
    sMinoMulti.execute(),
    wsMinoMulti.execute(),
    wsMinoInMMFMulti.execute()
  ]);

  const scores: Record<string, BigNumber> = {};

  for (const address of addresses) {
    const wsMinoScore = BigNumber.from(wsMinoBalances[address] || 0)
    .add(mmfUserInfos[address] ? BigNumber.from(mmfUserInfos[address]['amount']) : 0)
    .mul(index)
    .div(BigNumber.from(10).pow(18))

    const minoScore = wsMinoScore
      .add(sMinoBalances[address] || 0)
      .add(minoBalances[address] || 0)

    scores[address] = minoScore;
  }

  const scoresNumber =  Object.fromEntries(
    Object.entries(scores).map(([address, balance]) => [
      address,
      balance.mul(BigNumber.from(10).pow(9)).div(minoTotalSupply).toNumber() / 1000000000
    ])
  );

  return scoresNumber
}
