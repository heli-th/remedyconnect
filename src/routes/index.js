const express = require("express");
const router = express.Router();
const articleRoutes = require("./articleRoutes");
const airtableRoutes = require("./airtableRoutes");
const locationRoutes = require("./locationRoutes");
const codeRoutes = require("./codeRoutes");
const symptomCheckerRoutes = require("./symptomCheckerRoute");
const kidsSiteVideoRouter = require("./kidsSiteVideoRouter");
const cacheRoutes = require("./cacheRoutes");

// Article routes
router.use("/articles", articleRoutes);

router.use("/", airtableRoutes);

// Location routes
router.use("/location", locationRoutes);

// Code routes
router.use("/code", codeRoutes);

// Symptom checker routes
router.use("/", symptomCheckerRoutes);

// Kids site video routes
router.use("/", kidsSiteVideoRouter);

// Cache routes
router.use("/", cacheRoutes);

module.exports = router;
