const express = require("express");
const {
  symptomCheckerData,
} = require("../controllers/SymptomCheckerController");

const router = express.Router();
router.get("/symptom-checker", symptomCheckerData);

module.exports = router;
