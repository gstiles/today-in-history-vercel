const axios = require('axios');

// Updated findFact helper function for strict keyword matching and NO BC DATES
const findFact = (events, keywords, minYear, usedDescriptions) => {
    // Set a strict lower bound to exclude all BC dates
    const ABSOLUTE_MIN_YEAR = 1;

    // Helper to check if an event is relevant, not excluded, and is AD
    const isRelevant = (e, checkKeywords = true) => {
        if (!e.description || usedDescriptions.includes(e.description)) return false;
        if (parseInt(e.year, 10) < ABSOLUTE_MIN_YEAR) return false;

        if (checkKeywords) {
            return keywords.some(keyword => e.description.toLowerCase().includes(keyword));
        }
        return true;
    };

    // 1. Prioritize facts that match keywords AND the specified minimum year (e.g., modern facts >= 2000)
    let fact = events.find(e => {
        return isRelevant(e) && (minYear ? parseInt(e.year, 10) >= minYear : true);
    });

    // 2. If no modern match is found, try to find a fact that matches keywords from ANY AD year
    if (!fact && minYear) {
        fact = events.find(e => {
            // Re-use isRelevant but without the optional minYear
            return isRelevant(e) && (keywords.some(keyword => e.description.toLowerCase().includes(keyword)));
        });
    }

    // STRICT RULE: No fallback to non-keyword facts. If we don't find a relevant fact, return null.
    return fact ? fact : null;
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

        // --- GENERAL FACTS (Strictly AD only, Modern/Historical mix) ---

        // 1. Find a Modern Fact (Year >= 2000 AND Year >= 1)
        const modernFactEvent = events.find(e => parseInt(e.year, 10) >= 2000 && parseInt(e.year, 10) >= 1);
        let generalFact1 = "No modern fact found.";

        if (modernFactEvent) {
            generalFact1 = `${modernFactEvent.year}: ${modernFactEvent.description}`;
            usedDescriptions.push(modernFactEvent.description);
        }

        // 2. Find a Historical/Ancient Fact (First available AD event, not a duplicate)
        const historicalFactEvent = events.find(e => !usedDescriptions.includes(e.description) && parseInt(e.year, 10) >= 1);
        let generalFact2 = "No historical fact found.";

        if (historicalFactEvent) {
            generalFact2 = `${historicalFactEvent.year}: ${historicalFactEvent.description}`;
            usedDescriptions.push(historicalFactEvent.description);
        }

        // --- CATEGORY FACTS (Strictly unique, prioritizing year >= 2000, AD only) ---

        let factEvent;

        // ARTS/MUSIC FACT
        const artKeywords = ["art", "artist", "painting", "sculpture", "music", "musician", "album", "song", "opera", "theatre", "show", "release"];
        factEvent = findFact(events, artKeywords, 2000, usedDescriptions);
        if (!factEvent) { // Fallback to any AD year if a 2000+ fact wasn't found
            factEvent = findFact(events, artKeywords, 1, usedDescriptions);
        }
        const artsFact = factEvent ? `${factEvent.year}: ${factEvent.description}` : "No arts/music fact found.";
        if (factEvent) usedDescriptions.push(factEvent.description);

        // SCIENCE FACT
        const scienceKeywords = ["science", "scientist", "physics", "astronomy", "discovery", "technology", "invention", "engineer", "space", "launch", "medicine", "virus", "research"];
        factEvent = findFact(events, scienceKeywords, 2000, usedDescriptions);
        if (!factEvent) { // Fallback to any AD year
            factEvent = findFact(events, scienceKeywords, 1, usedDescriptions);
        }
        const scienceFact = factEvent ? `${factEvent.year}: ${factEvent.description}` : "No science fact found.";
        if (factEvent) usedDescriptions.push(factEvent.description);

        // SPORTS FACT
        const sportsKeywords = ["sport", "sports", "game", "team", "championship", "world series", "olympic", "cup", "final", "league", "race", "match", "tournament"];
        factEvent = findFact(events, sportsKeywords, 2000, usedDescriptions);
        if (!factEvent) { // Fallback to any AD year
            factEvent = findFact(events, sportsKeywords, 1, usedDescriptions);
        }
        const sportsFact = factEvent ? `${factEvent.year}: ${factEvent.description}` : "No sports fact found.";
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