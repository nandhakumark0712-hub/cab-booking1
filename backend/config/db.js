const mongoose = require("mongoose");
const http = require("http");
const https = require("https");
const dotenv = require("dotenv");
const dns = require("dns");

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        // Connect with explicit dbName and stable options
        await mongoose.connect(uri, {
            dbName: "weefly", // Changed from "ridehub" to match user's previous preference in .env
            connectTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 10000,
        });

        const isAtlas = uri.includes("mongodb+srv") || uri.includes("shard");
        const connType = isAtlas ? "MongoDB Atlas (Cloud)" : "MongoDB Compass (Local)";
        console.log(`✅ MongoDB connected successfully to ${connType}`);
        console.log(`📍 Database Name: ${mongoose.connection.name}`);

        // Monitor for pool/connection loss after initial success
        mongoose.connection.on('error', err => {
            console.error('❌ MongoDB Runtime Error:', err.message);
            if (err.message.includes('SSL alert number 80')) {
                console.error('👉 TIP: This error usually means your IP is NOT whitelisted in MongoDB Atlas.');
            }
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected.');
        });

    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);

        if (err.message.includes('SSL alert number 80') || err.message.includes('tls') || err.message.includes('PoolClearedError') || err.message.includes('Could not connect to any servers')) {
            console.error('👉 ACTION REQUIRED: Your IP address may not be whitelisted in MongoDB Atlas.');

            // Attempt to get public IP to help the user
            https.get('https://api.ipify.org', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.error(`📍 Your Current Public IP: ${data}`);
                    console.error('1. Go to Atlas Dashboard -> Network Access');
                    console.error(`2. Add IP: ${data} (or select "Allow Access from Anywhere")`);
                });
            }).on('error', () => {
                console.error('1. Go to Atlas Dashboard -> Network Access');
                console.error('2. Add your current public IP to the whitelist.');
            });
        }
    }
};

module.exports = connectDB;
