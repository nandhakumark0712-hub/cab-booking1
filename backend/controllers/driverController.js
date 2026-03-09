const asyncHandler = require("express-async-handler");
const Driver = require("../models/Driver");

// @desc    Register a new driver
// @route   POST /api/driver/register
// @access  Public
const registerDriver = asyncHandler(async (req, res) => {
    const { name, email, password, vehicle } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please add all fields");
    }

    const driverExists = await Driver.findOne({ email });

    if (driverExists) {
        res.status(400);
        throw new Error("Driver already exists");
    }

    const driver = await Driver.create({
        name,
        email,
        password,
        vehicle
    });

    if (driver) {
        res.status(201).json({
            _id: driver.id,
            name: driver.name,
            email: driver.email,
        });
    } else {
        res.status(400);
        throw new Error("Invalid driver data");
    }
});

// @desc    Get all drivers
// @route   GET /api/driver
// @access  Public
const getDrivers = asyncHandler(async (req, res) => {
    const drivers = await Driver.find({}).select("-password");
    res.json(drivers);
});

// @desc    Get driver profile/stats
// @route   GET /api/driver/profile
// @access  Private
const getDriverProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, no user found");
    }

    let driver = await Driver.findById(req.user._id)
        .select("-password")
        .populate("vehicle");

    // Safety: If user is a driver but No profile exists, create it now
    if (!driver && req.user.role === "driver") {
        console.log(`Driver: Creating missing profile for ${req.user.email} on profile fetch`);
        driver = await Driver.create({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            password: req.user.password, // hashed
            phone: req.user.phone || ""
        });
        // Refetch to get clean object
        driver = await Driver.findById(req.user._id).select("-password").populate("vehicle");
    }

    if (driver) {
        res.json(driver);
    } else {
        res.status(404);
        throw new Error("Driver profile not found. Are you logged in as a driver?");
    }
});

// @desc    Update driver availability
// @route   PUT /api/driver/availability
// @access  Private
const updateAvailability = asyncHandler(async (req, res) => {
    const { isAvailable } = req.body;
    const driverId = req.user ? req.user._id : req.body.id;

    const driver = await Driver.findByIdAndUpdate(
        driverId,
        { isAvailable },
        { new: true }
    );

    if (driver) {
        res.json({ isAvailable: driver.isAvailable });
    } else {
        res.status(404);
        throw new Error("Driver not found");
    }
});

// @desc    Get driver reviews
// @route   GET /api/driver/reviews
// @access  Private
const getDriverReviews = asyncHandler(async (req, res) => {
    const Trip = require("../models/Trip");
    const reviews = await Trip.find({ 
        driver: req.user._id, 
        review: { $exists: true, $ne: "" } 
    }).select("rating review createdAt customer name")
    .populate("user", "name")
    .sort({ createdAt: -1 });

    res.json(reviews);
});

module.exports = {
    registerDriver,
    getDrivers,
    getDriverProfile,
    updateAvailability,
    getDriverReviews
};
