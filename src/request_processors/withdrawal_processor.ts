import BN from "bn.js";
import { Bitstream } from "../bitstream";
import { Constants } from "../constants";
import { fromFloat } from "../float";

interface Withdrawal {
  type?: number;
  from?: string;
  fromAccountID?: number;
  tokenID?: number;
  amount?: BN;
  feeTokenID?: number;
  fee?: BN;
  to?: string;
  onchainDataHash?: string;
  minGas?: number;
  validUntil?: number;
  storageID?: number;
}

/**
 * Processes withdrawal requests.
 */
export class WithdrawalProcessor {
  public static extractData(data: Bitstream) {
    const withdrawal: Withdrawal = {};
    let offset = 1;

    withdrawal.type = data.extractUint8(offset);
    offset += 1;
    withdrawal.from = data.extractAddress(offset);
    offset += 20;
    withdrawal.fromAccountID = data.extractUint32(offset);
    offset += 4;
    withdrawal.tokenID = data.extractUint16(offset);
    offset += 2;
    withdrawal.amount = data.extractUint96(offset);
    offset += 12;
    withdrawal.feeTokenID = data.extractUint16(offset);
    offset += 2;
    withdrawal.fee = fromFloat(
      data.extractUint16(offset),
      Constants.Float16Encoding
    );
    offset += 2;
    withdrawal.storageID = data.extractUint32(offset);
    offset += 4;
    withdrawal.onchainDataHash = data.extractData(offset, 20);
    offset += 20;

    return withdrawal;
  }
}
