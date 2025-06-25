import snapshot from '@snapshot-labs/snapshot.js';
import { DEFAULT_SUPPORTED_PROTOCOLS } from '../constants';
import { Protocol, Snapshot } from '../types';

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

  // TODO: validate invalid networks
  async validate(customAuthor = this.author): Promise<boolean> {
    try {
      this.validateAddressType(customAuthor);
    } catch (e) {
      return false;
    }

    return this.doValidate(customAuthor);
  }

  // Abstract method to be implemented by subclasses
  // This contains the actual validation logic without global/commons validation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async doValidate(_customAuthor: string): Promise<boolean> {
    return true;
  }

  private validateAddressType(address: string): boolean {
    try {
      const formattedAddress = snapshot.utils.getFormattedAddress(address);

      if (
        (snapshot.utils.isEvmAddress(formattedAddress) &&
          this.supportedProtocols.includes('evm')) ||
        (snapshot.utils.isStarknetAddress(formattedAddress) &&
          this.supportedProtocols.includes('starknet'))
      ) {
        return true;
      }
    } catch (error) {
      // If isStarknetAddress throws an error, fall through to the standard error
    }

    throw new Error(
      `Address "${address}" is not a valid ${this.supportedProtocols.join(
        ' or '
      )} address`
    );
  }
}
