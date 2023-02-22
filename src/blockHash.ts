import axios from "axios";

export function getBlockLayer1Hash(network: 'mainnet' | 'goerli', blockId: number){
  return axios({
    url: network === 'mainnet'
      ? `https://api3.loopring.io/api/v3/block/getBlock?id=${blockId}`
      : `https://uat2.loopring.io/api/v3/block/getBlock?id=${blockId}`,
  }).then(x => {
    return x.data.txHash as string
  })
}

