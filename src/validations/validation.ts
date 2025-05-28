import { Protocol, Snapshot } from '../types';
import snapshot from '@snapshot-labs/snapshot.js';

export default class Validation {
  public id = '';
  public github = '';
  public version = '';
  public title = '';
  public description = '';
  public supportedProtocols: Protocol[] = ['evm'];

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

  async validate(): Promise<boolean> {
    return true;
  }

  validateAddressType(): boolean {
    const formattedAddress = snapshot.utils.getFormattedAddress(this.author);

    if (
      (snapshot.utils.isEvmAddress(formattedAddress) &&
        this.supportedProtocols.includes('evm')) ||
      (snapshot.utils.isStarknetAddress(formattedAddress) &&
        this.supportedProtocols.includes('starknet'))
    ) {
      return true;
    }

    throw new Error(
      `Address "${this.author}" is not a valid ${this.supportedProtocols.join(
        ' or '
      )} address`
    );
  }
}
