const express = require("express");
const {
  getCollectionData,
  getClientAccount,
  getUnReviewedArticles,
  postCollectionData,
  getCollectionDataWithFilters,
  getAdvocareIntranetData,
  getAAPArticles,
  getClientAccessAccountFormAirTableId,
  getClientAccessToken,
} = require("../controllers/AirtableController");
const {
  checkAllowedOrigin,
} = require("../middlewares/allowedOriginMiddleware");
const { getCollectionDataFromGlobalBase } = require("../controllers/ArticleController");

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
router.get(
  "/getAdvocareIntranetData",
  checkAllowedOrigin,
  getAdvocareIntranetData
);
router.get("/getAAPArticles", checkAllowedOrigin, getAAPArticles);
router.get("/getClientAccessAccountFormAirTableId", getClientAccessAccountFormAirTableId);

router.get(
  "/get-collection-data/:base/:publisherName",
  checkAllowedOrigin,
  getCollectionDataFromGlobalBase
);

router.get(
  "/get-client-access-token",
  checkAllowedOrigin,
  getClientAccessToken
);


module.exports = router;
