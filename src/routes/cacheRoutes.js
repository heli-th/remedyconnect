const express = require("express");
const { clearBaseCache } = require("../controllers/CacheController");

const router = express.Router();
router.post("/clear-cache", clearBaseCache);

module.exports = router;
