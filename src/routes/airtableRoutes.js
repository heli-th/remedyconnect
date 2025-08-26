const express = require("express");
const { getCollectionData } = require("../controllers/AirtableController");

const router = express.Router();
router.get("/getCollectionData", getCollectionData);

module.exports = router;
