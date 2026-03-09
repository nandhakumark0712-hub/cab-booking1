const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { bookTrip, updateTripStatus, getTripById, getTripHistory, submitFeedback } = require("../controllers/tripController");

router.post("/book", protect, bookTrip);
router.get("/history", protect, getTripHistory);
router.get("/:id", protect, getTripById);
router.put("/:id", protect, updateTripStatus);
router.post("/:id/feedback", protect, submitFeedback);

module.exports = router;
