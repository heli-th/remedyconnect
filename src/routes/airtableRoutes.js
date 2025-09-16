const express = require("express");
const {
  getCollectionData,
  getClientAccount,
  getUnReviewedArticles,
  postCollectionData,
} = require("../controllers/AirtableController");
const {
  checkAllowedOrigin,
} = require("../middlewares/allowedOriginMiddleware");

const router = express.Router();
router.get("/getCollectionData", checkAllowedOrigin, getCollectionData);
router.get("/getClientAccount", checkAllowedOrigin, getClientAccount);
router.get("/getUnReviewedArticles", checkAllowedOrigin, getUnReviewedArticles);
router.post("/createCollectionData", checkAllowedOrigin, postCollectionData);

module.exports = router;
