import BN from "bn.js";
import { Bitstream } from "../bitstream";
import { Constants } from "../constants";
import { fromFloat } from "../float";
import { NftDataProcessor } from "./nft_data_processor";
import { TransactionType } from "../types";
const Poseidon = require("../poseidon");
const assert = require("assert");

interface NftMint {
  type?: number;
  minterAccountID?: number;
  tokenAccountID?: number;
  toAccountID?: number;
  toTokenID?: number;
  nftID?: string;
  amount?: BN;
  feeTokenID?: number;
  fee?: BN;
  validUntil?: number;
  storageID?: number;
  minter?: string;
  to?: string;
  nftData?: string;
  nftType?: number;
  tokenAddress?: string;
  creatorFeeBips?: number;
}

/**
 * Processes NFT mint requests.
 */
export class NftMintProcessor {

  public static extractData(data: Bitstream) {
    const mint: NftMint = {};
    let offset = 1;

    // Check that this is a conditional update
    mint.type = data.extractUint8(offset);
    offset += 1;

    mint.minterAccountID = data.extractUint32(offset);
    offset += 4;
    mint.toTokenID = data.extractUint16(offset);
    offset += 2;
    mint.feeTokenID = data.extractUint16(offset);
    offset += 2;
    mint.fee = fromFloat(data.extractUint16(offset), Constants.Float16Encoding);
    offset += 2;
    mint.amount = data.extractUint96(offset);
    offset += 12;
    mint.storageID = data.extractUint32(offset);
    offset += 4;

    if (mint.type === 0) {
      mint.nftType = data.extractUint8(offset);
      offset += 1;
      mint.tokenAccountID = data.extractUint32(offset);
      offset += 4;
      mint.nftID = "0x" + data.extractBytes32(offset).toString("hex");
      offset += 32;
      mint.creatorFeeBips = data.extractUint8(offset);
      offset += 1;

      mint.toAccountID = mint.minterAccountID;
    } else {
      mint.toAccountID = data.extractUint32(offset);
      offset += 4;
      mint.to = data.extractAddress(offset);
      offset += 20;

      // Read the following NFT data tx
      {
        offset = 68 * 1;
        const txType = data.extractUint8(offset);
        assert(txType == TransactionType.NFT_DATA, "unexpected tx type");

        const nftData = NftDataProcessor.extractData(data, offset + 1);
        mint.nftID = nftData.nftID;
        mint.creatorFeeBips = nftData.creatorFeeBips;
      }

      {
        offset = 68 * 2;
        const txType = data.extractUint8(offset);
        assert(txType == TransactionType.NFT_DATA, "unexpected tx type");

        const nftData = NftDataProcessor.extractData(data, offset + 1);
        assert(nftData.type === 1, "unexpected nft data type");
        mint.nftType = nftData.nftType;
        mint.tokenAddress = nftData.tokenAddress;
      }
    }

    return mint;
  }

  public static getNftData(mint: NftMint) {
    const nftIDHi = new BN(mint.nftID.substr(2, 32), 16).toString(10);
    const nftIDLo = new BN(mint.nftID.substr(2 + 32, 32), 16).toString(10);

    // Calculate hash
    const hasher = Poseidon.createHash(7, 6, 52);
    const inputs = [
      mint.minter,
      mint.nftType,
      mint.tokenAddress,
      nftIDLo,
      nftIDHi,
      mint.creatorFeeBips
    ];
    return hasher(inputs).toString(10);
  }
}
