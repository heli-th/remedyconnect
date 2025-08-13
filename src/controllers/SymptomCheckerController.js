const axios = require("axios");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL
const { getRecordByAccessKey } = require("../utils/airtableAPIs");

const symptomCheckerData = async (req, res) => {
  const { key, slug } = req.query;
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

  // Build cache key based on query params
  const cacheKey = `symptom-checker:${key}:${table}:${view}:${slug || ""}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    res.setHeader("Content-Type", "text/json");
    return res.send(cachedData);
  }

  const urlBase = `https://api.airtable.com/v0/${base}/${encodeURIComponent(
    table
  )}?view=${encodeURIComponent(view)}`;

  let allRecords = [];

  try {
    if (slug) {
      try {
        const filterByFormula = `{Article URL} = '${slug}'`;
        const response = await axios.get(urlBase, {
          headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
          params: {
            filterByFormula,
            maxRecords: 1,
          },
        });
        if (response.data.records && response.data.records.length > 0) {
          const record = response.data.records[0].fields;
          // Helper function to safely render HTML fields
          const safe = (val) => val || "";
          // Helper for boolean display
          const yesNo = (val) =>
            val === true ? "Yes" : val === false ? "No" : "";
          // Helper for array display
          const arr = (val) =>
            Array.isArray(val) ? val.join(", ") : val || "";
          let html = "";
          // Conditionally render Go Back button
          const goBackBtn = `<button id="go-back-btn" class="go-back-btn">&larr; Go Back</button>`;
          // console.log("Publisher:", safe(record["Publisher"]));

          cache.set(cacheKey, `<body>${record["Article HTML"]}</body>`);

          res.setHeader("Content-Type", "text/html");
          return res.send(`<body>${record["Article HTML"]}</body>`);
        } else {
          return res.status(404).send("Article not found.");
        }
      } catch (err) {
        return res.status(500).send("Failed to load article detail.");
      }
    }
    const response = await axios.get(urlBase, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
    });
    const data = response.data;
    if (data.records && data.records.length > 0) {
      allRecords.push(...data.records);
    }

    cache.set(cacheKey, allRecords);

    res.setHeader("Content-Type", "text/json");
    res.send(allRecords);
  } catch (err) {
    res.status(500).send("Failed to load widget.");
  }
};

module.exports = {
  symptomCheckerData,
};
