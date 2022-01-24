import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';

import { abi as multicallAbi } from './abi/Multicall.json';
import networks from './networks.json';

export async function multicall(network: string, provider, abi: any[], calls: any[], options?) {
    const multi = new Contract(networks[network].multicall, multicallAbi, provider);
    const itf = new Interface(abi);
    try {
        const [, res] = await multi.aggregate(
            calls.map((call) => [call[0].toLowerCase(), itf.encodeFunctionData(call[1], call[2])]),
            options || {}
        );
        return res.map((call, i) => itf.decodeFunctionResult(calls[i][1], call));
    } catch (e) {
        return Promise.reject(e);
    }
}
