const express = require("express");
const router = express.Router();
const {
    getDashboardStats,
    getDrivers,
    updateDriverStatus,
    getSettings,
    updateSettings,
    getTrips,
    updateTripAdmin,
    getRiderReports,
    getDriverReports,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

// All admin routes are protected and restricted to admin role
router.use(protect);
router.use(admin);

router.get("/stats", getDashboardStats);
router.get("/drivers", getDrivers);
router.put("/drivers/:id", updateDriverStatus);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.get("/trips", getTrips);
router.put("/trips/:id", updateTripAdmin);
router.get("/reports/riders", getRiderReports);
router.get("/reports/drivers", getDriverReports);

module.exports = router;
