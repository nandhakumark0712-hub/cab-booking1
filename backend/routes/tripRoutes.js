const express = require("express");
const router = express.Router();
const { bookTrip, updateTripStatus, getTripById, getTripHistory } = require("../controllers/tripController");

router.post("/book", bookTrip);
router.get("/history", getTripHistory);  // Must be before /:id
router.get("/:id", getTripById);
router.put("/:id", updateTripStatus);

module.exports = router;
