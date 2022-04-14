import * as BN from "bn.js";
import { Bitstream } from "../bitstream";
import { Constants } from "../constants";
import { fromFloat } from "../float";
import {
  SpotTrade
} from "../types";

interface SettlementValues {
  fillSA: BN;
  fillBA: BN;
  feeSA: BN;
  feeBA: BN;
  protocolFeeSA: BN;
  protocolFeeBA: BN;

  fillSB: BN;
  fillBB: BN;
  feeSB: BN;
  feeBB: BN;
  protocolFeeSB: BN;
  protocolFeeBB: BN;
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
    const tokenAS = data.extractUint16(offset);
    offset += 2;
    const tokenBS = data.extractUint16(offset);
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

    // Target tokenIDs
    let tokenAB = data.extractUint16(offset);
    offset += 2;
    let tokenBB = data.extractUint16(offset);
    offset += 2;

    // Extra fee data
    let feeBipsHiA = data.extractUint8(offset);
    offset += 1;
    let feeBipsHiB = data.extractUint8(offset);
    offset += 1;

    // Further extraction of packed data
    const limitMaskA = orderDataA & 0b10000000;
    const feeBipsA = (feeBipsHiA << 6) | (orderDataA & 0b00111111);
    const fillAmountBorSA = limitMaskA > 0;

    const limitMaskB = orderDataB & 0b10000000;
    const feeBipsB = (feeBipsHiB << 6) | (orderDataB & 0b00111111);
    const fillAmountBorSB = limitMaskB > 0;

    //console.log("feeBipsA, feeBipsB:", feeBipsA, feeBipsB);

    // Decode the float values
    const fillSA = fromFloat(fFillSA, Constants.Float24Encoding);
    const fillSB = fromFloat(fFillSB, Constants.Float24Encoding);

    // Decode target tokenIDs
    tokenAB = tokenAB !== 0 ? tokenAB : tokenBS;
    tokenBB = tokenBB !== 0 ? tokenBB : tokenAS;

    const s = this.calculateSettlementValues(
      tokenAS,
      tokenBS,
      0,
      0,
      fillSA,
      fillSB,
      feeBipsA,
      feeBipsB
    );

    // Create struct
    const trade: SpotTrade = {
      requestIdx: 0,
      accountIdA,
      orderIdA: storageIdA,
      fillAmountBorSA,
      tokenAS,
      tokenAB,
      fillSA: s.fillSA,
      feeA: s.feeSA,
      protocolFeeA: new BN(0),

      accountIdB,
      orderIdB: storageIdB,
      fillAmountBorSB,
      tokenBS,
      tokenBB,
      fillSB: s.fillSB,
      feeB: s.feeBB,
      protocolFeeB: new BN(0),
    };

    return trade;
  }

  private static calculateSettlementValues(
    tokenAS: number,
    tokenBS: number,
    protocolFeeTakerBips: number,
    protocolFeeMakerBips: number,
    fillSA: BN,
    fillSB: BN,
    feeBipsA: number,
    feeBipsB: number
  ) {
    const fillBA = fillSB;
    const fillBB = fillSA;

    const feeBipsSA = !Constants.isNFT(tokenBS) ? 0 : feeBipsA;
    const feeBipsBA = !Constants.isNFT(tokenBS) ? feeBipsA : 0;
    const feeBipsSB = !Constants.isNFT(tokenAS) ? 0 : feeBipsB;
    const feeBipsBB = !Constants.isNFT(tokenAS) ? feeBipsB : 0;

    const allNFT = Constants.isNFT(tokenAS) && Constants.isNFT(tokenBS);

    const [feeSA, protocolFeeSA] = this.calculateFees(
      fillSA,
      0,
      feeBipsSA
    );
    const [feeBA, protocolFeeBA] = this.calculateFees(
      fillBA,
      0,
      feeBipsBA
    );
    const [feeSB, protocolFeeSB] = this.calculateFees(
      fillSB,
      0,
      feeBipsSB
    );
    const [feeBB, protocolFeeBB] = this.calculateFees(
      fillBB,
      0,
      feeBipsBB
    );

    const settlementValues: SettlementValues = {
      fillSA,
      fillBA,
      feeSA,
      feeBA,
      protocolFeeSA,
      protocolFeeBA,

      fillSB,
      fillBB,
      feeSB,
      feeBB,
      protocolFeeSB,
      protocolFeeBB
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
