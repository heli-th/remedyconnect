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

const fetchClientAccount = async (base) => {
  const CLIENT_ACCOUNT = `https://api.airtable.com/v0/${base}/Client%20Account`;
  const viewName = "client_account";
  let data;
  // Build cache key based on query params
  const cacheKey = `ClientAccount:${base}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(CLIENT_ACCOUNT, {
      headers: {
        Authorization: "Bearer " + TOKEN,
        "Content-Type": "application/json",
      },
    });

    data = response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`Status code 429 hit for ${base}. Using cache.`);
      const cached = readFromCache(base, viewName);
      if (cached) return cached;
      throw new Error("Rate limit hit and no cache available.");
    }

    throw new Error(`Failed to fetch: ${error.message}`);
  }

  /**set Node cache */
  setCache(cacheKey, data);
  /**set json cache */
  saveToCache(base, viewName, data);
  return data.records;
};

const fetchUnReviewedArticles = async (baseId) => {
  const ARTICLE_PATH = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    "Articles"
  )}?view=${encodeURIComponent("Grid view")}`;

  // Build cache key based on query params
  const cacheKey = `UnReviewedArticleCache:${baseId}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  let offset = "";
  let articles = [];
  let fetches = 0;
  let filterByFormula = `{Client Reviewed} = 0`;

  while (offset !== "done" && fetches < MAX_FETCHES) {
    let url = ARTICLE_PATH;
    if (offset) url += `&offset=${offset}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: "Bearer " + TOKEN,
          "Content-Type": "application/json",
        },
        params: { filterByFormula },
      });

      const data = response.data;
      articles.push(...data.records);
      offset = data.offset || "done";
      fetches++;
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn(`Status code 429 hit for ${baseId}. Using cache.`);
        const cached = readFromCache(baseId, "UnReviewedArticles");
        if (cached) return cached;
        throw new Error("Rate limit hit and no cache available.");
      }

      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  /**set Node cache */
  setCache(cacheKey, articles);
  /**set json cache */
  saveToCache(baseId, "UnReviewedArticles", articles);
  return articles;
};

const getAllowedDomains = async (baseId) => {
  const clientAccount = await fetchClientAccount(baseId);
  if (clientAccount && clientAccount.length > 0) {
    const domainsField = clientAccount[0].fields["Allowed Domains"];
    if (domainsField) {
      return domainsField.split(",").map((domain) => domain.trim());
    } else {
      return [];
    }
  }
};

module.exports = {
  fetchAirtableView,
  isBaseThrottle,
  fetchClientAccount,
  fetchUnReviewedArticles,
  getAllowedDomains,
};
