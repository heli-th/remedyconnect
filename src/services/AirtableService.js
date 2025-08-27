const axios = require("axios");
const { saveToCache, readFromCache } = require("../utils/airtableCache");
const { getCache, setCache } = require("./cacheServices");
require("dotenv").config();
const TOKEN = process.env.AIRTABLE_TOKEN;
const MAX_FETCHES = 1000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAirtableView(baseId, tableName, viewName) {
  const encodedView = encodeURIComponent(viewName);
  const ARTICLE_PATH = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName
  )}?view=${encodedView}`;

  // Build cache key based on query params
  const cacheKey = `airtableCache:${baseId}:${tableName}:${viewName}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  let offset = "";
  let articles = [];
  let fetches = 0;

  while (offset !== "done" && fetches < MAX_FETCHES) {
    let url = ARTICLE_PATH;
    if (offset) url += `&offset=${offset}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: "Bearer " + TOKEN,
          "Content-Type": "application/json",
        },
      });

      const data = response.data;
      articles.push(...data.records);
      offset = data.offset || "done";
      fetches++;

      await delay(250); // avoid hitting rate limit
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn(`Status code 429 hit for ${viewName}. Using cache.`);
        const cached = readFromCache(baseId, viewName);
        if (cached) return cached;
        throw new Error("Rate limit hit and no cache available.");
      }

      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  /**set Node cache */
  setCache(cacheKey, articles);
  /**set json cache */
  saveToCache(baseId, viewName, articles);
  return articles;
}

const isBaseThrottle = async (baseId) => {
  const TEST_PATH = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  try {
    let response = await axios.get(TEST_PATH, {
      headers: {
        Authorization: "Bearer " + TOKEN,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 200) {
      return false;
    }
  } catch (error) {
    if (error.response?.status === 429) {
      return true;
    }
    throw new Error(`Failed to check throttle: ${error.message}`);
  }
};

module.exports = { fetchAirtableView, isBaseThrottle };
