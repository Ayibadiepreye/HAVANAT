import 'dotenv/config';
const KEY = process.env.RESEND_API_KEY;
console.log('Key prefix:', KEY?.slice(0, 12));
console.log('Key length:', KEY?.length);

// Test 1: curl-style fetch (what backend does)
console.log('\n=== Test 1: direct fetch (like backend sendEmail) ===');
const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Havanat <concierge@havanat.store>',
    to: 'bonnieprincewill6@gmail.com',
    subject: 'Direct fetch test',
    html: '<p>direct fetch</p>',
  }),
});
const d = await r.json().catch(() => ({}));
console.log('status:', r.status, 'response:', JSON.stringify(d));

// Test 2: the actual sendEmail() function
console.log('\n=== Test 2: sendEmail() function ===');
const { sendEmail } = await import('../src/lib/email.ts');
try {
  const result = await sendEmail({
    to: 'bonnieprincewill6@gmail.com',
    subject: 'sendEmail function test',
    html: '<p>sendEmail test</p>',
  });
  console.log('Result:', JSON.stringify(result));
} catch (e) {
  console.error('Error:', e.message);
}
