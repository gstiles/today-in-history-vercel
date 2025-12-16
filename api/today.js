// api/today.js
// "Today in History" serverless function for Vercel
// Uses Vercel's Node runtime Web Fetch signature (no axios required).
// Files under /api are auto-exposed as functions at /api/<filename>. 
// Docs: https://vercel.com/docs/functions/runtimes/node-js

// --- Helper utilities -------------------------------------------------------

/**
 * Fetch with timeout using AbortController (Node 18+).
 * @param {string} url
 * @param {object} options
 * @param {number} timeoutMs
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function containsKeyword(text, keywords) {
  const t = (text || '').toLowerCase();
  return keywords.some(k => t.includes(k));
}

function pickFact(events, keywords, minYear, used) {
  // Prefer events >= minYear; fallback to any year >= 1.
  const prefer = events.find(e => !used.has(e.description) &&
                                  Number(e.year) >= minYear &&
                                  containsKeyword(e.description, keywords));
  if (prefer) return prefer;
  return events.find(e => !used.has(e.description) &&
                          Number(e.year) >= 1 &&
                          containsKeyword(e.description, keywords));
}

function normalize(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

// --- Main handler -----------------------------------------------------------

export default {
  async fetch(request) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const eventsUrl = `https://byabbe.se/on-this-day/${month}/${day}/events.json`;

    const ART_KEYWORDS = [
      'art','artist','painting','sculpture','music','musician','album','song','opera','theatre','theater','show','release','concert'
    ];
    const SCIENCE_KEYWORDS = [
      'science','scientist','physics','astronomy','discovery','technology','invention','engineer','space','launch','medicine','virus','research','chemistry','biology'
    ];
    const SPORTS_KEYWORDS = [
      'sport','sports','game','team','championship','world series','olympic','cup','final','league','race','match','tournament','super bowl','nba','mlb','nfl','fifa'
    ];

    try {
      // Fetch historical events
      const eventsRes = await fetchWithTimeout(eventsUrl, { headers: { 'User-Agent': 'today-in-history-vercel' } }, 12000);
      if (!eventsRes.ok) throw new Error(`Events API ${eventsRes.status}`);
      const eventsData = await eventsRes.json();
      const events = Array.isArray(eventsData?.events) ? eventsData.events : [];

      const used = new Set();

      // General facts
      const modernEvent = events.find(e => Number(e.year) >= 2000);
      const generalFact1 = modernEvent
        ? `${modernEvent.year}: ${normalize(modernEvent.description)}`
        : 'No modern fact found.';
      if (modernEvent) used.add(modernEvent.description);

      const historicalEvent = events.find(e => !used.has(e.description) && Number(e.year) >= 1);
      const generalFact2 = historicalEvent
        ? `${historicalEvent.year}: ${normalize(historicalEvent.description)}`
        : 'No historical fact found.';
      if (historicalEvent) used.add(historicalEvent.description);

      // Category facts
      const artsE = pickFact(events, ART_KEYWORDS, 2000, used) || pickFact(events, ART_KEYWORDS, 1, used);
      const scienceE = pickFact(events, SCIENCE_KEYWORDS, 2000, used) || pickFact(events, SCIENCE_KEYWORDS, 1, used);
      const sportsE = pickFact(events, SPORTS_KEYWORDS, 2000, used) || pickFact(events, SPORTS_KEYWORDS, 1, used);

      const artsFact = artsE ? `${artsE.year}: ${normalize(artsE.description)}` : 'No arts/music fact found.';
      const scienceFact = scienceE ? `${scienceE.year}: ${normalize(scienceE.description)}` : 'No science/technology fact found.';
      const sportsFact = sportsE ? `${sportsE.year}: ${normalize(sportsE.description)}` : 'No sports fact found.';

      // Dad joke
      const jokeRes = await fetchWithTimeout('https://icanhazdadjoke.com/', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'today-in-history-vercel' }
      }, 8000);
      let dadJoke = 'No joke today.';
      if (jokeRes.ok) {
        const jokeData = await jokeRes.json();
        dadJoke = normalize(jokeData?.joke) || dadJoke;
      }

      const payload = {
        Date: `${month}/${day}`,
        GeneralFact1: generalFact1,
        GeneralFact2: generalFact2,
        ArtsFact: artsFact,
        ScienceFact: scienceFact,
        SportsFact: sportsFact,
        DadJoke: dadJoke
      };

      console.log(`[today] ${now.toISOString()} returning payload`);
      return Response.json(payload, { status: 200 });
    } catch (err) {
      console.error('[today] error:', err?.stack || err);
      // Return helpful error JSON so clients (email) still have content
      return Response.json({
        Date: `${month}/${day}`,
        status: 'error',
        message: err?.message || 'Unknown error',
        GeneralFact1: 'Fetch failed; see logs',
        GeneralFact2: '',
        ArtsFact: '',
        ScienceFact: '',
        SportsFact: '',
        DadJoke: ''
      }, { status: 200 });
    }
  }
};
