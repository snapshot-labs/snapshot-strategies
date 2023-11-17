# eas-attestation
Karma's solution to validate proposal creators using EAS Attest.sh.
> This should only be used to validate proposal creation.

Parameters:
`schemaId`: EAS's schema UID given when the schema is created. Example: [`0xc0f979976278d9e1d4fa97b7270c0cc07835aa5f27dd897a871b3332ec6cff22`](https://sepolia.easscan.org/schema/view/0xc0f979976278d9e1d4fa97b7270c0cc07835aa5f27dd897a871b3332ec6cff22)
`address`: The proposer's address
`network`: The chain ID. Currently supports only Mainnet (1)
