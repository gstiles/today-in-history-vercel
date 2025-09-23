const axios = require('axios');

const findFact = (events, keywords, excludedDescriptions) => {
    // 1. Try to find a direct match for the keywords
    let fact = events.find(e => {
        // Only consider events not already used
        const isExcluded = excludedDescriptions.includes(e.description);
        if (isExcluded) return false;
        
        // Check if the description contains any of the keywords
        return keywords.some(keyword => e.description && e.description.toLowerCase().includes(keyword));
    });

    // 2. If no direct match is found, try to find a fact that hasn't been used yet
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

        const generalFacts = events.slice(0, 2).map(e => `${e.year}: ${e.description}`);
        const excludedDescriptions = generalFacts.map(fact => fact.substring(fact.indexOf(': ') + 2));

        // Use the new helper function to find more reliable facts
        const artsFact = findFact(events, ["art", "artist", "painting", "sculpture"], excludedDescriptions) || "No arts fact found.";
        const scienceFact = findFact(events, ["science", "scientist", "physics", "astronomy", "discovery"], excludedDescriptions) || "No science fact found.";
        const sportsFact = findFact(events, ["sport", "sports", "game", "team", "championship"], excludedDescriptions) || "No sports fact found.";

        const jokeRes = await axios.get("https://icanhazdadjoke.com/", {
            headers: { Accept: "application/json" }
        });
        const dadJoke = jokeRes.data.joke;

        res.status(200).json({
            Date: dateStr,
            GeneralFact1: generalFacts[0] || "No fact found.",
            GeneralFact2: generalFacts[1] || "No fact found.",
            ArtsFact: artsFact,
            ScienceFact: scienceFact,
            SportsFact: sportsFact,
            DadJoke: dadJoke
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data", details: error.message });
    }
};
