const asyncHandler = require("express-async-handler");
// const Payment = require("../models/Payment");

// @desc    Process payment
// @route   POST /api/payment/process
// @access  Private
const processPayment = asyncHandler(async (req, res) => {
    const { amount, paymentMethod, tripId } = req.body;

    if (!amount || !paymentMethod || !tripId) {
        res.status(400);
        throw new Error("Please add all fields");
    }

    // Mock payment processing
    // In a real app, you'd integrate Stripe/PayPal here

    const payment = {
        trip: tripId,
        amount,
        paymentMethod,
        status: "completed",
        transactionId: "TXN_" + Date.now()
    };

    // await Payment.create(payment);

    res.status(201).json(payment);
});

module.exports = {
    processPayment,
};
