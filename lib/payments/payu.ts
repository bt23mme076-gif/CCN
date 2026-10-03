import crypto from 'crypto';

const PAYU_KEY = process.env.PAYU_MERCHANT_KEY || '';
const PAYU_SALT = process.env.PAYU_SALT || '';

export function isPayuConfigured(): boolean {
  return Boolean(PAYU_KEY && PAYU_SALT);
}

function sha512(input: string): string {
  return crypto.createHash('sha512').update(input).digest('hex');
}

// PayU hash fields break if they contain the '|' delimiter.
function sanitize(value: string): string {
  return value.replace(/\|/g, ' ').trim();
}

export interface PayuTxnInput {
  txnid: string;
  amountPaise: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  udf1: string; // order kind, e.g. 'recharges' | 'accessory'
  udf2?: string; // 'guest' for the no-login flow, else omitted
  surl: string;
  furl: string;
}

export interface PayuTxnParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1: string;
  udf2: string;
  hash: string;
}

export function buildPayuTxnParams(input: PayuTxnInput): PayuTxnParams {
  const amount = (input.amountPaise / 100).toFixed(2);
  const productinfo = sanitize(input.productinfo).slice(0, 100) || 'Recharge';
  const firstname = sanitize(input.firstname).slice(0, 60) || 'Customer';
  const email = input.email;
  const phone = input.phone;
  const udf1 = input.udf1;
  const udf2 = input.udf2 || '';

  // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
  const hashTokens = [
    PAYU_KEY,
    input.txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    '', '', // udf3, udf4
    '', // udf5
    '', '', '', '', '', // udf6-udf10
    PAYU_SALT,
  ];
  const hash = sha512(hashTokens.join('|'));

  return {
    key: PAYU_KEY,
    txnid: input.txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    surl: input.surl,
    furl: input.furl,
    udf1,
    udf2,
    hash,
  };
}

// Verifies a PayU callback form POST using the reverse-hash formula:
// sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
export function verifyPayuResponseHash(fields: Record<string, string>): boolean {
  if (!isPayuConfigured()) return false;
  const {
    status = '',
    udf1 = '',
    udf2 = '',
    email = '',
    firstname = '',
    productinfo = '',
    amount = '',
    txnid = '',
    key = '',
    hash = '',
  } = fields;

  if (key !== PAYU_KEY) return false;

  const reverseTokens = [
    PAYU_SALT,
    status,
    '', '', '', '', '', // udf10-udf6
    '', // udf5
    '', // udf4
    '', // udf3
    udf2,
    udf1,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key,
  ];
  const expectedHash = sha512(reverseTokens.join('|'));
  return expectedHash === hash;
}
