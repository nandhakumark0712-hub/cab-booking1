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
    pickupCoords: {
        lat: Number,
        lng: Number,
    },
    dropCoords: {
        lat: Number,
        lng: Number,
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
    otp: {
        type: String,
        required: false,
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
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    review: {
        type: String,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("Trip", tripSchema);
