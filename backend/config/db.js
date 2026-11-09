
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Check database connection
pool.connect()
    .then(client => {
        console.log("Finora PostgreSQL Database Connected!");

        client.release();
    })
    .catch(error => {
        console.error("Database Connection Error:", error.message);
    });

module.exports = pool;
