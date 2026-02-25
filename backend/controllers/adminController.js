const asyncHandler = require("express-async-handler");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Setting = require("../models/Setting");
const User = require("../models/User");

// @desc    Get dashboard analytics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    const totalRides = await Trip.countDocuments({ status: "completed" });
    const totalRevenue = await Trip.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$fare" } } },
    ]);

    const activeDrivers = await Driver.countDocuments({ isAvailable: true, status: "approved" });
    const pendingApprovals = await Driver.countDocuments({ status: "pending" });

    // Driver performance (top 5 by rating)
    const topDrivers = await Driver.find({ status: "approved" })
        .sort({ rating: -1 })
        .limit(5)
        .select("name rating totalTrips");

    // City-wise stats
    const cityStats = await Trip.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: "$city", rides: { $sum: 1 }, revenue: { $sum: "$fare" } } },
        { $sort: { rides: -1 } }
    ]);

    res.json({
        totalRides,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        activeDrivers,
        pendingApprovals,
        topDrivers,
        cityStats,
    });
});

// @desc    Get all drivers
// @route   GET /api/admin/drivers
// @access  Private/Admin
const getDrivers = asyncHandler(async (req, res) => {
    const drivers = await Driver.find({}).populate("vehicle");
    res.json(drivers);
});

// @desc    Update driver status (Approve/Suspend)
// @route   PUT /api/admin/drivers/:id
// @access  Private/Admin
const updateDriverStatus = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
        res.status(404);
        throw new Error("Driver not found");
    }

    const { status, isVerified } = req.body;

    if (status) driver.status = status;
    if (typeof isVerified === "boolean") driver.isVerified = isVerified;

    await driver.save();
    res.json(driver);
});

// @desc    Get fare settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Setting.findOne();
    if (!settings) {
        settings = await Setting.create({});
    }
    res.json(settings);
});

// @desc    Update fare settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
    let settings = await Setting.findOne();
    if (!settings) {
        settings = new Setting(req.body);
    } else {
        Object.assign(settings, req.body);
    }

    await settings.save();
    res.json(settings);
});

// @desc    Get all trips for monitoring
// @route   GET /api/admin/trips
// @access  Private/Admin
const getTrips = asyncHandler(async (req, res) => {
    const trips = await Trip.find({})
        .populate("user", "name email")
        .populate("driver", "name email")
        .sort("-createdAt");
    res.json(trips);
});

// @desc    Update trip for admin (refunds/disputes)
// @route   PUT /api/admin/trips/:id
// @access  Private/Admin
const updateTripAdmin = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        res.status(404);
        throw new Error("Trip not found");
    }

    const { refundStatus, dispute } = req.body;

    if (refundStatus) trip.refundStatus = refundStatus;
    if (dispute) trip.dispute = { ...trip.dispute, ...dispute };

    await trip.save();
    res.json(trip);
});

// @desc    Get rider reports (aggregated)
// @route   GET /api/admin/reports/riders
// @access  Private/Admin
const getRiderReports = asyncHandler(async (req, res) => {
    const riders = await User.find({ role: "customer" }).select("name email createdAt");

    const reports = await Promise.all(riders.map(async (rider) => {
        const stats = await Trip.aggregate([
            { $match: { user: rider._id, status: "completed" } },
            { $group: { _id: null, totalRides: { $sum: 1 }, totalSpent: { $sum: "$fare" } } }
        ]);

        return {
            _id: rider._id,
            name: rider.name,
            email: rider.email,
            memberSince: rider.createdAt,
            totalRides: stats.length > 0 ? stats[0].totalRides : 0,
            totalSpent: stats.length > 0 ? stats[0].totalSpent : 0,
        };
    }));

    res.json(reports);
});

// @desc    Get driver reports (aggregated)
// @route   GET /api/admin/reports/drivers
// @access  Private/Admin
const getDriverReports = asyncHandler(async (req, res) => {
    const drivers = await Driver.find({ status: "approved" }).populate("vehicle");

    const reports = drivers.map(d => ({
        _id: d._id,
        name: d.name,
        email: d.email,
        rating: d.rating,
        totalTrips: d.totalTrips,
        totalEarnings: d.totalEarnings,
        joiningDate: d.createdAt,
        vehicle: d.vehicle ? `${d.vehicle.make} ${d.vehicle.model}` : "N/A"
    }));

    res.json(reports);
});

module.exports = {
    getDashboardStats,
    getDrivers,
    updateDriverStatus,
    getSettings,
    updateSettings,
    getTrips,
    updateTripAdmin,
    getRiderReports,
    getDriverReports,
};
