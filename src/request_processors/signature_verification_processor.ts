import { Bitstream } from "../bitstream";

interface SignatureVerification {
  requestIdx?: number;
  owner?: string;
  accountID?: number;
  data?: string;
}

/**
 * Processes signature verification requests.
 */
export class SignatureVerificationProcessor {
  public static extractData(data: Bitstream) {
    const verification: SignatureVerification = {};
    let offset = 1;

    verification.owner = data.extractAddress(offset);
    offset += 20;
    verification.accountID = data.extractUint32(offset);
    offset += 4;
    verification.data = data.extractBytes32(offset).toString("hex");
    offset += 32;

    return verification;
  }
}
