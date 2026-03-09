const asyncHandler = require("express-async-handler");
const axios = require("axios");

// @desc    Search for locations using Nominatim proxy
// @route   GET /api/location/search
// @access  Public
const searchLocations = asyncHandler(async (req, res) => {
    const { q, limit, viewbox, bounded } = req.query;

    if (!q) {
        res.status(400);
        throw new Error("Please add a search query");
    }

    // Nominatim usage policy requires a clear User-Agent and ideally an email.
    // We'll also restrict it to India (countrycodes=in) for Salem cab service context.
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=${limit || 15}&countrycodes=in&addressdetails=1${viewbox ? `&viewbox=${viewbox}&bounded=${bounded || 0}` : ""}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'WeeFly-Cab-App-v1.0 (contact@weeflycab.com; nodejs; axios)',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 5000 // 5 second timeout
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Nominatim Proxy Error:", error.message);
        if (error.response) {
            // The request was made and the server responded with a status code
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
            res.status(error.response.status).json({
                message: "Location service error",
                details: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received from Nominatim");
            res.status(503).json({ message: "Location service unavailable (Timeout)" });
        } else {
            res.status(500).json({ message: "Internal proxy error", error: error.message });
        }
    }
});

module.exports = {
    searchLocations,
};
