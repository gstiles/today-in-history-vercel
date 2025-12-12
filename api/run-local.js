
// Disable SSL verification for local testing (DO NOT use in production)
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const handler = require('./today.js');

// Minimal res mock to capture the output
const res = {
  status: (code) => ({
    json: (data) => {
      console.log('HTTP', code);
      console.log(JSON.stringify(data, null, 2));
    }
  })
};

// Call your handler like Vercel would
handler({}, res).catch(err => {
  console.error('Handler threw:', err);
  process.exit(1);
});