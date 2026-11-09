
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        service: "Loans",
        message: "Welcome to Finora Loans"
    });
});

module.exports = router;
