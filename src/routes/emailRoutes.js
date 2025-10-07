const express = require("express");
const {
  sendReviewArticleEmailToClient,
} = require("../controllers/EmailController");

const router = express.Router();
router.post("/reviewArticle", sendReviewArticleEmailToClient);

module.exports = router;
