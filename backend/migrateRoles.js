const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for migration");

        // Force access to the model even if it's not registered yet
        const db = mongoose.connection.db;
        const usersCollection = db.collection("users");

        const result = await usersCollection.updateMany(
            { role: "customer" },
            { $set: { role: "rider" } }
        );

        console.log(`Migration Complete: ${result.modifiedCount} users updated from 'customer' to 'rider'`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
