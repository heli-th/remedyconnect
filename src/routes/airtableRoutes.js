const express = require("express");
const {
  getCollectionData,
  getClientAccount,
  getUnReviewedArticles,
  postCollectionData,
  getCollectionDataWithFilters,
} = require("../controllers/AirtableController");
const {
  checkAllowedOrigin,
} = require("../middlewares/allowedOriginMiddleware");

const router = express.Router();
router.get("/getCollectionData", checkAllowedOrigin, getCollectionData);
router.get("/getClientAccount", checkAllowedOrigin, getClientAccount);
router.get("/getUnReviewedArticles", checkAllowedOrigin, getUnReviewedArticles);
router.post("/createCollectionData", checkAllowedOrigin, postCollectionData);
router.get(
  "/getCollectionDataWithFilters",
  checkAllowedOrigin,
  getCollectionDataWithFilters
);

module.exports = router;
       