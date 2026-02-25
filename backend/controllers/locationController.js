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

    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=${limit || 15}&countrycodes=in&addressdetails=1`;
    if (viewbox) {
        url += `&viewbox=${viewbox}&bounded=${bounded || 0}`;
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'WeeFly Cab App (contact@weeflycab.com)'
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Nominatim Proxy Error:", error.message);
        res.status(500).json({
            message: "Error fetching location data",
            error: error.message
        });
    }
});

module.exports = {
    searchLocations,
};
