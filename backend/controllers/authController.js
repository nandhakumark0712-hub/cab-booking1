const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please add all fields");
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data");
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;
    console.log(`Login attempt for email: ${email}, expected role: ${role}`);

    // Check for user email
    const user = await User.findOne({ email });

    if (!user) {
        console.log(`User not found for email: ${email}`);
        res.status(401);
        throw new Error("Invalid credentials (User not found)");
    }

    // Role Enforcement: Check if user's role matches the login slot used
    if (role && user.role !== role) {
        console.log(`Role mismatch for ${email}: expected ${role}, found ${user.role}`);
        res.status(403);
        throw new Error("Invalid role selected. Please login through correct portal.");
    }

    const isMatch = await user.matchPassword(password);
    console.log(`Password match result for ${email}: ${isMatch}`);

    if (user && isMatch) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } else {
        console.log(`Password mismatch for ${email}`);
        res.status(401);
        throw new Error("Invalid credentials (Password mismatch)");
    }
});

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || "abc12345", {
        expiresIn: "30d",
    });
};

module.exports = {
    registerUser,
    loginUser,
};
