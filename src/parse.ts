const PrivateKeyProvider = require("truffle-privatekey-provider");
import { Bitstream } from "./bitstream";
import * as BN from "bn.js";
const assert = require("assert");
const InputDataDecoder = require('ethereum-input-data-decoder');
import {
  TransactionType
} from "./types";
import { DepositProcessor } from "./request_processors/deposit_processor";
import { AccountUpdateProcessor } from "./request_processors/account_update_processor";
import { SpotTradeProcessor } from "./request_processors/spot_trade_processor";
import { TransferProcessor } from "./request_processors/transfer_processor";
import { WithdrawalProcessor } from "./request_processors/withdrawal_processor";
import { AmmUpdateProcessor } from "./request_processors/amm_update_processor";
import { SignatureVerificationProcessor } from "./request_processors/signature_verification_processor";
import { NftMintProcessor } from "./request_processors/nft_mint_processor";
import { NftDataProcessor } from "./request_processors/nft_data_processor";
import * as fs from "fs";

interface ThinBlock {
  blockSize: number;
  blockVersion: number;
  data: string;
  offchainData: string;
  operator: string;
  merkleRoot: string;
  transactionHash: string;
  requests?: any[];
  noopSize?: number;
}

export async function parseLoopringSubmitBlocksTx(txHash: string, web3: any) {
  const exchangeAddress = "0x0BABA1Ad5bE3a5C0a66E7ac838a129Bf948f1eA4";
  const owner = "0x5c367c1b2603ed166C62cEc0e4d47e9D5DC1c073";
  const submitBlocksFunctionSignature = "0xdcb2aa31"; // submitBlocksWithCallbacks

  const transaction = await web3.eth.getTransaction(txHash);
  console.log("transaction:", transaction);

  if (transaction.input.startsWith(submitBlocksFunctionSignature)) {
    const decodedInput = web3.eth.abi.decodeParameters(
      [
        "bool",
        "bytes",
        "bytes"
      ],
      "0x" + transaction.input.slice(2 + 4 * 2)
    );

    const data = decodedInput[1];
    // Get the inputs to commitBlock
    const decodedInputs = web3.eth.abi.decodeParameters(
      [
        {
          "struct ExchangeData.Block[]": {
            blockType: "uint8",
            blockSize: "uint16",
            blockVersion: "uint8",
            data: "bytes",
            proof: "uint256[8]",
            storeDataHashOnchain: "bool",
            auxiliaryData: "bytes",
            offchainData: "bytes"
          }
        }
      ],
      "0x" +
        data /*transaction.input*/
          .slice(2 + 4 * 2)
    );
    //console.log(decodedInputs);
    const numBlocks = decodedInputs[0].length;
    //console.log("numBlocks: " + numBlocks);
    for (let i = 0; i < numBlocks; i++) {
      // Get the block data
      const blockType = parseInt(decodedInputs[0][i].blockType);
      const blockSize = parseInt(decodedInputs[0][i].blockSize);
      const blockVersion = parseInt(decodedInputs[0][i].blockVersion);
      const onchainData = decodedInputs[0][i].data;
      const offchainData = decodedInputs[0][i].offchainData;
      const data = decodedInputs[4] === null ? "0x" : onchainData;

      // Get the new Merkle root
      const bs = new Bitstream(data);
      if (bs.length() < 20 + 32 + 32) {
        // console.log("Invalid block data: " + data);
        return;
      }

      const merkleRoot = bs.extractUint(20 + 32).toString(10);
      // console.log("merkleRoot: " + merkleRoot);

      // Create the block
      const newBlock: ThinBlock = {
        blockSize,
        blockVersion,
        data,
        offchainData,
        operator: owner,
        merkleRoot,
        transactionHash: txHash
      };

      processBlock(newBlock);
    }
  } else {
    console.log("tx " + txHash + " was committed with an unsupported function signature");
  }
}

function processBlock(block: ThinBlock) {
  let requests: any[] = [];

  let data = new Bitstream(block.data);
  let offset = 0;

  // General data
  offset += 20 + 32 + 32 + 4;
  // const protocolFeeTakerBips = data.extractUint8(offset);
  offset += 1;
  // const protocolFeeMakerBips = data.extractUint8(offset);
  offset += 1;
  // const numConditionalTransactions = data.extractUint32(offset);
  offset += 4;
  // const operatorAccountID = data.extractUint32(offset);
  offset += 4;

  let noopSize = 0;
  for (let i = 0; i < block.blockSize; i++) {
    const size1 = 29;
    const size2 = 39;
    const txData1 = data.extractData(offset + i * size1, size1);
    const txData2 = data.extractData(
      offset + block.blockSize * size1 + i * size2,
      size2
    );

    const txData = new Bitstream(txData1 + txData2);
    const txType = txData.extractUint8(0);

    if (txType === TransactionType.NFT_MINT) {
      if (i + 1 < block.blockSize) {
        txData.addHex(
          getTxData(data, offset, i + 1, block.blockSize).getData()
        );
        if (i + 2 < block.blockSize) {
          txData.addHex(
            getTxData(data, offset, i + 2, block.blockSize).getData()
          );
        }
      }
    }

    const request = parseSingleTx(txData);
    request.requestIdx = i;

    if (request.txType === "NOOP") {
      noopSize += 1;
      if (noopSize == 1) {
        requests.push(request);
      }
    } else {
      requests.push(request);
    }
  }

  block.requests = requests;
  block.noopSize = noopSize;

  const blockJson = JSON.stringify(block, replacer, 2);
  console.log("block:", blockJson);
  const resultFile = "result/" + block.transactionHash + ".json";
  fs.writeFileSync(resultFile, blockJson);
  console.log("parsed data saved to file:", resultFile);
}

function adjustTxType(txType: TransactionType, request: any) {
  let adjustedType = TransactionType[txType];
  if (txType === TransactionType.TRANSFER) {
    if (request.accountFromID <= 10000) {
      adjustedType = "AMM_EXIT";
    }
    if (request.accountToID <= 10000) {
      adjustedType = "AMM_JOIN";
    }
  }

  if (txType == TransactionType.SPOT_TRADE) {
    if (request.accountIdA <= 10000 || request.accountIdB <= 10000) {
      adjustedType = "SWAP";
    } else {
      adjustedType = "TRADE";
    }
  }

  return adjustedType;
}

function getTxData(
  data: Bitstream,
  offset: number,
  txIdx: number,
  blockSize: number
) {
  const size1 = 29;
  const size2 = 39;
  const txData1 = data.extractData(offset + txIdx * size1, size1);
  const txData2 = data.extractData(
    offset + blockSize * size1 + txIdx * size2,
    size2
  );
  return new Bitstream(txData1 + txData2);
}

export function replacer(key: string, value: any) {
  if ( key === "tokenWeight" ||
    key === "balance" ||
    key === "amount" ||
    key === "fee" ||
    key === "fillSA" ||
    key === "fillSB" ||
    key === "feeA" ||
    key === "feeB") {
    // console.log("key:", key, "value:", value);
    const newValue = new BN(value, 16).toString(10);
    // console.log("newValue:", newValue);
    return newValue;
  } else {
    return value;
  }
}

export function parseSingleTx(txData: Bitstream) {
  const txType = txData.extractUint8(0);

  let request: any = {};
  if (txType === TransactionType.NOOP) {
    // Do nothing
  } else if (txType === TransactionType.DEPOSIT) {
    request = DepositProcessor.extractData(txData);
  } else if (txType === TransactionType.SPOT_TRADE) {
    request = SpotTradeProcessor.extractData(txData);
  } else if (txType === TransactionType.TRANSFER) {
    request = TransferProcessor.extractData(txData);
  } else if (txType === TransactionType.WITHDRAWAL) {
    request = WithdrawalProcessor.extractData(txData);
  } else if (txType === TransactionType.ACCOUNT_UPDATE) {
    request = AccountUpdateProcessor.extractData(txData);
  } else if (txType === TransactionType.AMM_UPDATE) {
    request = AmmUpdateProcessor.extractData(txData);
  } else if (txType === TransactionType.SIGNATURE_VERIFICATION) {
    request = SignatureVerificationProcessor.extractData(txData);
  } else if (txType === TransactionType.NFT_MINT) {
    request = NftMintProcessor.extractData(txData);
  } else if (txType === TransactionType.NFT_DATA) {
    request = NftDataProcessor.extractData(txData);
  } else {
    assert(false, "unknown transaction type: " + txType);
  }

  request.type = adjustTxType(txType, request);
  console.log("request.type:", request.type);
  request.txData = txData.getData();

  return request;
}
