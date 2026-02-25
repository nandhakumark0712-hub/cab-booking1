const connectDB = require("./config/db");
const dotenv = require("dotenv");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const test = async () => {
    console.log("Starting connection test with detailed logging...");
    await connectDB();
    console.log("Test finished.");
    process.exit(0);
};

test();
