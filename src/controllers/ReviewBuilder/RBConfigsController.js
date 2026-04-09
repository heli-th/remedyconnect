const Airtable = require("airtable");
const RESTRESPONSE = require("../../utils/RESTResponse");

const airbase = new Airtable({
  apiKey: process.env.REVIEWBUILDER_AIRTABLE_API_KEY,
}).base(process.env.REVIEWBUILDER_BASE_AIRTABLE_ID);

// Table names
const TABLES = {
  CLIENT_MASTER: "Client Master",
  CLIENT_DETAILS: "Clients-Details",
  SENDING_CONFIGS: "Clients-Sending Config",
  AUTOMATION_CONFIGS: "Clients-Automation Config",
  TIME_ZONES: "Timezones",
};

// -----------------------------
// Field Mapping (ONLY RETURN THESE)
// -----------------------------
const TABLE_FIELDS = {
  [TABLES.CLIENT_MASTER]: [
    "Duda ID",
    "Account",
    "Client Name",
    "Details Ref",
    "Sending Configs Ref",
    "Automation Configs Ref",
    "Time Zone",
    "Review Builder Basic",
    "Source By",
    "Auto Approve Ratings",
    "Notification Emails",
  ],
  [TABLES.CLIENT_DETAILS]: [
    "Client Name",
    "Is Sourced By Phone",
    "Purchased Twilio Numbers",
    "Is Sourced By Email",
    "From Email Address",
    "DudaId",
    "Review Builder Basic",
  ],
  [TABLES.SENDING_CONFIGS]: [
    "Identifier",
    "Type",
    "Valid Start Time",
    "Valid End Time",
    "Timezone",
  ],
  [TABLES.TIME_ZONES]: [
    "Display Name",
    "IANA ID",
    "Active",
  ],
};

// -----------------------------
// Generic Helpers
// -----------------------------

/**
 * Pick only allowed fields from Airtable record
 */
const pickFields = (fields = {}, allowedFields = []) => {
  return allowedFields.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      acc[key] = fields[key];
    }
    return acc;
  }, {});
};

/**
 * Convert Airtable record to clean JSON with selective columns
 */
const formatRecord = (record, tableName) => {
  if (!record) return null;

  return {
    id: record.id,
    ...pickFields(record.fields, TABLE_FIELDS[tableName] || []),
  };
};

/**
 * Fetch a single record by record ID
 */
const fetchRecordById = async (tableName, recordId) => {
  if (!recordId) return null;

  try {
    const record = await airbase(tableName).find(recordId);
    return formatRecord(record, tableName);
  } catch (error) {
    console.error(`Error fetching record ${recordId} from ${tableName}:`, error.message);
    return null;
  }
};

/**
 * Fetch multiple linked records by IDs
 */
const fetchLinkedRecords = async (tableName, recordIds = []) => {
  if (!Array.isArray(recordIds) || recordIds.length === 0) return [];

  const results = await Promise.all(
    recordIds.map((id) => fetchRecordById(tableName, id))
  );

  return results.filter(Boolean);
};

/**
 * Fetch first linked record only (useful for single-link fields)
 */
const fetchSingleLinkedRecord = async (tableName, recordIds = []) => {
  if (!Array.isArray(recordIds) || recordIds.length === 0) return null;
  return fetchRecordById(tableName, recordIds[0]);
};

// -----------------------------
// Main API
// -----------------------------
const fetchClientByDudaId = async (dudaId) => {
  try {
    const records = await airbase(TABLES.CLIENT_MASTER)
      .select({
        filterByFormula: `{Duda ID} = "${dudaId}"`,
        maxRecords: 1,
      })
      .all();

    return records || [];
  } catch (error) {
    console.error("Airtable fetch error:", error);
    throw error;
  }
};

/**
 * GET /getConfigsByDudaId/:dudaId
 */
const fetchConfigsByDudaId = async (req, res) => {
  try {
    const { dudaId } = req.params;

    if (!dudaId) {
      return res
        .status(400)
        .json(RESTRESPONSE(false, "Duda ID is required"));
    }

    // Find client record by Duda ID
    const records = await fetchClientByDudaId(dudaId);

    if (!records || records.length === 0) {
      return res
        .status(404)
        .json(RESTRESPONSE(false, "No client config found for provided Duda ID"));
    }

    const clientRecord = formatRecord(records[0], TABLES.CLIENT_MASTER);

    // Fetch linked records in parallel
    const [
      detailsRef,
      sendingConfigs,
      timeZone,
    ] = await Promise.all([
      fetchSingleLinkedRecord(TABLES.CLIENT_DETAILS, clientRecord["Details Ref"]),
      fetchLinkedRecords(TABLES.SENDING_CONFIGS, clientRecord["Sending Configs Ref"]),
      fetchSingleLinkedRecord(TABLES.TIME_ZONES, clientRecord["Time Zone"]),
    ]);

    // Final response payload (only selected columns)
    const enrichedData = {
        id: clientRecord.id,
        dudaId: clientRecord["Duda ID"],
        account: clientRecord["Account"],
        clientName: clientRecord["Client Name"],
        reviewBuilderBasic: clientRecord["Review Builder Basic"],
        sourceBy: clientRecord["Source By"],
        autoApproveRatings: clientRecord["Auto Approve Ratings"],
        notificationEmails: clientRecord["Notification Emails"],
        linkedRecords: {
            details: detailsRef,
            sendingConfigs,
            timeZone,
        },
    };

    return res.status(200).json(
      RESTRESPONSE(true, "Client config fetched successfully", enrichedData)
    );
  } catch (error) {
    console.error("fetchConfigsByDudaId error:", error);

    return res.status(500).json(
      RESTRESPONSE(false, "Failed to fetch client config", {
        error: error.message,
      })
    );
  }
};

module.exports = {
  fetchConfigsByDudaId,
};