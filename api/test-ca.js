
const https = require('https');

const url = 'https://byabbe.se/on-this-day/12/12/events.json';

https.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  if (res.statusCode === 200) {
    console.log('✅ HTTPS request succeeded using trusted CA!');
  } else {
    console.log('⚠️ Unexpected status code:', res.statusCode);
  }

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response snippet:', data.slice(0, 200), '...');
  });
}).on('error', (err) => {
  console.error('❌ HTTPS request failed:', err.message);
});