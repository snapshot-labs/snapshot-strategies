// Removed the import statement due to the error

export default class RWOKVotingPower {
  public id = "rwok-voting";
  public github = "your-github-repo";
  public version = "0.1.0";
  public title = "RWOK Staked NFT Voting Power";
  public description = "Computes voting power based on staked RWOK NFTs.";

  public author: string;
  public space: string;
  public network: string;
  public snapshot: number | 'latest';
  public params: any;

  constructor(
    author: string,
    space: string,
    network: string,
    snapshot: number | 'latest',
    params: any
  ) {
    this.author = author;
    this.space = space;
    this.network = network;
    this.snapshot = snapshot;
    this.params = params;
  }

  async validate(): Promise<boolean> {
    return true;
  }

  async strategy(
    addresses: string[],
    provider: any
  ): Promise<Record<string, number>> {
    const STAKING_CONTRACT_ADDRESS = "0x2C0973b082491948A48180D2bf528E7B51D44Eec";
    const STAKING_CONTRACT_ADDRESS = "0x2C0973b082491948A48180D2bf528E7B51D44Eec";
    const NFT_MULTIPLIER = 300030;
    
    let multicaller = new Multicaller(this.network, provider, [
      'function balanceOf(address) view returns (uint256)'
    ], { blockTag: this.snapshot });
    
    addresses.forEach((address) => {
      multicaller.call(address, STAKING_CONTRACT_ADDRESS, 'balanceOf', [address]);
    });
    
    const stakedBalances = await multicaller.execute();
    return Object.fromEntries(
      addresses.map((address) => [
        address,
        (stakedBalances[address] || 0) * NFT_MULTIPLIER
      ])
    );
  }
}
