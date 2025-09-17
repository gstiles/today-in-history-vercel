const axios = require('axios');

module.exports = async function (req, res) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dateStr = `${month}/${day}`;

    try {
        const historyRes = await axios.get(`https://byabbe.se/on-this-day/${month}/${day}/events.json`);
        const events = historyRes.data.events;

        const generalFacts = events.slice(0, 2).map(e => `${e.year}: ${e.description}`);
        const artsFact = events.find(e => e.description.toLowerCase().includes("art"))?.description || "No arts fact found.";
        const scienceFact = events.find(e => e.description.toLowerCase().includes("science"))?.description || "No science fact found.";
        const sportsFact = events.find(e => e.description.toLowerCase().includes("sport"))?.description || "No sports fact found.";

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
