const axios = require("axios");
const { getRecordByAccessKey } = require("../utils/airtableAPIs");

const symptomCheckerData = async (req, res) => {
  const { key } = req.query;
  const table = "Articles";
  const view = "Is Your Child Sick";

  if (!key) {
    return res.status(400).send("Missing required parameters: key");
  }

  if (!key) {
    return res
      .status(400)
      .send("Missing required parameter: key for client base");
  }

  if (key !== "appodPMCS4YQxZWGl") {
    const record = await getRecordByAccessKey({
      base: "appodPMCS4YQxZWGl",
      table: "Client Access",
      accessKey: key,
    });
    if (record && typeof record === "object" && !Array.isArray(record)) {
      base = record.fields["AirTable Id"];
      displayInList = record.fields["Display Fields In List"] || []; // Title, Summary, etc.
      // Display Fields In Grid can be different from List, so we keep both
      displayInGrid = record.fields["Display Fields In Grid"] || []; //Title, Summary, etc.
    } else {
      console.log("Invalid Access Key");
    }
  }

  const urlBase = `https://api.airtable.com/v0/${base}/${encodeURIComponent(
    table
  )}?view=${encodeURIComponent(view)}`;

  let allRecords = [];

  try {
    const response = await axios.get(urlBase, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
    });

    const data = response.data;
    if (data.records && data.records.length > 0) {
      allRecords.push(...data.records);
    }

    res.setHeader("Content-Type", "text/json");
    res.send(allRecords);
  } catch (err) {
    res.status(500).send("Failed to load widget.");
  }
};

module.exports = {
  symptomCheckerData,
};
