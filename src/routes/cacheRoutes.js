const express = require("express");
const { clearBaseCache } = require("../controllers/CacheController");
const {
  checkAllowedOrigin,
} = require("../middlewares/allowedOriginMiddleware");

const router = express.Router();
router.post("/clear-cache", checkAllowedOrigin, clearBaseCache);

module.exports = router;
