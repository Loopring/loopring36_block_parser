const PrivateKeyProvider = require("truffle-privatekey-provider");
import { getBlockLayer1Hash } from "./blockHash";
import { parseLoopringSubmitBlocksTx } from "./parse"
import { providers } from "ethers"

function parseBlockByHash(hash: string, network: 'mainnet' | 'goerli') {
  const ethNodeUrl = network === 'mainnet'
    ? "https://mainnet.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3"
    : "https://goerli.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3"
  const provider = new providers.JsonRpcProvider(ethNodeUrl)
  return parseLoopringSubmitBlocksTx(hash, provider).then(x => {
    return x[0]
  });
}
// dataByBlockIdAndIndex('mainnet')(11431, 1)
export const dataByBlockIdAndIndex = (network: 'mainnet' | 'goerli') => async (blockId: number, index: number) => {
  const hash = await getBlockLayer1Hash(network, blockId);
  const blockInfo = await parseBlockByHash(hash, network)
  return blockInfo.requests[index]
}