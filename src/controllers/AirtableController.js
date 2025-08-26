const { fetchAirtableView } = require("../services/AirtableService");
const RESTRESPONSE = require("../utils/RESTRESPONSE");

const getCollectionData = async (req, res) => {
  const { base, tableName, viewName } = req.query;

  if (!base)
    return res.status(400).send(RESTRESPONSE(false, "base is required"));
  if (!tableName)
    return res.status(400).send(RESTRESPONSE(false, "tableName is required"));

  try {
    const data = await fetchAirtableView(
      base,
      tableName,
      viewName || "Grid view"
    );
    res.send(RESTRESPONSE(true, "Data fetched", { data }));
  } catch (err) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

module.exports = {
  getCollectionData,
};
