const express =require( "express");
const {
 GetArticlesListByClientCategory,
 GetArticlesListByClient,
 GetArticlesListBykidSiteVideo,
 GetArticlesListByACI,
 GetFileContentByType,
 GetSCArticlesImages,
 GetSCRelatedArticles,
} =require( "../controllers/ArticleController");

const router = express.Router();
router.get("/get-articles-list-by-client",GetArticlesListByClient);
router.get("/get-articles-list-by-client-category",GetArticlesListByClientCategory);
router.get("/get-articles-list-by-ksv",GetArticlesListBykidSiteVideo);
router.get("/get-articles-list-by-aci",GetArticlesListByACI);
router.get("/get-articlehtml-by-file-type",GetFileContentByType);
router.get("/get-sc-related-articles",GetSCRelatedArticles);
router.get("/get-sc-images",GetSCArticlesImages);


module.exports =router;
