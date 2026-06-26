import 'dotenv/config';
const KEY = process.env.RESEND_API_KEY;

// Send EXACTLY what the backend would send for forgot-password
const body = {
  from: 'Havanat <concierge@havanat.store>',
  to: ['bonnieprincewill6@gmail.com'],  // the inbox you actually check
  subject: 'Your Havanat password-reset code',
  html: '<p>Test from Node - exactly what backend sends for forgot-password</p>',
  reply_to: 'concierge@havanat.store',
  tags: [{name: 'type', value: 'forgot_password'}],
};

const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});
const d = await r.json().catch(() => ({}));
console.log('status:', r.status);
console.log('response:', JSON.stringify(d, null, 2));
console.log();
if (d.id) {
  console.log('Email sent! ID:', d.id);
  console.log('Check bonnieprincewill6@gmail.com inbox in 30-60 seconds');
}
