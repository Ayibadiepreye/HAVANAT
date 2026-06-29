// Decode JWT token to see user info
import jwt from 'jsonwebtoken';

// You need to paste your access token here from localStorage
const token = process.argv[2];

if (!token) {
  console.log('Usage: node decode-token.mjs YOUR_ACCESS_TOKEN');
  console.log('\nTo get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Application/Storage tab');
  console.log('3. Click on Local Storage');
  console.log('4. Look for "havanat-auth"');
  console.log('5. Copy the accessToken value');
  process.exit(1);
}

try {
  const decoded = jwt.decode(token);
  console.log('Decoded JWT token:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (err) {
  console.error('Error decoding token:', err.message);
}
