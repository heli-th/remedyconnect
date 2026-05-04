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
const { fetchConfigsByDudaId, updateConfigsByDudaId, getTimeZonesList } = require("../controllers/ReviewBuilder/RBConfigsController");
const { getQueueSummaryBySiteId, getQueueRecordsBySiteId, getClientMessageSummaryBySiteId, getClientRatingsSummaryBySiteId, getRatingSummary } = require("../controllers/ReviewBuilder/DashboardConroller");

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

router.get("/getTimeZonesList", getTimeZonesList);
router.get("/getConfigsByDudaId/:dudaId", fetchConfigsByDudaId);
router.put("/updateConfigsByDudaId/:dudaId", updateConfigsByDudaId);

/* Dashboard Routes */
router.get("/getQueueSummaryBySiteId/:dudaId", getQueueSummaryBySiteId);
router.get("/getQueueRecordsBySiteId/:dudaId", getQueueRecordsBySiteId);
router.get("/getClientMessageSummaryBySiteId/:dudaId", getClientMessageSummaryBySiteId);
router.get("/getClientRatingsSummaryBySiteId/:dudaId", getClientRatingsSummaryBySiteId);
router.get("/getRatingSummary/:dudaId", getRatingSummary);

module.exports = router;