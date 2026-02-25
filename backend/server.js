const express = require("express");
const dotenv = require("dotenv");
const dns = require("dns");

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/trip", require("./routes/tripRoutes"));
app.use("/api/driver", require("./routes/driverRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/location", require("./routes/locationRoutes"));

app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use((req, res, next) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

app.use(errorHandler);

// Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*", // More permissive for debugging
        methods: ["GET", "POST"],
    },
});

app.set("socketio", io);

io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id} | Total Clients: ${io.engine.clientsCount}`);

    socket.on("joinDrivers", () => {
        socket.join("drivers");
        console.log(`Socket ${socket.id} joined drivers room`);
    });

    socket.on("leaveDrivers", () => {
        socket.leave("drivers");
        console.log(`Socket ${socket.id} left drivers room`);
    });

    socket.on("joinTrip", (tripId) => {
        socket.join(tripId);
        console.log(`Socket ${socket.id} joined trip room: ${tripId}`);
    });

    socket.on("updateLocation", (data) => {
        // data should contain { tripId, lat, lng }
        if (data.tripId) {
            io.to(data.tripId).emit("locationUpdated", data);
        } else {
            io.emit("updateLocation", data); // Fallback
        }
    });

    socket.on("acceptRide", (data) => {
        // data: { tripId, driverId, driverDetails }
        io.emit(`rideAccepted_${data.tripId}`, data);
    });

    socket.on("tripCompleted", (data) => {
        // data: { tripId }
        io.emit(`rideCompleted_${data.tripId}`, data);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        const PORT = process.env.PORT || 5001;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
