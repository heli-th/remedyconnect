const axios = require("axios");
const RESTRESPONSE = require("../../utils/RESTResponse");
const isEmail = require("validator/lib/isEmail");

const BASE_ID = process.env.REVIEWBUILDER_BASE_AIRTABLE_ID;
const API_KEY = process.env.REVIEWBUILDER_AIRTABLE_API_KEY;

const QUEUE_TABLE = "Queue Manager";
const CLIENT_TABLE = "Clients-Details";

const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

// Axios instance (reusable & configurable)
const airtableClient = axios.create({
  baseURL: AIRTABLE_BASE_URL,
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Airtable allows max 10 records per request
const chunkArray = (array, size = 10) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchClientByDudaId = async (dudaId) => {
  const response = await airtableClient.get(`/${CLIENT_TABLE}`, {
    params: {
      filterByFormula: `{DudaId} = "${dudaId}"`,
    },
  });

  return response?.data?.records ?? [];
};

const addToQueueList = async (req, res) => {
  try {
    const {
      dudaId,
      submittedBy,
      contacts,
      sender,
      message,
      source = "Duda Widget",
    } = req.body;

    // ---------- Validation ----------
    if (!dudaId) {
      return res.status(400).json({ message: "Duda ID is required" });
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ message: "No contacts provided" });
    }

    // ---------- Fetch Client ----------
    const clientRecords = await fetchClientByDudaId(dudaId);

    if (clientRecords.length === 0) {
      return res
        .status(404)
        .json({ message: "Client not found for this Duda ID" });
    }

    const clientName =
      clientRecords[0]?.fields?.["Client Name"] ?? "Unknown Client";

    // ---------- Insert Queue Records ----------
    const batches = chunkArray(contacts, 10);
    let inserted = 0;

    for (const batch of batches) {
      const records = batch.map((contact) => ({
        fields: {
          "Duda Id": dudaId,
          "Submitted By": submittedBy,
          "Send To Number Or Email": contact,
          Sender: sender,
          Message: message,
          Client: clientName,
          "Source Type": isEmail(sender) ? "Email" : "Text",
          Source: source,
        },
      }));

      await airtableClient.post(`/${QUEUE_TABLE}`, { records });

      inserted += records.length;

      // Airtable rate-limit buffer
      await sleep(220);
    }

    return res.send(
      RESTRESPONSE(true, "Data inserted successfully", { inserted })
    );
  } catch (error) {
    console.error(
      "Airtable Error:",
      error.response?.data || error.message
    );

    return res
      .status(500)
      .send(
        RESTRESPONSE(false, "Airtable insert failed", {
          error: error.message,
        })
      );
  }
};

module.exports = {
  addToQueueList,
};
