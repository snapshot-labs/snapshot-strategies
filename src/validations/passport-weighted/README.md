# Gitcoin passport weighted validation

This repository provides a passport-weighted validation strategy for Snapshot. The implementation integrates with the Gitcoin API to validate whether a user is authorized to vote on a proposal.

## Prerequisites

Before using this code, ensure that you have the following information stored in a `.env` file at the project root:

- `NEXT_PUBLIC_GC_API_KEY=<your-api-key>`
- `NEXT_PUBLIC_GC_SCORER_ID=<your-scorer-id>`

## Overview

This implementation uses the Gitcoin Passport API to check whether a user has a passport score thats above the minScore threshold value.

## Code Explanation

The main function in this codebase returns a threshold score based on the user's passport.

## Modifications

The original code utilized the Passport SDK to check if the user meets the passport score threshold. However, with the introduction of the Passport API, we can now simplify the process by checking directly for the score.

## Last Modified

This code was last modified on May 11, 2023.

Feel free to customize and extend this implementation to suit your specific needs.



