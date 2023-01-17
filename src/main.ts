const PrivateKeyProvider = require("truffle-privatekey-provider");
import { parseLoopringSubmitBlocksTx, parseSingleTx, replacer } from "./parse"
const assert = require("assert");
import { Bitstream } from "./bitstream";
import { providers } from "ethers";

async function main() {
  const args = process.argv.slice(2);
  let network = "mainnet";
  let txHash = "";
  if (args[0] == "--single") {
    assert(args.length >= 2, "Error: not enough arguments!");
    const request = parseSingleTx(new Bitstream(args[1]));
    console.log(JSON.stringify(request, replacer, 2));
  } else {
    if (args[0] == "--network") {
      assert(args.length >= 3, "Error: not enough arguments!");
      assert(args[1] === "mainnet" || args[1] === "goerli", "Error: unsupported network!");
      network = args[1];
      txHash = args[2];
    } else  {
      assert(args.length == 1, "Error: unsupported options!");
      txHash = args[0];
    }

    let ethNodeUrl = "https://mainnet.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3";
    if (network === "goerli") {
      ethNodeUrl = "https://goerli.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3";
    }

    // const testAccountPrivKey = "11".repeat(32);
    // const provider = new PrivateKeyProvider(testAccountPrivKey, ethNodeUrl);
    // const web3 = new Web3(provider);
    // const ethNodeUrl = network === 'mainnet'
    // ? "https://mainnet.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3"
    // : "https://goerli.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3"
  // const testAccountPrivKey = "11".repeat(32);
  // const provider = new PrivateKeyProvider(testAccountPrivKey, ethNodeUrl);
  // const web3 = new Web3(provider);
    const provider = new providers.JsonRpcProvider(ethNodeUrl)
    await parseLoopringSubmitBlocksTx(txHash, provider);
  }

}

main()
  .then(() => process.exit(0))
  .catch((err) => {console.error(err); process.exit(1)})
