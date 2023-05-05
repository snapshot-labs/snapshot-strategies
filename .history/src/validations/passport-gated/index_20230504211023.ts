/**
 * @fileoverview Passport-gated validation strategy for Snapshot. 
 * This implementation integrates with the Gitcoin API to validate 
 * whether a user is authorized to vote on a proposal. 
 * 
 * Last modified: May 4, 2023
 *
 * The validate() function is a voting validation strategy that returns a boolean value
 * indicating whether the connected account is authorized to vote on a given proposal.
 * The function retrieves the required passport stamps from the proposal parameters,
 * and then queries the Gitcoin API to retrieve the user's passport stamps. It then checks 
 * whether the user has valid stamps for each of the required passport stamps. Finally, 
 * the function returns a boolean value based on whether the user has valid stamps for 
 * all the required passport stamps or not.
 *
 * To use this implementation, simply import it into your Snapshot proposal, and set 
 * the validation strategy to an instance of this class.
 */

import snapshot from '@snapshot-labs/snapshot.js';
import Validation from '../validation';
//import { ethers} from 'ethers';
import axios from 'axios';
import {
  getPassport,
  getVerifiedStamps,
  hasValidIssuanceAndExpiration
} from '../passport-weighted/helper';

const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const SCORER_ID = process.env.NEXT_PUBLIC_GC_SCORER_ID

const headers = API_KEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
}) : undefined

export default class extends Validation {
  public id = 'passport-gated';
  public github = 'snapshot-labs';
  public version = '0.1.0';
  public title = 'Gitcoin Passport Gated';
  public description =
    'Protect your proposals from spam and vote manipulation by requiring users to have a Gitcoin Passport.';

   //function returns  
  async validate(): Promise<boolean> {
    const requiredStamps = this.params.stamps;
    const passport: any = await getPassport(this.author);
    if (!passport) return false;
    if (!passport.stamps?.length || !requiredStamps?.length) return false;

    const verifiedStamps: any[] = await getVerifiedStamps(
      passport,
      this.author,
      requiredStamps.map((stamp) => ({
        id: stamp
      }))
    );
    if (!verifiedStamps.length) return false;

    const provider = snapshot.utils.getProvider(this.network);
    const proposalTs = (await provider.getBlock(this.snapshot)).timestamp;
    const operator = this.params.operator;

    // check issuance and expiration
    const validStamps = verifiedStamps
      .filter((stamp) =>
        hasValidIssuanceAndExpiration(stamp.credential, proposalTs)
      )
      .map((stamp) => stamp.provider);

    // console.log('validStamps', validStamps);
    // console.log('requiredStamps', requiredStamps);
    // console.log('operator', operator);

    if (operator === 'AND') {
      return requiredStamps.every((stamp) => validStamps.includes(stamp));
    } else if (operator === 'OR') {
      return requiredStamps.some((stamp) => validStamps.includes(stamp));
    } else {
      return false;
    }
  }
}
