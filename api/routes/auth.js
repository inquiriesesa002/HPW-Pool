const express = require("express");
const router = express.Router();

// Dummy register/login for testing
router.post("/register", (req, res) => {
  res.json({ success: true, message: "Register route working" });
});

router.post("/login", (req, res) => {
  res.json({ success: true, message: "Login route working" });
});

module.exports = router;
