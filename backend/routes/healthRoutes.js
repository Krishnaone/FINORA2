
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        service: "Health Insurance",
        message: "Welcome to Finora Health Insurance"
    });
});

module.exports = router;
