a# loopring36-block-parser

## Install dependencies
```
> yarn / npm install
```

## Run
```
> ts-node src/main.ts [--network <mainnet|goerli>] <txHash>  
    options:   
    --network: mainnet/goerli, default is mainnet  
    --single: parse txData of a single tx

    e.g.   
    1) parse tx 0x947cfd35acb01824f231782b8fc3516f0886b63666e38b48653ebe7a295c5345 on mainnet:   
    > ts-node src/main.ts 0x947cfd35acb01824f231782b8fc3516f0886b63666e38b48653ebe7a295c5345  
    
    2) parse tx 0x11bffe7b21ffab6885b363c499d47f43a9511c2694249affb0d0aa874956d64e on goerli:  
    > ts-node src/main.ts --network goerli 0x11bffe7b21ffab6885b363c499d47f43a9511c2694249affb0d0aa874956d64e  
    
    3) parse txData `0x040000000000000006000119c200016f6c000080005986a00000018f0980020000051300000000000000000000000000000000000000000000000000000000000000000`:
    > ts-node src/main.ts 0x040000000000000006000119c200016f6c000080005986a00000018f0980020000051300000000000000000000000000000000000000000000000000000000000000000
```

## Parsed result:  
parsed result will be saved to result directory, named as `[txHash].json`
