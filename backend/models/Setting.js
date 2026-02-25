const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
    {
        baseFare: {
            type: Number,
            default: 50,
        },
        perKm: {
            type: Number,
            default: 15,
        },
        perMinute: {
            type: Number,
            default: 2,
        },
        surgeMultiplier: {
            type: Number,
            default: 1.0,
        },
        commissionRate: {
            type: Number,
            default: 20, // 20% commission
        },
        minimumWalletBalance: {
            type: Number,
            default: 200,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Setting", settingSchema);
