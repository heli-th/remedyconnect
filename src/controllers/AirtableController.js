const {
  fetchAirtableView,
  fetchClientAccount,
  fetchUnReviewedArticles,
  createAirtableRecords,
  fetchCollectionDataWithFilters,
  createSlugFromTitleAndId,
} = require("../services/AirtableService");
const RESTRESPONSE = require("../utils/RESTRESPONSE");

const getCollectionData = async (req, res) => {
  const { base, tableName, viewName } = req.query;
  const useCache = req.query.useCache !== "false";

  if (!base)
    return res.status(400).send(RESTRESPONSE(false, "base is required"));
  if (!tableName)
    return res.status(400).send(RESTRESPONSE(false, "tableName is required"));

  try {
    const data = await fetchAirtableView(
      base,
      tableName,
      viewName || "Grid view",
      useCache
    );
    res.send(RESTRESPONSE(true, "Data fetched", { data }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const getClientAccount = async (req, res) => {
  const { base } = req.query;

  if (!base)
    return res.status(400).send(RESTRESPONSE(false, "base is required"));
  try {
    const data = await fetchClientAccount(base);
    res.send(RESTRESPONSE(true, "Data fetched", { data }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const getUnReviewedArticles = async (req, res) => {
  const { base } = req.query;

  if (!base)
    return res.status(400).send(RESTRESPONSE(false, "base is required"));

  try {
    const data = await fetchUnReviewedArticles(base);
    res.send(RESTRESPONSE(true, "Data fetched", { data }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const postCollectionData = async (req, res) => {
  const { base, tableName, records, viewName } = req.body;

  if (!base)
    return res.status(400).send(RESTRESPONSE(false, "base is required"));
  if (!tableName)
    return res.status(400).send(RESTRESPONSE(false, "tableName is required"));
  if (!records || !Array.isArray(records) || records.length === 0)
    return res
      .status(400)
      .send(RESTRESPONSE(false, "records must be a non-empty array"));

  try {
    const data = await createAirtableRecords(
      base,
      tableName,
      viewName || "Grid view",
      records
    );
    res.send(RESTRESPONSE(true, "Articles added", { data }));
  } catch (error) {
    res.status(500).send(RESTRESPONSE(false, error.message));
  }
};

const getCollectionDataWithFilters = async (req, res) => {
  const { base, tableName, viewName, masterArticleId, updateType } = req.query;
  const useCache = req.query.useCache !== "false";

  if (!base)
    return res.status(400).send(RESTRESPONSE(false, "base is required"));
  if (!tableName)
    return res.status(400).send(RESTRESPONSE(false, "tableName is required"));

  try {
    const data = await fetchCollectionDataWithFilters(
      base,
      tableName,
      viewName || "Grid view",
      masterArticleId,
      updateType,
      useCache
    );
    res.send(RESTRESPONSE(true, "Data fetched", { data }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const getAdvocareIntranetData = async (req, res) => {
  const { base, tableName, viewName } = req.query;
  const useCache = req.query.useCache !== "false";

  if (!base)
    return res.status(400).send(RESTRESPONSE(false, "base is required"));
  if (!tableName)
    return res.status(400).send(RESTRESPONSE(false, "tableName is required"));

  const token_to_use = process.env.ADVOCARE_INTRANET_TOKEN;

  try {
    const data = await fetchAirtableView(
      base,
      tableName,
      viewName || "Grid view",
      useCache,
      token_to_use
    );
    res.send(RESTRESPONSE(true, "Data fetched", { data, length: data.length }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

const getAAPArticles = async (req, res) => {
  const { base, tableName, viewName } = req.query;
  const useCache = req.query.useCache !== "false";

  if (!base)
    return res.status(400).send(RESTRESPONSE(false, "base is required"));
  if (!tableName)
    return res.status(400).send(RESTRESPONSE(false, "tableName is required"));

  try {
    const data = await fetchAirtableView(
      base,
      tableName,
      viewName || "Grid view",
      useCache
    );

    const responseData = data.map((record) => ({
      ...record,
      fields: {
        ...record.fields,
        "Version URL":
          record.fields["Version URL"] ||
          createSlugFromTitleAndId(record.fields["Article Name"], record.id),
      },
    }));

    res.send(RESTRESPONSE(true, "Data fetched", { responseData }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

module.exports = {
  getCollectionData,
  getClientAccount,
  getUnReviewedArticles,
  postCollectionData,
  getCollectionDataWithFilters,
  getAdvocareIntranetData,
  getAAPArticles,
};
