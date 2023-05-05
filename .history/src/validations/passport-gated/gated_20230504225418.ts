/**
 * @fileoverview Passport-gated validation strategy for Snapshot. 
 * This implementation integrates with the Gitcoin API to validate 
 * whether a user is authorized to vote on a proposal. 
 * 
 * Last modified: May 4, 2023
 * 
 * NOTE: The original code used the Passport SDK to check if the user
 * has a valid passport. With the Passport API, we can simply check if
 * the user has a valid passport by looking for a score.
 * 
 * In this function, we are returning a binary score (0 or 1) depending
 * on wether the user's passport is flagged as a likely Sybil.
 * 
 */

// TODO: Run code in Snapshot playground
// TODO: Test API endpoints

// QUESTION: Is this.author imply the users wallet already connected?

// FIXME: Currently calls locally stored environment variables

import snapshot from '@snapshot-labs/snapshot.js';
import fetch from 'cross-fetch';
import Validation from '../validation';

// these lines read the API key and scorer ID from the .env.local file
const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const SCORER_ID = process.env.NEXT_PUBLIC_GC_SCORER_ID

// endpoint for getting the signing message
const SIGNING_MESSAGE_URI = 'https://api.scorer.gitcoin.co/registry/signing-message'
// endpoint for submitting passport
const SUBMIT_PASSPORT_URI = 'https://api.scorer.gitcoin.co/registry/submit-passport'

const headers = API_KEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
}) : undefined=

export default class extends Validation {
    public id = 'passport-gated';
    public github = 'snapshot-labs';
    public version = '0.1.0';
    public title = 'Gitcoin Passport Gated';
    public description =
      'Protect your proposals from spam and vote manipulation by requiring users to have a Gitcoin Passport.';

    /* todo get users wallet */

    /* todo get signing message from API */
    async getSigningMessage() {
        try {
            const response = await fetch(SIGNING_MESSAGE_URI, {
            headers
            })
            const json = await response.json()
            return json
        } catch (err) {
            console.log('error: ', err)
        }
    }
    

    async validate(): Promise<boolean> {
      const gitcoinPassportAPI = 'https://api.scorer.gitcoin.co';
      const scorerId = '<your_scorer_id>';
      const apiKey = '<your_api_key>';
  
      // Get the signer from the provider
      const provider = snapshot.utils.getProvider(this.network);
      const signer = provider.getSigner(this.author);
  
      // Retrieve a challenge message from the scorer
      const responseMessage = await fetch(`${gitcoinPassportAPI}/registry/signing-message`, {
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      });
      const { message, nonce } = await responseMessage.json();
  
      // Have the user sign the challenge
      const signature = await signer.signMessage(message);
  
      // Submit the Ethereum address and the signed challenge to the scorer
      const responseSubmit = await fetch(`${gitcoinPassportAPI}/registry/submit-passport`, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: this.author,
          scorer: scorerId,
          signature,
          nonce,
        }),
      });
      const submitData = await responseSubmit.json();
  
      // Get the score for the address
      const responseScore = await fetch(`${gitcoinPassportAPI}/registry/score/${scorerId}/${this.author}`, {
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      });
      const scoreData = await responseScore.json();
  
      // Check if the user has a Gitcoin Passport by checking for a score
      return scoreData.score !== null;
    }
  }
