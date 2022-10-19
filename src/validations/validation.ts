export default class Validation {
  public id = '';
  public github = '';
  public version = '';

  public author: string;
  public space: string;
  public network: string;
  public snapshot: number | string;
  public params: any;

  constructor(
    author: string,
    space: string,
    network: string,
    snapshot: number | string,
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
}
