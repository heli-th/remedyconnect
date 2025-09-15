const express = require("express");
const {
  getCollectionData,
  getClientAccount,
  getUnReviewedArticles,
  postCollectionData,
} = require("../controllers/AirtableController");

const router = express.Router();
router.get("/getCollectionData", getCollectionData);
router.get("/getClientAccount", getClientAccount);
router.get("/getUnReviewedArticles", getUnReviewedArticles);
router.post("/createCollectionData", postCollectionData);

module.exports = router;
