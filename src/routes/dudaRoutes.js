const express = require("express");
const {
    uploadKenticoFileOnDuda,
} = require("../controllers/DudaController");

const router = express.Router();
router.post("/kenticoFileUpload", uploadKenticoFileOnDuda);

module.exports = router;