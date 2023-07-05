# karma-discord-roles

**Karma Discord role strategy can be used by DAOs to provide voting power to contributors with a specific role on Discord.**

## Prerequisites

Below are the prerequisites to enable this strategy for your Snapshot space.

1. For this strategy to work, the DAO needs to be set up in Karma's platform. Send us an email at dao@karmahq.xyz for onboarding on to Karma.

2. Have Karma Discord Bot installed in your Discord server. You can install the bot through the following link: (https://discord.com/api/oauth2/authorize?client_id=986699463164846100&permissions=1101927561248&scope=bot%20applications.commands).

## Usage

json
{
"name": <daoName>,
"roles": [<list of discord roles>]
}

**Example 1**
json
{
"name": "Karma",
"roles": ["Moderator"]
}

This will assign voting power of 1 to anyone in Karma's discord server who has "Moderator" role assigned to them. 

**Example 2**
json
{
"name": "Karma",
"roles": ["Moderator"],
"addresses": [
"0xa768f5F340e89698465Fc7C12F31cB485fAf98B2"
]
}
This will assign voting power of 1 to anyone in Karma's discord server who has "Moderator" role assigned to them. It will also assign voting power to any address in "addresses" list.

If you have trouble setting up the strategy, please email us at dao@karmahq.xyz.
