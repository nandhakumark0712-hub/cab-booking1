const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        required: true,
    },
    make: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    plateNumber: {
        type: String,
        required: true,
        unique: true,
    },
    color: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["sedan", "suv", "hatchback", "bike", "auto"],
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
