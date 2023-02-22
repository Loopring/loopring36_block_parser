const PrivateKeyProvider = require("truffle-privatekey-provider");
import { getBlockLayer1Hash } from "./blockHash";
import { parseLoopringSubmitBlocksTx } from "./parse"
import { providers } from "ethers"

function parseBlockByHash(hash: string, JSONRPCProviderURL: string) {
  return parseLoopringSubmitBlocksTx(hash, JSONRPCProviderURL).then(x => {
    return x[0]
  });
}

export const dataByBlockIdAndIndex = (network: 'mainnet' | 'goerli', JSONRPCProviderURL: string) => async (blockId: number, index: number) => {
  const hash = await getBlockLayer1Hash(network, blockId);
  const blockInfo = await parseBlockByHash(hash, JSONRPCProviderURL)
  return blockInfo.requests[index]
}
