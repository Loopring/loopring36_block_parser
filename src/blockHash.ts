import axios from "axios";

export function getBlockLayer1Hash(network: 'mainnet' | 'goerli', blockId: number){
  return axios({
    url: network === 'mainnet'
      ? `https://api3.loopring.io/api/v3/block/getBlock?id=${blockId}`
      : `https://uat2.loopring.io/api/v3/block/getBlock?id=${blockId}`,
    // proxy: {
    //   port: 7890,
    //   host: '127.0.0.1',
    //   protocol: 'http'
    // },
  }).then(x => {
    return x.data.txHash as string
    // debugger
    // x.data
  })
}
// getBlockLayer1Hash('mainnet', 11431)