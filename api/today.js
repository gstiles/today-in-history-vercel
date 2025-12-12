
const fs = require('fs');
const https = require('https');

// Dynamically import node-fetch for ESM compatibility
async function fetchWithAgent(url) {
  const fetch = (await import('node-fetch')).default;
  return fetch(url, httpsAgent ? { agent: httpsAgent } : {});
}

// Optional: Load corporate CA only in local environment
let httpsAgent;
if (process.env.NODE_ENV === 'local' && process.env.NODE_EXTRA_CA_CERTS) {
  try {
    const caCert = fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS);
    httpsAgent = new https.Agent({ ca: caCert });
    console.log('✅ Loaded corporate CA for local HTTPS requests.');
  } catch (err) {
    console.error('⚠️ Failed to load corporate CA:', err.message);
  }
}

// Main handler function
module.exports = async function handler(req, res) {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const baseUrl = `https://byabbe.se/on-this-day/${month}/${day}`;

  let facts = {
    Date: `${month}/${day}`,
    GeneralFact1: '',
    GeneralFact2: '',
    ArtsFact: '',
    ScienceFact: '',
    SportsFact: '',
    DadJoke: ''
  };

  try {
    // Fetch events
    const eventsRes = await fetchWithAgent(`${baseUrl}/events.json`);
    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      if (eventsData.events && eventsData.events.length > 0) {
        facts.GeneralFact1 = eventsData.events[0].description || 'No fact found.';
        facts.GeneralFact2 = eventsData.events[1]?.description || 'No second fact found.';
      }
