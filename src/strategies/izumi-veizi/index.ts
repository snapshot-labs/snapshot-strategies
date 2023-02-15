import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import abi from './abi.json'

export const author = 'izumi';
export const version = '0.1.0';

export async function strategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
): Promise<Record<string, number>> {
    const block = await provider.getBlock(snapshot)
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
    const timeStamp = block.timestamp
    let ans = {} as Record<string, number>

    const nftBalance = new Multicaller(network, provider, abi, { blockTag });
    addresses.forEach((address) => nftBalance.call(address, options.address, 'balanceOf', [address]));
    const balance: Record<string, BigNumberish> = await nftBalance.execute();

    await Promise.all(Object.entries(balance).map(async ([address, balance]) => {
        if (balance.toString() != '0'){
            const nftId = new Multicaller(network, provider, abi, { blockTag })
            const num = Number(balance.toString())
            for (let i=0; i<num; i++){
                nftId.call(i, options.address, 'tokenOfOwnerByIndex', [address, i])
            }
            const nftIds: Record<string, BigNumberish> = await nftId.execute()

            const veizi = new Multicaller(network, provider, abi, { blockTag })
            Object.entries(nftIds).map(([index, id])=>{
                veizi.call(id, options.address, 'nftVeiZiAt', [id, timeStamp])
            })
            const score: Record<string, BigNumberish> = await veizi.execute()

            Object.entries(score).map(([id, point])=>{
                const decimalPoint = Number(Math.floor(parseFloat(formatUnits(point, options.decimals)) * 100) / 100)
                const tmp = Object.keys(ans).find((t)=>{return t===address})
                if (tmp !== undefined) {
                    ans[address] = ans[address] + decimalPoint
                } else {
                    Object.assign(ans, {[address]:decimalPoint})
                }
          })   
        }   
    }))

    const stakingCheck = new Multicaller(network, provider, abi, { blockTag })
    addresses.forEach((address) => stakingCheck.call(address, options.address, 'stakedNft', [address]));
    const staked: Record<string, BigNumberish> = await stakingCheck.execute()
    const stakedNft = new Multicaller(network, provider, abi, { blockTag })

    Object.entries(staked).map(([address,id])=>{
        stakedNft.call(address, options.address, 'nftVeiZiAt', [id, timeStamp])
    })
    const stakedPoint: Record<string, BigNumberish> = await stakedNft.execute()

    Object.entries(stakedPoint).map(([address, point]) => {
        const tmp = Object.keys(ans).find((t)=>{return t===address})
        const decimalStakePoint = Number(Math.floor(parseFloat(formatUnits(point, options.decimals)) * 100) / 100)
        if (tmp !== undefined) {
            ans[address] = Number(ans[address]) + decimalStakePoint
        } else {
            Object.assign(ans, {[address]:decimalStakePoint})
        }
    })

    return Object.fromEntries(
        Object.entries(ans).map(([address, point]) => [
            address,
            Math.floor(point / 10) * 10
        ])
    );
}
