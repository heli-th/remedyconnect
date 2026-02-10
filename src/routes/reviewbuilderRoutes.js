const express = require("express");
const {
    addToQueueList,
} = require("../controllers/ReviewBuilder/RBController");

const {
    getClientInfo,
} = require("../controllers/ReviewBuilder/MainController");

const router = express.Router();
router.post("/addToQueueList", addToQueueList);

router.get("/getClientInfo", getClientInfo);
module.exports = router;