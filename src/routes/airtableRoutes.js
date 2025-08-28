const express = require("express");
const { getCollectionData, getClientAccount } = require("../controllers/AirtableController");

const router = express.Router();
router.get("/getCollectionData", getCollectionData);
router.get("/getClientAccount", getClientAccount);

module.exports = router;
