const mongoose = require("mongoose");
const User = require("./models/User");
const dotenv = require("dotenv");
const dns = require("dns");

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const testRegister = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const newUser = {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            role: "user"
        };

        const user = await User.create(newUser);
        console.log("User created:", user);
        process.exit();
    } catch (error) {
        console.error("Registration failed:", error);
        process.exit(1);
    }
};

testRegister();
