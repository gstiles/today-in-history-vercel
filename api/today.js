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


// api/today.js
const axios = require('axios');

const ABSOLUTE_MIN_YEAR = 1;

// ... keep your findFact function as-is ...

module.exports = async function (req, res) {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const dateStr = `${month}/${day}`;

  try {
    const historyRes = await axios.get(
      `https://byabbe.se/on-this-day/${month}/${day}/events.json`,
      { timeout: 12_000 }
    );
    const events = historyRes.data.events || [];
    const usedDescriptions = [];

    // (unchanged) pick facts...
    // -- General facts
    const modernFactEvent = events.find(e => parseInt(e.year, 10) >= 2000 && parseInt(e.year, 10) >= ABSOLUTE_MIN_YEAR);
    const generalFact1 = modernFactEvent ? `${modernFactEvent.year}: ${modernFactEvent.description}` : 'No modern fact found.';
    if (modernFactEvent) usedDescriptions.push(modernFactEvent.description);

    const historicalFactEvent = events.find(e => !usedDescriptions.includes(e.description) && parseInt(e.year, 10) >= ABSOLUTE_MIN_YEAR);
    const generalFact2 = historicalFactEvent ? `${historicalFactEvent.year}: ${historicalFactEvent.description}` : 'No historical fact found.';
    if (historicalFactEvent) usedDescriptions.push(historicalFactEvent.description);

    // -- Category facts
    const artKeywords = ["art","artist","painting","sculpture","music","musician","album","song","opera","theatre","show","release"];
    const scienceKeywords = ["science","scientist","physics","astronomy","discovery","technology","invention","engineer","space","launch","medicine","virus","research"];
    const sportsKeywords = ["sport","sports","game","team","championship","world series","olympic","cup","final","league","race","match","tournament"];

    let factEvent;
    factEvent = findFact(events, artKeywords, 2000, usedDescriptions) || findFact(events, artKeywords, 1, usedDescriptions);
    const artsFact = factEvent ? `${factEvent.year}: ${factEvent.description}` : "No arts/music fact found.";
    if (factEvent) usedDescriptions.push(factEvent.description);

    factEvent = findFact(events, scienceKeywords, 2000, usedDescriptions) || findFact(events, scienceKeywords, 1, usedDescriptions);
    const scienceFact = factEvent ? `${factEvent.year}: ${factEvent.description}` : "No science fact found.";
    if (factEvent) usedDescriptions.push(factEvent.description);

    factEvent = findFact(events, sportsKeywords, 2000, usedDescriptions) || findFact(events, sportsKeywords, 1, usedDescriptions);
    const sportsFact = factEvent ? `${factEvent.year}: ${factEvent.description}` : "No sports fact found.";
    if (factEvent) usedDescriptions.push(factEvent.description);

    // Dad joke with headers + timeout
    const jokeRes = await axios.get("https://icanhazdadjoke.com/", {
      headers: { Accept: "application/json", "User-Agent": "today-in-history (vercel)" },
      timeout: 8_000,
    });
    const dadJoke = jokeRes?.data?.joke ?? "No joke today.";

    res.status(200).json({
      Date: dateStr,
      GeneralFact1: generalFact1,
      GeneralFact2: generalFact2,
      ArtsFact: artsFact,
      ScienceFact: scienceFact,
      SportsFact: sportsFact,
      DadJoke: dadJoke
    });
  } catch (error) {
    console.error("today-in-history error", { message: error?.message, stack: error?.stack });
    // Return 200 with partial info so your email still sends (optional)
    res.status(200).json({
      Date: dateStr,
      GeneralFact1: "Fetch failed; see logs",
      GeneralFact2: "",
      ArtsFact: "",
      ScienceFact: "",
      SportsFact: "",
      DadJoke: ""
    });
  }
};
