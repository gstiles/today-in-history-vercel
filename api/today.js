const axios = require('axios');

// Helper function from previous iteration (kept for robust category searching)
const findFact = (events, keywords, excludedDescriptions) => {
    // 1. Try to find a direct match for the keywords
    let fact = events.find(e => {
        const isExcluded = excludedDescriptions.includes(e.description);
        if (isExcluded) return false;
        
        return keywords.some(keyword => e.description && e.description.toLowerCase().includes(keyword));
    });

    // 2. If no direct match is found, try to find an event that hasn't been used yet
    if (!fact) {
        fact = events.find(e => !excludedDescriptions.includes(e.description));
    }
    
    return fact ? fact.description : null;
};

module.exports = async function (req, res) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dateStr = `${month}/${day}`;

    try {
        const historyRes = await axios.get(`https://byabbe.se/on-this-day/${month}/${day}/events.json`);
        const events = historyRes.data.events;
        
        // --- NEW LOGIC FOR GENERAL FACTS ---
        let generalFacts = [];
        let excludedDescriptions = [];

        // 1. Find a Modern Fact (Year >= 2000)
        const modernFact = events.find(e => parseInt(e.year, 10) >= 2000);
        
        if (modernFact) {
            generalFacts.push(`${modernFact.year}: ${modernFact.description}`);
            excludedDescriptions.push(modernFact.description);
        }

        // 2. Find a Historical/Ancient Fact
        // Get the very first fact, but only if it's not the same as the modern fact
        const historicalFact = events.find(e => e.description !== modernFact?.description);

        if (historicalFact) {
            generalFacts.push(`${historicalFact.year}: ${historicalFact.description}`);
            excludedDescriptions.push(historicalFact.description);
        }
        
        // Ensure we have at least two facts, falling back to original logic if necessary
        const generalFact1 = generalFacts[0] || events.slice(0, 1).map(e => `${e.year}: ${e.description}`)[0] || "No general fact 1 found.";
        const generalFact2 = generalFacts[1] || events.slice(1, 2).map(e => `${e.year}: ${e.description}`)[0] || "No general fact 2 found.";
        
        // --- END NEW LOGIC ---

        // Continue to use robust logic for category facts
        // Note: excludedDescriptions now holds descriptions from both modern and historical facts
        const artsFact = findFact(events, ["art", "artist", "painting", "sculpture"], excludedDescriptions) || "No arts fact found.";
        const scienceFact = findFact(events, ["science", "scientist", "physics", "astronomy", "discovery"], excludedDescriptions) || "No science fact found.";
        const sportsFact = findFact(events, ["sport", "sports", "game", "team", "championship"], excludedDescriptions) || "No sports fact found.";

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
