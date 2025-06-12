import { DEFAULT_SUPPORTED_PROTOCOLS, MAX_STRATEGIES_LENGTH } from '..';
import { Protocol, Snapshot } from '../types';
import snapshot from '@snapshot-labs/snapshot.js';

export default class Validation {
  public id = '';
  public github = '';
  public version = '';
  public title = '';
  public description = '';
  public supportedProtocols: Protocol[] = DEFAULT_SUPPORTED_PROTOCOLS;
  public hasInnerStrategies = false;

  public author: string;
  public space: string;
  public network: string;
  public snapshot: Snapshot;
  public params: any;

  constructor(
    author: string,
    space: string,
    network: string,
    snapshot: Snapshot,
    params: any
  ) {
    this.author = author;
    this.space = space;
    this.network = network;
    this.snapshot = snapshot;
    this.params = params;
  }

  async validate(customAuthor = this.author): Promise<boolean> {
    this.validateAddressType(customAuthor);
    this.validateStrategiesLength();

    return this.doValidate(customAuthor);
  }

  // Abstract method to be implemented by subclasses
  // This contains the actual validation logic without global/commons validation
  protected async doValidate(_customAuthor: string): Promise<boolean> {
    return true;
  }

  private validateAddressType(address: string): boolean {
    const formattedAddress = snapshot.utils.getFormattedAddress(address);

    if (
      (snapshot.utils.isEvmAddress(formattedAddress) &&
        this.supportedProtocols.includes('evm')) ||
      (snapshot.utils.isStarknetAddress(formattedAddress) &&
        this.supportedProtocols.includes('starknet'))
    ) {
      return true;
    }

    throw new Error(
      `Address "${address}" is not a valid ${this.supportedProtocols.join(
        ' or '
      )} address`
    );
  }

  private validateStrategiesLength(): boolean {
    if (
      this.hasInnerStrategies &&
      this.params.strategies?.length > MAX_STRATEGIES_LENGTH
    ) {
      throw new Error(`Max number of strategies exceeded`);
    }
    return true;
  }
}
