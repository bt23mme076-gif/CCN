// Run: npx tsx --test lib/payments/smsParser.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCreditMessage } from './smsParser';

const cases: [string, number, string | undefined][] = [
  ['Dear UPI user A/C X1234 credited by 499.07 on date 10Nov26 trf from RAHUL KUMAR Refno 431512345678. If not u? call 1800111109. -SBI', 49907, '431512345678'],
  ['Money Received - INR 1,250.50 in your HDFC Bank A/c xx1234 on 10-11-26 by A/c linked to VPA rahul@okaxis (UPI Ref No 431512345679).', 125050, '431512345679'],
  ['ICICI Bank Acct XX123 credited:Rs. 499.00 on 10-Nov-26; RAHUL KUMAR credited. UPI:431512345670. Call 18002662 for dispute.', 49900, '431512345670'],
  ['INR 200.00 credited to A/c no. XX1234 on 10-11-26 at 10:20:11 IST. Info- UPI/P2A/431512345671/RAHUL KUMAR - Axis Bank', 20000, '431512345671'],
  ['Received Rs.99 in your Kotak Bank A/c X1234 from rahul@okaxis on 10-11-26.UPI Ref:431512345672.', 9900, '431512345672'],
  ['Received ₹350.42 from Rahul Kumar', 35042, undefined], // PhonePe Business notification
];

for (const [msg, amount, utr] of cases) {
  test(msg.slice(0, 40), () => {
    assert.deepEqual(parseCreditMessage(msg), { amountPaise: amount, utr });
  });
}

test('ignores debit SMS', () => {
  assert.equal(parseCreditMessage('Rs.500.00 debited from A/c XX1234 to VPA shop@ybl. UPI Ref 431512345673. Amount will be credited back if failed.'), null);
});

test('ignores OTP SMS', () => {
  assert.equal(parseCreditMessage('123456 is your OTP for login. Do not share.'), null);
});
