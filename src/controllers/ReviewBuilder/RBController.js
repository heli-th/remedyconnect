const { default: axios } = require("axios");
const RESTRESPONSE = require("../../utils/RESTResponse");

const BaseId=process.env.REVIEWBUILDER_BASE_AIRTABLE_ID;
const QueueTable='Queue Manager';

const AIRTABLE_URL = `https://api.airtable.com/v0/${BaseId}/${QueueTable}`;

const headers = {
  Authorization: `Bearer ${process.env.REVIEWBUILDER_AIRTABLE_API_KEY}`,
  "Content-Type": "application/json",
};

// helper: split into batches of 10
const chunkArray = (arr, size = 10) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

const addToQueueList = async (req, res) => {
  try {
    const { client,dudaId,submittedBy,contacts,sender,message, source = "Duda Widget" } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ message: "No contacts provided" });
    }

    const batches = chunkArray(contacts, 10);
    let inserted = 0;

    for (const batch of batches) {
      const records = batch.map((value) => ({
        fields: {
          Client: client,
          "Duda Id": dudaId,
          "Submitted By": submittedBy,
          "Send To Number Or Email": value,
          "Sender": sender,
          "Message": message,
          "Source Type": value.includes("@") ? "Email" : "Sms",
          Source: source,
        },
      }));

      await axios.post(AIRTABLE_URL, { records }, { headers });

      inserted += records.length;

      // Airtable rate limit safety
      await new Promise((r) => setTimeout(r, 220));
    }

    res.send(RESTRESPONSE(true, "Data Inserted", { inserted }));
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send(
      RESTRESPONSE(false, "Airtable insert failed", { error: error.message }),
    );
    // res.status(500).json({ message: "Airtable insert failed" });
  }
};

module.exports = {
  addToQueueList,
};
