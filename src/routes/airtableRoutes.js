const express = require("express");
const {
  getCollectionData,
  getClientAccount,
  getUnReviewedArticles,
} = require("../controllers/AirtableController");

const router = express.Router();
router.get("/getCollectionData", getCollectionData);
router.get("/getClientAccount", getClientAccount);
router.get("/getUnReviewedArticles", getUnReviewedArticles);

module.exports = router;
