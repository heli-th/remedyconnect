const express = require("express");
const crypto = require("crypto");
const { syncCss } = require("../controllers/ReviewBuilder/RBAirtableCssController");


/**
 * 🔐 Strong Authentication Middleware
 * Uses:
 * - API Key
 * - Timestamp (prevents replay attack)
 * - HMAC signature (optional but strong)
 */
function authenticate(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  const timestamp = req.headers["x-timestamp"];
  const signature = req.headers["x-signature"];

  // Basic API key check
  if (!apiKey || apiKey !== process.env.SYNC_SECRET_KEY) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  // ⏱ Prevent replay attack (5 min window)
  if (!timestamp || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
    return res.status(403).json({
      success: false,
      message: "Request expired",
    });
  }

  // 🔐 Optional: HMAC verification
  if (process.env.ENABLE_SIGNATURE === "true") {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.SYNC_SECRET_KEY)
      .update(timestamp.toString())
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(403).json({
        success: false,
        message: "Invalid signature",
      });
    }
  }

  next();
}

const router = express.Router();
router.post("/synccss", authenticate, syncCss);

module.exports = router;