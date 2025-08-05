const express =require( "express");
const {
    Widget,
} =require( "../controllers/codeSnippetController");

const router = express.Router();
router.get("/code-widget",Widget);
 
module.exports =router;
