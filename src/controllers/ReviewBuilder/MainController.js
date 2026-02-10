const { default: axios } = require("axios");
const RESTRESPONSE = require("../../utils/RESTResponse");

const BASE_ID = process.env.REVIEWBUILDER_BASE_AIRTABLE_ID;
const headers = {
  Authorization: `Bearer ${process.env.REVIEWBUILDER_AIRTABLE_API_KEY}`,
};

const TABLES = {
  MASTER: "Client Master",
  DETAILS: "Clients-Details",
  SENDING: "Clients-Sending Config",
  AUTOMATION: "Clients-Automation Config",
  RATING: "Clients-Rating",
  SURVEY: "Clients-Survey",
};

const airtableURL = (table) =>
  `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;

async function fetchByIds(table, ids = []) {
  if (!ids.length) return [];

  const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`;

  const res = await axios.get(airtableURL(table), {
    headers,
    params: { filterByFormula: formula },
  });

  return res.data.records;
}

const getClientInfo = async (req, res) => {
  const { clientId } = req.query;
  const useCache = req.query.useCache !== "false";

//   if (!base)
//     return res.status(400).send(RESTRESPONSE(false, "base is required"));

  try {
    // 1️⃣ Fetch Client Master
   // const formula = `{Duda ID}='${clientId}'`;
    const masterRes = await axios.get(airtableURL(TABLES.MASTER), {
      headers,
       params: {
            filterByFormula: `{Duda ID} = "${clientId}"`
        },
    });
   
    const masters = masterRes.data.records;

    // 2️⃣ Collect Linked IDs
    const collectIds = (field) => masters.flatMap((r) => r.fields[field] || []);
    
    const detailsIds = collectIds("Details Ref");
    const sendingIds = collectIds("Sending Configs Ref");
    const automationIds = collectIds("Automation Configs Ref");
    const ratingIds = collectIds("Ratings");
    const surveyIds = collectIds("Survey");

    // 3️⃣ Fetch Linked Data
    const [details, sending, automation, rating, survey] = await Promise.all([
      fetchByIds(TABLES.DETAILS, detailsIds),
      fetchByIds(TABLES.SENDING, sendingIds),
      fetchByIds(TABLES.AUTOMATION, automationIds),
      fetchByIds(TABLES.RATING, ratingIds),
      fetchByIds(TABLES.SURVEY, surveyIds),
    ]);

    // 4️⃣ Index linked records by ID
    const indexById = (records) =>
      records.reduce((acc, r) => {
        acc[r.id] = r.fields;
        return acc;
      }, {});

    const detailsMap = indexById(details);
    const sendingMap = indexById(sending);
    const automationMap = indexById(automation);
    const ratingMap = indexById(rating);
    const surveyMap = indexById(survey);

    // 5️⃣ Merge Data
    const response = masters.map((client) => ({
      id: client.id,
      ...client.fields,
      details: (client.fields["Details Ref"] || []).map(
        (id) => detailsMap[id],
      ),
      sendingConfig: (client.fields["Sending Configs Ref"] || []).map(
        (id) => sendingMap[id],
      ),
      automationConfig: (client.fields["Automation Configs Ref"] || []).map(
        (id) => automationMap[id],
      ),
      ratings: (client.fields["Ratings"] || []).map(
        (id) => ratingMap[id],
      ),
      surveys: (client.fields["Survey"] || []).map(
        (id) => surveyMap[id],
      ),
    }));
    res.json(response);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch client data" });
  }
};


module.exports = {
  getClientInfo,
};
