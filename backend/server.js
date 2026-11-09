
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/test", (req, res) => {
    res.send("<h1>FINORA BACKEND IS WORKING!</h1>");
});

// Root route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Finora API!",
        status: "Operational"
    });
});

// Import routes
const healthRoutes = require("./routes/healthRoutes");
const loanRoutes = require("./routes/loanRoutes");
const termRoutes = require("./routes/termRoutes");
const enquiryRoutes = require('./routes/enquiryRoutes');
const adminRoutes = require("./routes/adminRoutes");

const pool = require("./config/db");

// Service APIs
app.use("/api/health-insurance", healthRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/term-insurance", termRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use("/api/admin", adminRoutes);

// Start server
const PORT = process.env.PORT || 5000;

// Database connection test
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database"
        );

        res.json({
            success: true,
            message: "Finora database connected successfully!",
            database: result.rows[0].database
        });

    } catch (error) {
        console.error("Database query error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Finora running on http://localhost:${PORT}`);
});
