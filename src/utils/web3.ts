export async function getBlockNumber(provider) {
  try {
    const blockNumber: any = await provider.getBlockNumber();
    return parseInt(blockNumber);
  } catch (e) {
    return Promise.reject();
  }
}
