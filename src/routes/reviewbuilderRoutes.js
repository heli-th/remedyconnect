const express = require("express");
const {
    addToQueueList,
} = require("../controllers/ReviewBuilder/RBController");

const router = express.Router();
router.post("/addToQueueList", addToQueueList);
module.exports = router;