
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        service: "Term Insurance",
        message: "Welcome to Finora Term Insurance"
    });
});

module.exports = router;
