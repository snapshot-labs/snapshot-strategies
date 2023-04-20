import Validation from '../validation';
import { getProvider, getScoresDirect } from '../../utils';
import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';

const abi = [
  'function getVotes(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

export default class extends Validation {
  public id = 'arbitrum';
  public github = 'gzeoneth';
  public version = '0.1.0';
  public title = 'Arbitrum DAO Percentage of Votable Supply';
  public description =
    'Use with erc20-votes to validate by percentage of votable supply.';
  public proposalValidationOnly = true;

  async validate(): Promise<boolean> {
    if (this.params.strategies?.length > 8)
      throw new Error(`Max number of strategies exceeded`);
    const minBps = this.params.minBps;
    const decimals = this.params.decimals;
    const excludeaddr =
      this.params.excludeaddr ?? '0x00000000000000000000000000000000000A4B86';

    if (minBps) {
      const scores = await getScoresDirect(
        this.space,
        this.params.strategies,
        this.network,
        getProvider(this.network),
        [this.author],
        this.snapshot || 'latest'
      );
      const totalScore: any = scores
        .map((score: any) =>
          Object.values(score).reduce((a, b: any) => a + b, 0)
        )
        .reduce((a, b: any) => a + b, 0);
      const [[totalSupply], [excludedSupply]] = await multicall(
        this.network,
        getProvider(this.network),
        abi,
        [
          [this.params.address, 'totalSupply', []],
          [this.params.address, 'getVotes', [excludeaddr]]
        ],
        { blockTag: this.snapshot || 'latest' }
      );
      const votableSupply = parseFloat(
        formatUnits(totalSupply.sub(excludedSupply).toString(), decimals)
      );
      const bpsOfVotable = (totalScore * 10000) / votableSupply;
      if (bpsOfVotable < minBps) return false;
    }

    return true;
  }
}
