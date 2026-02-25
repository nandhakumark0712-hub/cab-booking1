const mongoose = require("mongoose");
const User = require("./models/User");
const dotenv = require("dotenv");
const dns = require("dns");

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

console.log("MONGO_URI:", process.env.MONGO_URI);

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        const users = await User.find({});
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
