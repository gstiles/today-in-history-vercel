const axios = require('axios');

// Updated findFact helper function to be more robust
const findFact = (events, keywords, minYear, excludedDescriptions) => {
    // Helper to check if an event is relevant and not excluded
    const isRelevant = (e, checkKeywords = true) => {
        if (excludedDescriptions.includes(e.description)) return false;
        if (!e.description) return false;

        if (checkKeywords) {
            return keywords.some(keyword => e.description.toLowerCase().includes(keyword));
        }
        return true; // No keyword check, just checking exclusion and existence
    };

    // 1. Try to find a direct match for the keywords AND meet the minimum year
    let fact = events.find(e => {
        return isRelevant(e) && (minYear ? parseInt(e.year, 10) >= minYear : true);
    });

    // 2. If no match is found, try to find a direct match without the minimum year
    if (!fact) {
        fact = events.find(e => isRelevant(e));
    }

    // 3. If still no match, and no keywords were specified (shouldn't happen here, but for safety)
    if (!fact && !keywords.length) {
        fact = events.find(e => isRelevant(e, false));
    }

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

        // Array to track ALL fact descriptions used to prevent duplicates
        let usedDescriptions = [];

        // --- GENERAL FACTS (Keeping the Modern/Historical mix) ---

        // 1. Find a Modern Fact (Year >= 2000)
        const modernFactEvent = events.find(e => parseInt(e.year, 10) >= 2000);
        let generalFact1 = "No general fact 1 found.";

        if (modernFactEvent) {
            generalFact1 = `${modernFactEvent.year}: ${modernFactEvent.description}`;
            usedDescriptions.push(modernFactEvent.description);
        }

        // 2. Find a Historical/Ancient Fact
        const historicalFactEvent = events.find(e => !usedDescriptions.includes(e.description));
        let generalFact2 = "No general fact 2 found.";

        if (historicalFactEvent) {
            generalFact2 = `${historicalFactEvent.year}: ${historicalFactEvent.description}`;
            usedDescriptions.push(historicalFactEvent.description);
        }

        // --- CATEGORY FACTS (Prioritize Year >= 2000 and ensure no duplicates) ---

        let factEvent;

        // ARTS/MUSIC FACT
        const artKeywords = ["art", "artist", "painting", "sculpture", "music", "musician", "album", "song"];
        factEvent = findFact(events, artKeywords, 2000, usedDescriptions);
        if (!factEvent) { // Fallback to any year if a 2000+ fact wasn't found
            factEvent = findFact(events, artKeywords, null, usedDescriptions);
        }
        const artsFact = factEvent ? factEvent.description : "No arts fact found.";
        if (factEvent) usedDescriptions.push(factEvent.description);

        // SCIENCE FACT
        const scienceKeywords = ["science", "scientist", "physics", "astronomy", "discovery", "technology", "invention", "engineer"];
        factEvent = findFact(events, scienceKeywords, 2000, usedDescriptions);
        if (!factEvent) { // Fallback to any year
            factEvent = findFact(events, scienceKeywords, null, usedDescriptions);
        }
        const scienceFact = factEvent ? factEvent.description : "No science fact found.";
        if (factEvent) usedDescriptions.push(factEvent.description);

        // SPORTS FACT
        const sportsKeywords = ["sport", "sports", "game", "team", "championship", "world series", "olympic"];
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