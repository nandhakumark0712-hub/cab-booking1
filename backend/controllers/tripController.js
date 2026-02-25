const asyncHandler = require("express-async-handler");
const Trip = require("../models/Trip");

// @desc    Book a trip
// @route   POST /api/trip/book
// @access  Private
const bookTrip = asyncHandler(async (req, res) => {
    const { pickup, drop, distance } = req.body;

    if (!pickup || !drop || !distance) {
        res.status(400);
        throw new Error("Please add all fields");
    }

    // Retrieve user from token (middleware will add user to req)
    // For now, if no auth middleware, we might fail.
    // Assuming req.user is set by auth middleware.
    // If not, we might need to mock it or handle it.

    // For simplicity if auth not fully set up yet:
    const userId = req.user ? req.user._id : null;

    const trip = await Trip.create({
        user: userId,
        pickup,
        drop,
        distance,
        fare: req.body.fare || 0,
        cabType: req.body.cabType || "mini",
        status: "pending",
    });

    // Notify drivers about the new ride request
    const io = req.app.get("socketio");
    if (io) {
        console.log("Broadcasting new_ride_request for trip:", trip._id);
        console.log("Current connected sockets:", io.engine.clientsCount);

        io.to("drivers").emit("new_ride_request", {
            _id: trip._id,
            id: trip._id, // Send both for compatibility
            pickup,
            drop,
            distance,
            fare: req.body.fare,
            customer: req.user ? req.user.name : "Guest",
            pickupCoords: req.body.pickupCoords,
            dropCoords: req.body.dropCoords
        });
    } else {
        console.log("Socket.IO not found on app, skipping emission.");
    }

    res.status(201).json(trip);
});

// @desc    Update trip status (Accept/Complete/Cancel)
// @route   PUT /api/trip/:id
// @access  Private
const updateTripStatus = asyncHandler(async (req, res) => {
    const { status, driverId } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        res.status(404);
        throw new Error("Trip not found");
    }

    trip.status = status;
    if (driverId) trip.driver = driverId;

    await trip.save();

    const io = req.app.get("socketio");
    if (io) {
        const tripId = trip._id.toString();
        if (status === "accepted") {
            // Populate driver to send details to customer
            const populatedTrip = await Trip.findById(trip._id).populate("driver");
            const driverData = populatedTrip.driver;

            // Fallback for demo users if no real driver exists in DB
            const finalDriverDetails = {
                driverName: driverData ? driverData.name : "Rajesh Kumar",
                rating: driverData ? driverData.rating : 4.8,
                vehicle: driverData ? (driverData.vehicle ? driverData.vehicle.model : "White Maruti Suzuki Swift") : "White Maruti Suzuki Swift"
            };

            console.log(`Backend: Broadcasting rideAccepted for ${tripId} with details:`, finalDriverDetails);
            io.emit(`rideAccepted_${tripId}`, {
                tripId,
                status: "accepted",
                driverId,
                driverDetails: finalDriverDetails
            });
        } else if (status === "cancelled") {
            console.log(`Backend: Broadcasting rideCancelled for ${tripId}`);
            io.emit(`rideCancelled_${tripId}`, { tripId, status: "cancelled" });
        } else if (status === "completed") {
            console.log(`Backend: Broadcasting rideCompleted for ${tripId}`);
            io.emit(`rideCompleted_${tripId}`, { tripId, status: "completed" });
        } else if (status === "ongoing") {
            console.log(`Backend: Broadcasting rideStarted for ${tripId}`);
            io.emit(`rideStarted_${tripId}`, { tripId, status: "ongoing" });
        }
    }

    res.json(trip);
});

// @desc    Get trip by ID
// @route   GET /api/trip/:id
// @access  Private
const getTripById = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id).populate("driver");
    if (trip) {
        // Inject mock driver if trip is accepted but driver record not found in DB
        const tripObj = trip.toObject();
        if ((trip.status === "accepted" || trip.status === "ongoing") && !trip.driver) {
            tripObj.driver = {
                name: "Rajesh Kumar",
                rating: 4.8,
                vehicle: { model: "White Maruti Suzuki Swift" }
            };
        }
        res.json(tripObj);
    } else {
        res.status(404);
        throw new Error("Trip not found");
    }
});

// @desc    Get trip history for a user
// @route   GET /api/trip/history?userId=xxx
// @access  Private
const getTripHistory = asyncHandler(async (req, res) => {
    const { userId } = req.query;

    // Build query: if userId provided, filter by user; otherwise return all completed trips
    const query = {
        status: { $in: ["completed", "cancelled"] },
        ...(userId ? { user: userId } : {})
    };

    const trips = await Trip.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .limit(50);

    res.json(trips);
});

module.exports = {
    bookTrip,
    updateTripStatus,
    getTripById,
    getTripHistory
};
