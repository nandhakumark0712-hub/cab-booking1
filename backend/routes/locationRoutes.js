const express = require("express");
const router = express.Router();
const { searchLocations } = require("../controllers/locationController");

router.get("/search", searchLocations);

module.exports = router;
