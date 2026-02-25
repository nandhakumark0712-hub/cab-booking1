const express = require("express");
const router = express.Router();
const { registerDriver, getDrivers, getDriverProfile, updateAvailability } = require("../controllers/driverController");

router.post("/register", registerDriver);
router.get("/", getDrivers);
router.get("/profile", getDriverProfile);
router.put("/availability", updateAvailability);

module.exports = router;
