const express = require("express");
const { KidsSiteVideo } = require("../controllers/KidsSiteController");

const router = express.Router();
router.get("/kids-site-video", KidsSiteVideo);

module.exports = router;
