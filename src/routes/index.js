const express = require("express");
const router = express.Router();
const baseCheckRoutes = require("./baseCheckRoutes");
const checkAllowedOrigin = require("../middlewares/allowedOriginMiddleware");

router.use("/", checkAllowedOrigin, baseCheckRoutes);

module.exports = router;
