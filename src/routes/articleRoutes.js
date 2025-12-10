const express = require("express");
const {
  GetArticlesListByClientCategory,
  GetArticlesListByClient,
  GetArticlesListBykidSiteVideo,
  GetArticlesListByACI,
  GetFileContentByType,
  GetSCArticlesImages,
  GetSCRelatedArticles
} = require("../controllers/ArticleController");
const {
  checkAllowedOrigin,
  checkAllowedOriginForGlobalBase,
} = require("../middlewares/allowedOriginMiddleware");

const router = express.Router();
router.get(
  "/get-articles-list-by-client",
  checkAllowedOrigin,
  GetArticlesListByClient
);
router.get(
  "/get-articles-list-by-client-category",
  checkAllowedOrigin,
  GetArticlesListByClientCategory
);
router.get(
  "/get-articles-list-by-ksv",
  checkAllowedOriginForGlobalBase,
  GetArticlesListBykidSiteVideo
);
router.get(
  "/get-articles-list-by-aci",
  checkAllowedOriginForGlobalBase,
  GetArticlesListByACI
);
router.get("/get-articlehtml-by-file-type", GetFileContentByType);
router.get(
  "/get-sc-related-articles",
  checkAllowedOriginForGlobalBase,
  GetSCRelatedArticles
);
router.get(
  "/get-sc-images",
  checkAllowedOriginForGlobalBase,
  GetSCArticlesImages
);

module.exports = router;
