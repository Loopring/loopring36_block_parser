const PrivateKeyProvider = require("truffle-privatekey-provider");
import { getBlockLayer1Hash } from "./blockHash";
import { parseLoopringSubmitBlocksTx2 } from "./parse"
const Web3 = require("web3");

function parseBlockByHash(hash: string, network: 'mainnet' | 'goerli') {
  const ethNodeUrl = network === 'mainnet'
    ? "https://mainnet.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3"
    : "https://goerli.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3"
  const testAccountPrivKey = "11".repeat(32);
  const provider = new PrivateKeyProvider(testAccountPrivKey, ethNodeUrl);
  const web3 = new Web3(provider);
  return parseLoopringSubmitBlocksTx2(hash, web3).then(x => x[0]);
}

export const dataByBlockIdAndIndex = (network: 'mainnet' | 'goerli') => async (blockId: number, index: number) => {
  const hash = await getBlockLayer1Hash(network, blockId);
  const blockInfo = await parseBlockByHash(hash, network)
  return blockInfo.requests[index]
}

// dataByBlockIdAndIndex('mainnet')(11431, 1)
// .then(x => {
//   debugger
// })
// .catch(x => {
//   debugger
// })

// parseBlockByHash('0x053178299781f365b7051586fdedd38d67b996d72fb5d126b60d000a859df02c', 'mainnet')
// .then(x => {
//   // debugger
// })
// .catch(x => {
//   debugger
// })

// main()
//   .then(() => process.exit(0))
//   .catch((err) => {console.error(err); process.exit(1)})
