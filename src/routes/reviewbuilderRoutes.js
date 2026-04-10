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

const { getRatingsByDudaId, insertRating } = require("../controllers/ReviewBuilder/RBRatingsController");
const { fetchConfigsByDudaId, updateConfigsByDudaId } = require("../controllers/ReviewBuilder/RBConfigsController");

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
router.get("/getRatingsByDudaId/:dudaId", getRatingsByDudaId);
router.post("/insertRating", insertRating);

router.get("/getConfigsByDudaId/:dudaId", fetchConfigsByDudaId);
router.put("/updateConfigsByDudaId/:dudaId", updateConfigsByDudaId);

module.exports = router;