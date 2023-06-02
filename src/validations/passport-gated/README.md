# Gitcoin Passport Gated Validation

This repository provides a passport-gated validation strategy for Snapshot. The implementation integrates with the Gitcoin API to validate whether a user is authorized to vote on a proposal.

## Prerequisites

Before using this code, ensure that you have the following information stored in a `.env` file at the project root:

- `PASSPORT_API_KEY=<your-api-key>`

## Overview

This implementation uses the Gitcoin Passport API to check whether a user has a valid passport by looking for their stamps.

## Code Explanation

The main function in this codebase checks stamps for a user and returns a boolean value indicating whether the user has a valid passport.

## Modifications

The original code utilized the Passport SDK to check if the user has a valid passport and stamps.

[Coming Soon] However, with the introduction of the Passport API, we can now simplify the process by checking for a score.

## Last Modified

This code was last modified on June 1, 2023.

Feel free to customize and extend this implementation to suit your specific needs.
