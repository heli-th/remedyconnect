const express =require( "express");
const {
 googlePlaceDetails,
} =require( "../controllers/LocationController");

const router = express.Router();
router.get("/google-place-details",googlePlaceDetails);
 
module.exports =router;
