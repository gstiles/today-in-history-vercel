const axios = require('axios');

// Updated findFact helper function for strict keyword matching and duplicate prevention
const findFact = (events, keywords, minYear, usedDescriptions) => {
    // 1. Prioritize facts that match keywords AND the minimum year (e.g., modern facts)
    let fact = events.find(e => {
        // Must not be a duplicate
        if (usedDescriptions.includes(e.description)) return false;
        // Must have a description
        if (!e.description) return false;
        // Must meet the minimum year
        if (minYear && parseInt(e.year, 10) < minYear) return false;
        // Must contain a keyword
        return keywords.some(keyword => e.description.toLowerCase().includes(keyword));
    });

    // 2. If no modern match is found, try to find a fact that matches keywords from ANY year
    if (!fact && minYear) {
        fact = events.find(e => {
            if (usedDescriptions.includes(e.description)) return false;
            if (!e.description) return false;
            return keywords.some(keyword => e.description.toLowerCase().includes(keyword));
        });
    }

    // IMPORTANT: No final fallback to non-keyword events. If we don't find a relevant fact, we return null.
    return fact ? fact : null; // Return the full event object
};

module.exports = async function (req, res) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dateStr = `${month}/${day}`;

    try {
        const historyRes = await axios.get(`https://byabbe.se/on-this-day/${month}/${day}/events.json`);
        const events = historyRes.data.events;

        let usedDescriptions = [];

        // --- GENERAL FACTS (Modern/Historical mix) ---

        // 1. Find a Modern Fact (Year >= 2000)
        const modernFactEvent = events.find(e => parseInt(e.year, 10) >= 2000);
        let generalFact1 = "No modern fact found.";

        if (modernFactEvent) {
            generalFact1 = `${modernFactEvent.year}: ${modernFactEvent.description}`;
            usedDescriptions.push(modernFactEvent.description);
        }

        // 2. Find a Historical/Ancient Fact (First available, not a duplicate)
        const historicalFactEvent = events.find(e => !usedDescriptions.includes(e.description));
        let generalFact2 = "No historical fact found.";

        if (historicalFactEvent) {
            generalFact2 = `${historicalFactEvent.year}: ${historicalFactEvent.description}`;
            usedDescriptions.push(historicalFactEvent.description);
        }

        // --- CATEGORY FACTS (Strictly unique, prioritizing year >= 2000) ---

        let factEvent;

        // ARTS/MUSIC FACT
        const artKeywords = ["art", "artist", "painting", "sculpture", "music", "musician", "album", "song", "opera", "theatre"];
        factEvent = findFact(events, artKeywords, 2000, usedDescriptions);
        if (!factEvent) { // Fallback to any year if a 2000+ fact wasn't found
            factEvent = findFact(events, artKeywords, null, usedDescriptions);
        }
        const artsFact = factEvent ? factEvent.description : "No arts/music fact found.";
        if (factEvent) usedDescriptions.push(factEvent.description);

        // SCIENCE FACT
        const scienceKeywords = ["science", "scientist", "physics", "astronomy", "discovery", "technology", "invention", "engineer", "space", "launch", "medicine", "virus"];
        factEvent = findFact(events, scienceKeywords, 2000, usedDescriptions);
        if (!factEvent) { // Fallback to any year
            factEvent = findFact(events, scienceKeywords, null, usedDescriptions);
        }
        const scienceFact = factEvent ? factEvent.description : "No science fact found.";
        if (factEvent) usedDescriptions.push(factEvent.description);

        // SPORTS FACT
        const sportsKeywords = ["sport", "sports", "game", "team", "championship", "world series", "olympic", "cup", "final", "league", "race", "match"];
        factEvent = findFact(events, sportsKeywords, 2000, usedDescriptions);
        if (!factEvent) { // Fallback to any year
            factEvent = findFact(events, sportsKeywords, null, usedDescriptions);
        }
        const sportsFact = factEvent ? factEvent.description : "No sports fact found.";
        if (factEvent) usedDescriptions.push(factEvent.description);


        const jokeRes = await axios.get("https://icanhazdadjoke.com/", {
            headers: { Accept: "application/json" }
        });
        const dadJoke = jokeRes.data.joke;

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
        res.status(500).json({ error: "Failed to fetch data", details: error.message });
    }
};