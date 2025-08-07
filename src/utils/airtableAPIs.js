const axios = require("axios");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

async function getRecordByAccessKey({ base, table, accessKey }) {
  const cacheKey = `accessKey:${base}:${table}:${accessKey}`;
  const cachedRecord = cache.get(cacheKey);
  if (cachedRecord) {
    return cachedRecord;
  }
  const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(
    table
  )}`;
  const filterByFormula = `AND({Access Key For Code Snippet} = '${accessKey}')`;
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
      params: {
        filterByFormula,
        maxRecords: 1,
      },
    });
    if (response.data.records && response.data.records.length > 0) {
      cache.set(cacheKey, response.data.records[0]); // Cache the record
      return response.data.records[0];
    }
    return null;
  } catch (err) {
    console.error("Error fetching record by access key:", err);
    throw err;
  }
}

module.exports = {
  getRecordByAccessKey,
};
