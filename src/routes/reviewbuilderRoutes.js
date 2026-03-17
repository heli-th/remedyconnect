const express = require("express");
const {
    addToQueueList,
} = require("../controllers/ReviewBuilder/RBController");

const {
    getClientInfo,
} = require("../controllers/ReviewBuilder/MainController");

const {
    getSourcesList,
    createSource,
    getSourceById,
    updateSource,
    deleteSource,
    getRecordsByDudaId,
} = require("../controllers/ReviewBuilder/RBSourceController");

const router = express.Router();
// RBController routes
router.post("/addToQueueList", addToQueueList);

// Main routes
router.get("/getClientInfo", getClientInfo);

// Review Sources routes
router.get("/getSourcesList", getSourcesList);
router.post("/createSource", createSource);
router.get("/getSourceById/:id", getSourceById);
router.put("/updateSource/:id", updateSource);
router.delete("/deleteSource/:id", deleteSource);
router.get("/getRecordsByDudaId/:dudaId", getRecordsByDudaId);
module.exports = router;