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
    // For now, use a hardcoded ID if auth is not fully injected, 
    // but try to get it from req.user if available.
    const driverId = req.user ? req.user._id : req.query.id;

    if (!driverId) {
        res.status(400);
        throw new Error("Driver ID required");
    }

    const driver = await Driver.findById(driverId).populate("vehicle");
    if (driver) {
        res.json(driver);
    } else {
        res.status(404);
        throw new Error("Driver not found");
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

module.exports = {
    registerDriver,
    getDrivers,
    getDriverProfile,
    updateAvailability
};
