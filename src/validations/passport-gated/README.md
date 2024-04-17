# Gitcoin Passport Gated Validation

This repository provides a passport-gated validation strategy for Snapshot. It integrates with Gitcoin Passport to validate whether a user is authorized to create/vote on a proposal.

## Overview

This implementation uses the Gitcoin Passport API to check whether a user has a valid passport by looking for their [Stamps](https://docs.passport.gitcoin.co/building-with-passport/major-concepts#stamps) and [score](https://docs.passport.gitcoin.co/building-with-passport/major-concepts#scorer). A passport is set to be valid if it meets the minimum criteria in terms of valid (non-expired) stamp collection it should own and minimum score threshold. Both criteria are set as parameters during setup.

* A passport is set to own a particular Stamp if it has at least one [verifiable credential](https://docs.passport.gitcoin.co/building-with-passport/major-concepts#verifiable-credentials-vcs).
* The current implementation is best suited to use the `Unique Humanity` scoring mechanism. To learn more about the available scorers check this [link](https://docs.passport.gitcoin.co/building-with-passport/major-concepts#scoring-mechanisms).

## Pre-requisites

Before using this code, you need to create an API Key and Scorer ID to interact with the Passport API. You can get them at the [Passport Scorer](https://scorer.gitcoin.co/) dashboard. Then, ensure that you have the following information stored in a `.env` file at the project root:

- `PASSPORT_API_KEY=<your-api-key>`
- `PASSPORT_SCORER_ID=<your-scorer-id>`

**NOTICE**: make sure to create a Scorer using the `Unique Humanity` mechanism.

## Stamps Metadata

The Stamps currently supported by Gitcoin Passport are stored in [stampsMetadata.json](./stampsMetadata.json). The Passport API has an [endpoint](https://docs.passport.gitcoin.co/building-with-passport/scorer-api/endpoint-definition#get-stamps-metadata-beta) where you can fetch all this information, but we don't do this programmatically in order to minimize the number of requests made by the validation strategy and meet the requirements listed in the main [README](../../../README.md). 

**NOTICE**: this file might need to be updated from time to time when Passport updates their supported Stamps and VCs.

## Strategy Schema

Strategy schema & parameters are defined under [schema.json](./schema.json). In case Passport creates new and/or deprecate stamps, it is required to update the `stamps` property to reflect those changes in the Snapshot UI. See the section above to know how to get the latest supported stamps.

## Code Explanation

The main function (validate()) first fetches the following parameters:

* `stamps` (required): a list of Stamps that a passport should own.
* `operator` (required): (and/or) whether a Passport should own all or at least one of the required stamps.
* `scoreThreshold` ([0-100]): the threshold a Passport score should surpass in order to be eligible for creating/voting on a proposal. If not set, default value is set to zero to preserve backward compatibility.

Then, it calls the following validation methods:

* `validateStamps`: it uses the API to fetch the current user's Passport stamps and verifies that each has valid issuance and isn't expired. Then, depending on the `operator`, it will iterate through the required `stamps` and check that the user holds at least one verifiable credential that makes the passport eligible for that stamp. Finally, a Passport will be set as valid if it meets the criteria.
* `validatePassportScore`: if `scoreThreshold` is set to zero this function will be omitted. Otherwise when called, it uses the Scorer API to submit the passport for scoring and get the latest score. If the API response returns a payload with `status === 'DONE'` it will return the result of evaluating the scoring threshold criteria, otherwise the implementation will make periodic requests (up to `PASSPORT_SCORER_MAX_ATTEMPTS`) to the Scorer API until getting a `DONE` status.

Finally, it checks the results of both eval functions and returns a boolean value indicating whether the user has a valid Passport.

### Notes on Scorer API

Currently, the [Submit Passport endpoint](https://docs.passport.gitcoin.co/building-with-passport/scorer-api/endpoint-definition#submit-for-scoring) (used to submit a Passport **the fist time** to the `Scorer` for evaluation) has `signature` and `nonce` as optional parameters, so it isn't required to get an authorization from the Passport owner (via authentication) in order to request the `Scorer` to calculate the Passport score. In case this changes in the future, it will be required to either: a) use the same `PASSPORT_SCORER_ID` used by the frontend interface where the user signed the authentication message requesting the Passport stamps + score (e.g. `https://passport.gitcoin.co/`) so the validation strategy can fetch the latest Passport score without any issues, or b) implement the logic for requesting and verifying the signed message within the custom validation strategy.

### Unit tests

A few validation examples are provided in [examples.json](./examples.json). However, Passport stamps expire after some predetermined time which might end up breaking unit tests, so it is important to have in mind that a few example passports/stamp will require to be updated regurlarly before running tests. The `valid` property is used to set an example as valid/invalid passport during testing.

## Modifications

### June 1, 2023

The original code utilized the Passport SDK to check if the user has a valid passport and stamps.

[Coming Soon] However, with the introduction of the Passport API, we can now simplify the process by checking for a score.

---

### September 21, 2023

Code is fully integrated with Passport API. In order to evaluate if an address is eligible for creating/voting on a proposa, It checks for passport stamp collection and minimum score using the `Unique Humanity` scoring mechanism, however it could be upgraded in the future to support other scoring algorithms.

Unit tests now support multiple example Passports to evaluate different validation scenarios.

## Last Modified

This code was last modified on September 21, 2023.

Feel free to customize and extend this implementation to suit your specific needs.
