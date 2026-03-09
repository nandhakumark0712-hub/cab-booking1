const express = require("express");
const router = express.Router();
const { registerDriver, getDrivers, getDriverProfile, updateAvailability } = require("../controllers/driverController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerDriver);
router.get("/", getDrivers); // Keep public for now or protect if needed
router.get("/profile", protect, getDriverProfile);
router.put("/availability", protect, updateAvailability);

module.exports = router;
