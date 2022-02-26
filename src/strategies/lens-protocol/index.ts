import { multicall } from '../../utils';

export const author = 'fl4C';
export const version = '0.1.0';

const followabi = [
    'function balanceOf(address owner) public view returns (uint256 amount)'
];
const hubabi = [
    'function getProfileIdByHandle(string) public view returns (uint256 profileId)',
    'function getFollowNFT(uint256) public view returns (address FollowNFT)'
]

export async function strategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
) {
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
    const handle = options.handle
    let profileId = await multicall(
        network,
        provider,
        hubabi,
        [[options.address, 'getProfileIdByHandle', [handle]]],
        { blockTag }
    )

    let followNFT = await multicall(
        network,
        provider,
        hubabi,
        [[options.address, 'getFollowNFT', [profileId[0].profileId._hex]]],
        { blockTag }
    )

    let balances = await multicall(
        network,
        provider,
        followabi,
        addresses.map((address: any) => [followNFT[0].FollowNFT, 'balanceOf', [address]]),
        { blockTag }
    );
    const result = {}
    addresses.forEach((address, i) => {
        result[address] = parseInt(balances[i].amount._hex)
    })
    return result
}
