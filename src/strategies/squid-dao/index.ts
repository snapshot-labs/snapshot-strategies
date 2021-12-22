import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, call } from '../../utils';

export const author = 'zencephalon';
export const version = '0.0.0';

const vewsSquidContractAddress = '0x58807e624b9953c2279e0efae5edcf9c7da08c7b';
const nftContractAddress = '0x7136ca86129e178399b703932464df8872f9a57a';
const sSquidContractAdress = '0x9d49bfc921f36448234b0efa67b5f91b3c691515';

const vewsSquidContractAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];
const nftContractAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];
const sSquidContractAbi = ['function index() external view returns (uint256)'];

type MultiCallResult = Record<string, BigNumberish>;

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
    return call(provider, sSquidContractAbi, [
      sSquidContractAdress,
      'index',
      []
    ]);
  };

  const makeMulticaller = (abi, contractAddress) => {
    const multiCaller = new Multicaller(network, provider, abi, {
      blockTag
    });
    addresses.forEach((address) =>
      multiCaller.call(address, contractAddress, 'balanceOf', [address])
    );
    return multiCaller;
  };

  const vewsSquidMulti = makeMulticaller(
    vewsSquidContractAbi,
    vewsSquidContractAddress
  );
  const nftMulti = makeMulticaller(nftContractAbi, nftContractAddress);

  const [index, vewsResults, nftResults]: [
    BigNumber,
    MultiCallResult,
    MultiCallResult
  ] = await Promise.all([
    callIndex(),
    vewsSquidMulti.execute(),
    nftMulti.execute()
  ]);

  const scores: Record<string, BigNumber> = {};
  const nftMultiplier = BigNumber.from(10).pow(18);

  for (const address of addresses) {
    const vewsScore = BigNumber.from(vewsResults[address] || 0)
      .mul(index)
      .div(1e9);
    const nftScore = BigNumber.from(nftResults[address] || 0).mul(
      nftMultiplier
    );
    scores[address] = vewsScore.add(nftScore);
  }

  const totalScore = Object.values(scores).reduce(
    (a, b) => a.add(b),
    BigNumber.from(0)
  );

  const dec_multi = BigNumber.from(10).pow(options.decimals);

  return Object.fromEntries(
    Object.entries(scores).map(([address, balance]) => [
      address,
      parseFloat(
        formatUnits(
          balance.mul(100).mul(dec_multi).div(totalScore),
          options.decimals
        )
      )
    ])
  );
}
