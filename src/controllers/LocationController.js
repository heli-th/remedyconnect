const RESTRESPONSE = require("../utils/RESTRESPONSE");
const { HttpsProxyAgent } = require('https-proxy-agent');
/* BY Google Place Details */
const googlePlaceDetails = async (req, res) => {
    const place_id = req.query.place_id;
    const key = req.query.key;

    if (!place_id && !key) {
        return res.status(404).send(
            RESTRESPONSE(false, "PlaceID AND KEY is required in query parameters")
        );
    }

    try {
        //API CALL
        const proxyUrl = 'https://externalcontent.remedyconnect.com/';
        const agent = new HttpsProxyAgent(proxyUrl);

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?fields=name,rating,user_ratings_total&place_id=${encodeURIComponent(place_id)}&key=${key}`,
            {
                headers: { 'Content-Type': 'application/json' },
                agent
            }
        );
        const data = await response.json();
        if (!data || data.status !== "OK") {
            return res.status(404).send(
                RESTRESPONSE(false, "Failed to fetch location details", { error: data.error_message })
            );
        }
        return res.send(
            RESTRESPONSE(true, "Location Fetched For PlaceID", {
                data: data.result,
            })
        );
    } catch (error) {
        return res.status(500).send(
            RESTRESPONSE(false, "Failed to fetch", { error: error.message })
        );
    }
};



module.exports = {
    googlePlaceDetails,
};