# loopring36-block-parser

## Install dependencies
```
> yarn / npm install
```

## Run
```
> ts-node src/parse.ts [--network <mainnet|goerli>] <txHash>  
    options:   
    --network: mainnet/goerli, default is mainnet  

    e.g.   
    parse tx 0x947cfd35acb01824f231782b8fc3516f0886b63666e38b48653ebe7a295c5345 on mainnet:  
    > ts-node src/parse.ts 0x947cfd35acb01824f231782b8fc3516f0886b63666e38b48653ebe7a295c5345
```
