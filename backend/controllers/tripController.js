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
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const trip = await Trip.create({
        user: userId,
        pickup,
        drop,
        pickupCoords: req.body.pickupCoords,
        dropCoords: req.body.dropCoords,
        distance,
        fare: req.body.fare || 0,
        cabType: req.body.cabType || "mini",
        status: "pending",
        otp: otp
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

    if (status === "ongoing") {
        const { otpProvided } = req.body;
        if (trip.otp !== otpProvided) {
            res.status(400);
            throw new Error("Invalid OTP. Cannot start trip.");
        }
    }

    trip.status = status;
    if (driverId) trip.driver = driverId;

    await trip.save();

    const io = req.app.get("socketio");
    if (io) {
        const tripId = trip._id.toString();
        if (status === "accepted") {
            // Populate driver to send details to customer, including vehicle
            const populatedTrip = await Trip.findById(trip._id).populate({
                path: "driver",
                populate: { path: "vehicle" }
            });
            const driverData = populatedTrip.driver;

            const finalDriverDetails = {
                driverName: driverData ? driverData.name : "Driver",
                phone: driverData ? driverData.phone : "",
                rating: driverData ? driverData.rating : 4.8,
                vehicle: (driverData && driverData.vehicle) ? `${driverData.vehicle.make} ${driverData.vehicle.model}` : "Standard Cab",
                plate: (driverData && driverData.vehicle) ? driverData.vehicle.plateNumber : "TN-01-AB-1234",
                carModel: (driverData && driverData.vehicle) ? `${driverData.vehicle.color} ${driverData.vehicle.make}` : "Cab"
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
            
            // Update driver's total earnings and total trips
            if (trip.driver) {
                const Driver = require("../models/Driver");
                const driver = await Driver.findById(trip.driver);
                if (driver) {
                    const earned = (trip.fare || 0) * 0.8; // 20% commission
                    driver.totalEarnings += earned;
                    driver.walletBalance += earned;
                    driver.totalTrips += 1;
                    await driver.save();
                    console.log(`Backend: Updated driver ${trip.driver} stats. Earned: ${earned}`);
                }
            }
            
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
    const trip = await Trip.findById(req.params.id)
        .populate({
            path: "driver",
            populate: { path: "vehicle" }
        });

    if (trip) {
        // Return a cleaner object if needed, or just the populated trip
        const data = trip.toObject();
        if (data.driver && typeof data.driver === 'object') {
            const drv = data.driver;
            data.driverDetails = {
                driverName: drv.name,
                phone: drv.phone,
                rating: drv.rating,
                vehicle: drv.vehicle ? `${drv.vehicle.make} ${drv.vehicle.model}` : "Cab",
                plate: drv.vehicle ? drv.vehicle.plateNumber : "",
                carModel: drv.vehicle ? `${drv.vehicle.color} ${drv.vehicle.make}` : "Cab"
            };
        }
        res.json(data);
    } else {
        res.status(404);
        throw new Error("Trip not found");
    }
});

// @desc    Get trip history for a user
// @route   GET /api/trip/history?userId=xxx
// @access  Private
const getTripHistory = asyncHandler(async (req, res) => {
    // If we're using protect middleware, req.user will be set.
    // We should strictly use req.user._id to ensure they only see their own trips.
    if (!req.user) {
        res.status(401);
        throw new Error("User not found or not authorized");
    }

    const userId = req.user._id;

    // For the 'History' page, we typically show completed and cancelled.
    // However, to ensure the user sees 'data' (if they only have active rides),
    // let's fetch all statuses or at least a wider range.
    const query = { user: userId };

    const trips = await Trip.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .limit(50);

    console.log(`Backend: Found ${trips.length} historical trips for user ${userId}`);
    res.json(trips);
});

// @desc    Submit feedback for a trip
// @route   POST /api/trip/:id/feedback
// @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
    const { rating, review } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        res.status(404);
        throw new Error("Trip not found");
    }

    trip.rating = rating;
    trip.review = review;
    await trip.save();

    // Optionally update driver's average rating here
    if (trip.driver) {
        const reviews = await Trip.find({ driver: trip.driver, rating: { $exists: true } });
        const avgRating = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;
        const Driver = require("../models/Driver");
        await Driver.findByIdAndUpdate(trip.driver, { rating: parseFloat(avgRating.toFixed(1)) });
    }

    res.json({ message: "Feedback submitted successfully" });
});

// @desc    Get trip history for a driver
// @route   GET /api/trip/driver-history
// @access  Private
const getDriverTripHistory = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error("Not authorized");
    }

    const trips = await Trip.find({ driver: req.user._id })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(50);

    res.json(trips);
});

// @desc    Get active trip for current user/driver
// @route   GET /api/trip/active
// @access  Private
const getActiveTrip = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error("Not authorized");
    }

    const userId = req.user._id;
    const role = req.user.role;

    let query = {};
    if (role === 'driver') {
        query = { driver: userId, status: { $in: ['accepted', 'ongoing'] } };
    } else {
        query = { user: userId, status: { $in: ['pending', 'accepted', 'ongoing'] } };
    }

    const trip = await Trip.findOne(query)
        .populate({
            path: "driver",
            populate: { path: "vehicle" }
        })
        .sort({ createdAt: -1 });

    if (trip) {
        const data = trip.toObject();
        if (data.driver && typeof data.driver === 'object') {
            const drv = data.driver;
            data.driverDetails = {
                driverName: drv.name,
                phone: drv.phone,
                rating: drv.rating,
                vehicle: drv.vehicle ? `${drv.vehicle.make} ${drv.vehicle.model}` : "Cab",
                plate: drv.vehicle ? drv.vehicle.plateNumber : "",
                carModel: drv.vehicle ? `${drv.vehicle.color} ${drv.vehicle.make}` : "Cab"
            };
        }
        res.json(data);
    } else {
        res.json(null);
    }
});

module.exports = {
    bookTrip,
    updateTripStatus,
    getTripById,
    getTripHistory,
    submitFeedback,
    getDriverTripHistory,
    getActiveTrip
};
