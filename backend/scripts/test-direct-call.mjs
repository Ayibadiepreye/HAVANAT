// Test sendEmailSafe directly to see if its console output works
import 'dotenv/config';
import { sendEmailSafe } from '../src/lib/email.ts';

console.log('Calling sendEmailSafe directly...');
const result = await sendEmailSafe({
  to: 'bonnieprincewill6@gmail.com',
  subject: 'Direct test from test-direct-call',
  html: '<p>hi</p>',
});
console.log('Result:', result);
