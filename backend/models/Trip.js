const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
    },
    pickup: {
        type: String,
        required: true,
    },
    drop: {
        type: String,
        required: true,
    },
    distance: {
        type: Number,
        required: true,
    },
    fare: {
        type: Number,
    },
    city: {
        type: String,
        default: "Salem",
    },
    cabType: {
        type: String,
        default: "mini",
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "ongoing", "completed", "cancelled"],
        default: "pending",
    },
    location: {
        lat: Number,
        lng: Number,
    },
    cancellationReason: {
        type: String,
    },
    refundStatus: {
        type: String,
        enum: ["none", "pending", "completed", "failed"],
        default: "none",
    },
    dispute: {
        reason: String,
        status: {
            type: String,
            enum: ["none", "open", "resolved"],
            default: "none",
        },
        resolution: String,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("Trip", tripSchema);
