import * as BN from "bn.js";
import { Bitstream } from "../bitstream";
import { Constants } from "../constants";
import { fromFloat } from "../float";

interface SettlementValues {
  fillSA: BN;
  fillBA: BN;
  feeA: BN;
  protocolFeeA: BN;

  fillSB: BN;
  fillBB: BN;
  feeB: BN;
  protocolFeeB: BN;
}

/**
 * Processes spot trade requests.
 */
export class SpotTradeProcessor {
  public static extractData(data: Bitstream) {
    let offset = 1;

    // Storage IDs
    const storageIdA = data.extractUint32(offset);
    offset += 4;
    const storageIdB = data.extractUint32(offset);
    offset += 4;

    // Accounts
    const accountIdA = data.extractUint32(offset);
    offset += 4;
    const accountIdB = data.extractUint32(offset);
    offset += 4;

    // Tokens
    const tokenA = data.extractUint16(offset);
    offset += 2;
    const tokenB = data.extractUint16(offset);
    offset += 2;

    // Fills
    const fFillSA = data.extractUint24(offset);
    offset += 3;
    const fFillSB = data.extractUint24(offset);
    offset += 3;

    // Order data
    const orderDataA = data.extractUint8(offset);
    offset += 1;
    const orderDataB = data.extractUint8(offset);
    offset += 1;

    // Further extraction of packed data
    const limitMaskA = orderDataA & 0b10000000;
    const feeBipsA = orderDataA & 0b00111111;
    const fillAmountBorSA = limitMaskA > 0;

    const limitMaskB = orderDataB & 0b10000000;
    const feeBipsB = orderDataB & 0b00111111;
    const fillAmountBorSB = limitMaskB > 0;

    // Decode the float values
    const fillSA = fromFloat(fFillSA, Constants.Float24Encoding);
    const fillSB = fromFloat(fFillSB, Constants.Float24Encoding);

    const s = this.calculateSettlementValues(
      0,
      0,
      fillSA,
      fillSB,
      feeBipsA,
      feeBipsB
    );

    // Create struct
    const trade: any = {
      accountIdA,
      orderIdA: storageIdA,
      fillAmountBorSA,
      tokenA,
      fillSA: s.fillSA,
      feeA: s.feeA,
      protocolFeeA: s.protocolFeeA,

      accountIdB,
      orderIdB: storageIdB,
      fillAmountBorSB,
      tokenB,
      fillSB: s.fillSB,
      feeB: s.feeB,
      protocolFeeB: s.protocolFeeB
    };

    return trade;
  }

  private static calculateSettlementValues(
    protocolFeeTakerBips: number,
    protocolFeeMakerBips: number,
    fillSA: BN,
    fillSB: BN,
    feeBipsA: number,
    feeBipsB: number
  ) {
    const fillBA = fillSB;
    const fillBB = fillSA;
    const [feeA, protocolFeeA] = this.calculateFees(
      fillBA,
      protocolFeeTakerBips,
      feeBipsA
    );

    const [feeB, protocolFeeB] = this.calculateFees(
      fillBB,
      protocolFeeMakerBips,
      feeBipsB
    );

    const settlementValues: SettlementValues = {
      fillSA,
      fillBA,
      feeA,
      protocolFeeA,

      fillSB,
      fillBB,
      feeB,
      protocolFeeB
    };
    return settlementValues;
  }

  private static calculateFees(
    fillB: BN,
    protocolFeeBips: number,
    feeBips: number
  ) {
    const protocolFee = fillB.mul(new BN(protocolFeeBips)).div(new BN(100000));
    const fee = fillB.mul(new BN(feeBips)).div(new BN(10000));
    return [fee, protocolFee];
  }
}
