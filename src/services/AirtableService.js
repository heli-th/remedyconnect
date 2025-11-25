const axios = require("axios");
const { saveToCache, readFromCache } = require("../utils/airtableCache");
const { getCache, setCache } = require("./cacheServices");
require("dotenv").config();
const TOKEN = process.env.AIRTABLE_TOKEN;
const MAX_FETCHES = 1000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAirtableView(
  baseId,
  tableName,
  viewName,
  useCache = true,
  token_to_use = TOKEN
) {
  const encodedView = encodeURIComponent(viewName);
  const ARTICLE_PATH = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName
  )}?view=${encodedView}`;

  // Build cache key based on query params
  const cacheKey = `airtableCache:${baseId}:${tableName}:${viewName}`;
  if (useCache) {
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
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
          Authorization: "Bearer " + token_to_use,
          "Content-Type": "application/json",
        },
      });

      const data = response.data;
      articles.push(...data.records);
      offset = data.offset || "done";
      fetches++;
      token_to_use == TOKEN && (await updateAPIIsLimitExceeded(baseId, false));
      await delay(250); // avoid hitting rate limit
    } catch (error) {
      if (error.response?.status === 429) {
        await updateAPIIsLimitExceeded(baseId, true);
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
      await updateAPIIsLimitExceeded(baseId, false);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 429) {
      await updateAPIIsLimitExceeded(baseId, true);
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
    await updateAPIIsLimitExceeded(base, false);
  } catch (error) {
    if (error.response?.status === 429) {
      await updateAPIIsLimitExceeded(base, true);
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
      await updateAPIIsLimitExceeded(baseId, false);
    } catch (error) {
      if (error.response?.status === 429) {
        await updateAPIIsLimitExceeded(baseId, true);
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
  const clientAccount = await fetchClientAccessAccount(baseId);
  if (clientAccount && clientAccount.length > 0) {
    const domainsField = clientAccount[0].fields["Allowed Domains"];
    if (domainsField) {
      return domainsField.split(",").map((domain) => domain.trim());
    } else {
      return [];
    }
  }
};

const getGlobalBaseAllowedDomains = async () => {
  const GlobalAccount = await fetchGlobalBaseAllowedDomains();
  if (GlobalAccount && GlobalAccount.length > 0) {
    const domainsField = GlobalAccount[0].fields["Allowed Domains"];
    if (domainsField) {
      return domainsField.split(",").map((domain) => domain.trim());
    } else {
      return [];
    }
  }
};

const createAirtableRecords = async (baseId, tableName, viewName, records) => {
  const encodedView = encodeURIComponent(viewName);
  const PATH = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName
  )}?view=${encodedView}`;

  const MAX_BATCH_SIZE = 10; // Adjust batch size as needed
  const batches = [];
  const addedArticles = [];

  /**Create batches */
  for (let i = 0; i < records.length; i += MAX_BATCH_SIZE) {
    batches.push(records.slice(i, i + MAX_BATCH_SIZE));
  }

  for (const batch of batches) {
    try {
      const response = await axios.post(
        PATH,
        { records: batch },
        {
          headers: {
            Authorization: "Bearer " + TOKEN,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Error adding articles: ${response.statusText}`);
      }

      addedArticles.push(...response.data.records);
    } catch (error) {
      throw new Error(`Error adding articles: ${error.message}`);
    }
  }
  return addedArticles;
};

const fetchClientAccessAccount = async (base, globalBase, useCache = true) => {
  const Global_BASE_ID = globalBase ? globalBase : process.env.BASE_AIRTABLE_ID;
  const CLIENT_ACCOUNT = `https://api.airtable.com/v0/${Global_BASE_ID}/${encodeURIComponent(
    "Client Access"
  )}`;

  let filterByFormula = `{AirTable Id} = '${base}'`;

  // Build cache key based on query params
  const cacheKey = `clintAccess:${base}`;
  if (useCache) {
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  let data;
  try {
    const response = await axios.get(CLIENT_ACCOUNT, {
      headers: {
        Authorization: "Bearer " + TOKEN,
        "Content-Type": "application/json",
      },
      params: { filterByFormula },
    });
    data = response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`Status code 429 hit for ${base}. Using cache.`);
      const cached = readFromCache(base, "allowedDomains");
      if (cached) return cached;
      throw new Error("Rate limit hit and no cache available.");
    }
    throw new Error(`Failed to fetch: ${error.message}`);
  }

  /**set Node cache */
  setCache(cacheKey, data.records);
  /**set json cache */
  saveToCache(base, "allowedDomains", data);
  return data.records;
};

const fetchGlobalBaseAllowedDomains = async () => {
  const Global_BASE_ID = process.env.BASE_AIRTABLE_ID;
  const PATH = `https://api.airtable.com/v0/${Global_BASE_ID}/${encodeURIComponent(
    "Global base allowed domains"
  )}`;

  // Build cache key based on query params
  const cacheKey = `allowedDomains:${Global_BASE_ID}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  let data;
  try {
    const response = await axios.get(PATH, {
      headers: {
        Authorization: "Bearer " + TOKEN,
        "Content-Type": "application/json",
      },
    });
    data = response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`Status code 429 hit for ${base}. Using cache.`);
      const cached = readFromCache(base, "allowedDomains");
      if (cached) return cached;
      throw new Error("Rate limit hit and no cache available.");
    }
    throw new Error(`Failed to fetch: ${error.message}`);
  }

  /**set Node cache */
  setCache(cacheKey, data.records);
  /**set json cache */
  saveToCache(Global_BASE_ID, "allowedDomains", data);
  return data.records;
};

const fetchCollectionDataWithFilters = async (
  baseId,
  tableName,
  viewName,
  masterArticleId,
  updateType,
  useCache = true
) => {
  const encodedView = encodeURIComponent(viewName);
  const ARTICLE_PATH = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName
  )}?view=${encodedView}`;

  // Build cache key based on query params
  const cacheKey = `airtableCache:${baseId}:${tableName}:${viewName}:${masterArticleId || ""
    }:${updateType || ""}`;
  if (useCache) {
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  /**apply filters as required */

  let conditions = [];

  if (masterArticleId) {
    conditions.push(`{MasterArticle} = '${masterArticleId}'`);
  }

  if (updateType) {
    conditions.push(`{UpdateType} = '${updateType}'`);
  }

  let filterByFormula = "";
  if (conditions.length > 0) {
    filterByFormula = `AND(${conditions.join(", ")})`;
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
        params: { filterByFormula },
      });

      const data = response.data;
      articles.push(...data.records);
      offset = data.offset || "done";
      fetches++;
      await updateAPIIsLimitExceeded(baseId, false);
    } catch (error) {
      if (error.response?.status === 429) {
        await updateAPIIsLimitExceeded(baseId, true);
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
};

const updateAPIIsLimitExceeded = async (baseId, isExceeded) => {
  const Global_BASE_ID = process.env.BASE_AIRTABLE_ID;
  const TABLE_NAME = "Client Access";

  try {
    /**fetch client account data */
    const clientAccount = await fetchClientAccessAccount(baseId);
    if (Global_BASE_ID === baseId) return; // no need to update for global base
    if (!clientAccount || clientAccount.length === 0) {
      throw new Error("Client account not found.");
    }

    const PATH = `https://api.airtable.com/v0/${Global_BASE_ID}/${encodeURIComponent(
      TABLE_NAME
    )}?view=${encodeURIComponent("Grid view")}`;

    const requestBody = {
      records: [
        {
          id: clientAccount[0].id,
          fields: {
            // ...clientAccount[0].fields,
            "API Notifier Base Limit Exceeded": isExceeded,
          },
        },
      ],
    };
    const updateResponse = await axios.patch(PATH, requestBody, {
      headers: {
        Authorization: "Bearer " + TOKEN,
        "Content-Type": "application/json",
      },
    });
    if (updateResponse.status !== 200) {
      throw new Error(
        `Error updating client access: ${updateResponse.statusText}`
      );
    }
  } catch (error) {
    // throw new Error(`Failed to update client access: ${error.message}`);
    return null;
  }
};

const createSlugFromTitleAndId = (title, id) => {
  const slugBase = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50); // limit length to 50 characters
  return `${slugBase}-${id}`;
};

module.exports = {
  fetchAirtableView,
  isBaseThrottle,
  fetchClientAccount,
  fetchUnReviewedArticles,
  getAllowedDomains,
  createAirtableRecords,
  fetchClientAccessAccount,
  getGlobalBaseAllowedDomains,
  fetchCollectionDataWithFilters,
  createSlugFromTitleAndId,
};
