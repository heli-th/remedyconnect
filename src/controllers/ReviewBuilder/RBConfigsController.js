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

const isValidEmail = (email) => {
  const emailRegex =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate time format HH:mm (24h)
 */
const isValidTime = (time) => {
  if (typeof time !== "string") return false;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

/**
 * Match sending config Type against Source By
 */
const shouldUpdateSendingConfig = (type, sourceByValues = []) => {
  const normalizedType = String(type || "").trim().toLowerCase();

  // direct matches
  if (sourceByValues.includes(normalizedType)) return true;

  // flexible matching if Source By values are like "Text Only", "Email Only"
  if (normalizedType === "text" && sourceByValues.some((v) => v.includes("text"))) return true;
  if (normalizedType === "email" && sourceByValues.some((v) => v.includes("email"))) return true;

  return false;
};
/**
 * Normalize "Source By" to array
 * Airtable may return single select as string or multi-select array
 */
const normalizeSourceBy = (sourceBy) => {
  if (!sourceBy) return [];
  if (Array.isArray(sourceBy)) return sourceBy.map((v) => String(v).trim().toLowerCase());
  return [String(sourceBy).trim().toLowerCase()];
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

    return res.status(500).json(
      RESTRESPONSE(false, "Failed to fetch client config", {
        error: error.message,
      })
    );
  }
};


/* Update The configs  */
// -----------------------------
// UPDATE API
// -----------------------------

/**
 * PUT /updateConfigsByDudaId/:dudaId
 *
 * Body Example:
 * {
 *   "timeZoneRecordId": "recXXXXXXXXXXXXXX",
 *   "autoApproveRatings": true,
 *   "notificationEmails": ["test1@example.com", "test2@example.com"],
 *   "validStartTime": "09:00",
 *   "validEndTime": "18:00"
 * }
 */
const updateConfigsByDudaId = async (req, res) => {
  try {
    const { dudaId } = req.params;
    const {
      timeZoneRecordId,
      autoApproveRatings,
      notificationEmails,
      validStartTime,
      validEndTime,
    } = req.body || {};

    // -----------------------------
    // Basic Validation
    // -----------------------------
    if (!dudaId) {
      return res.status(400).json(
        RESTRESPONSE(false, "Duda ID is required")
      );
    }

    const hasClientMasterUpdate =
      timeZoneRecordId !== undefined ||
      autoApproveRatings !== undefined ||
      notificationEmails !== undefined;

    const hasSendingConfigUpdate =
      validStartTime !== undefined || validEndTime !== undefined;

    if (!hasClientMasterUpdate && !hasSendingConfigUpdate) {
      return res.status(400).json(
        RESTRESPONSE(false, "At least one update field is required")
      );
    }

    // -----------------------------
    // Validate Time Zone Record ID
    // -----------------------------
    if (timeZoneRecordId !== undefined) {
      if (typeof timeZoneRecordId !== "string" || !timeZoneRecordId.trim()) {
        return res.status(400).json(
          RESTRESPONSE(false, "timeZoneRecordId must be a valid Airtable record ID")
        );
      }

      const timeZoneRecord = await fetchRecordById(TABLES.TIME_ZONES, timeZoneRecordId);
      if (!timeZoneRecord) {
        return res.status(400).json(
          RESTRESPONSE(false, "Provided timeZoneRecordId does not exist in Timezones table")
        );
      }

      if (timeZoneRecord.Active === false) {
        return res.status(400).json(
          RESTRESPONSE(false, "Provided timezone is inactive")
        );
      }
    }

    // -----------------------------
    // Validate Auto Approve Ratings
    // -----------------------------
    if (
      autoApproveRatings !== undefined &&
      typeof autoApproveRatings !== "boolean"
    ) {
      return res.status(400).json(
        RESTRESPONSE(false, "autoApproveRatings must be true or false")
      );
    }

    // -----------------------------
    // Validate Notification Emails
    // -----------------------------
    let normalizedEmailList = null;

    if (notificationEmails !== undefined) {
      if (typeof notificationEmails !== "string" || !notificationEmails.trim()) {
        return res.status(400).json(
          RESTRESPONSE(false, "notificationEmails must be a comma-separated string")
        );
      }

      normalizedEmailList = notificationEmails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

      if (normalizedEmailList.length === 0) {
        return res.status(400).json(
          RESTRESPONSE(false, "At least one valid email is required")
        );
      }

      const invalidEmails = normalizedEmailList.filter((email) => !isValidEmail(email));

      if (invalidEmails.length > 0) {
        return res.status(400).json(
          RESTRESPONSE(false, `Invalid email(s): ${invalidEmails.join(", ")}`)
        );
      }
    }

    // -----------------------------
    // Validate Times
    // -----------------------------
    if (validStartTime !== undefined && !isValidTime(validStartTime)) {
      return res.status(400).json(
        RESTRESPONSE(false, "validStartTime must be in HH:mm format (24-hour)")
      );
    }

    if (validEndTime !== undefined && !isValidTime(validEndTime)) {
      return res.status(400).json(
        RESTRESPONSE(false, "validEndTime must be in HH:mm format (24-hour)")
      );
    }

    if (
      (validStartTime !== undefined && validEndTime === undefined) ||
      (validStartTime === undefined && validEndTime !== undefined)
    ) {
      return res.status(400).json(
        RESTRESPONSE(false, "Both validStartTime and validEndTime are required together")
      );
    }

    // -----------------------------
    // Fetch Client by Duda ID
    // -----------------------------
    const records = await fetchClientByDudaId(dudaId);

    if (!records || records.length === 0) {
      return res.status(404).json(
        RESTRESPONSE(false, "No client config found for provided Duda ID")
      );
    }

    const rawClientRecord = records[0];
    const clientRecord = formatRecord(rawClientRecord, TABLES.CLIENT_MASTER);

    // -----------------------------
    // Update Client Master
    // -----------------------------
    let updatedClientMaster = clientRecord;

    if (hasClientMasterUpdate) {
      const clientMasterFieldsToUpdate = {};

      if (timeZoneRecordId !== undefined) {
        clientMasterFieldsToUpdate["Time Zone"] = [timeZoneRecordId]; // linked record
      }

      if (autoApproveRatings !== undefined) {
        clientMasterFieldsToUpdate["Auto Approve Ratings"] = autoApproveRatings;
      }

      if (notificationEmails !== undefined) {
        // Save exactly as comma-separated string
        clientMasterFieldsToUpdate["Notification Emails"] = normalizedEmailList.join(", ");
      }

      const updatedClientRecord = await airbase(TABLES.CLIENT_MASTER).update(rawClientRecord.id,
         clientMasterFieldsToUpdate
      );

      updatedClientMaster = formatRecord(updatedClientRecord, TABLES.CLIENT_MASTER);
    }

    // -----------------------------
    // Update Sending Configs based on Source By
    // -----------------------------
    let updatedSendingConfigs = [];

    if (hasSendingConfigUpdate) {
      const sendingConfigIds = clientRecord["Sending Configs Ref"] || [];

      if (!Array.isArray(sendingConfigIds) || sendingConfigIds.length === 0) {
        return res.status(400).json(
          RESTRESPONSE(false, "No linked sending configs found for this client")
        );
      }

      const sourceByValues = normalizeSourceBy(clientRecord["Source By"]);

      if (!sourceByValues.length) {
        return res.status(400).json(
          RESTRESPONSE(false, "Source By is not configured for this client")
        );
      }

      // Fetch all linked sending configs
      const sendingConfigRecords = await Promise.all(
        sendingConfigIds.map(async (recordId) => {
          try {
            return await airbase(TABLES.SENDING_CONFIGS).find(recordId);
          } catch (error) {
            console.error(`Error fetching sending config ${recordId}:`, error.message);
            return null;
          }
        })
      );

      const validSendingConfigRecords = sendingConfigRecords.filter(Boolean);

      const recordsToUpdate = validSendingConfigRecords.filter((record) =>
        shouldUpdateSendingConfig(record.fields["Type"], sourceByValues)
      );

      if (recordsToUpdate.length === 0) {
        return res.status(400).json(
          RESTRESPONSE(false, "No sending config records matched the client's Source By")
        );
      }

      const updatePayload = recordsToUpdate.map((record) => ({
        id: record.id,
        fields: {
          "Valid Start Time": validStartTime,
          "Valid End Time": validEndTime,
        },
      }));

      const chunkSize = 10;
      const updatedChunks = [];

      for (let i = 0; i < updatePayload.length; i += chunkSize) {
        const chunk = updatePayload.slice(i, i + chunkSize);
        const updatedRecords = await airbase(TABLES.SENDING_CONFIGS).update(chunk);
        updatedChunks.push(...updatedRecords);
      }

      updatedSendingConfigs = updatedChunks.map((record) =>
        formatRecord(record, TABLES.SENDING_CONFIGS)
      );
    }

    // -----------------------------
    // Fetch latest linked timezone for response
    // -----------------------------
    const latestTimeZone = await fetchSingleLinkedRecord(
      TABLES.TIME_ZONES,
      updatedClientMaster["Time Zone"]
    );

    // -----------------------------
    // Final Response
    // -----------------------------
    const responsePayload = {
      id: updatedClientMaster.id,
      dudaId: updatedClientMaster["Duda ID"],
      account: updatedClientMaster["Account"],
      clientName: updatedClientMaster["Client Name"],
      reviewBuilderBasic: updatedClientMaster["Review Builder Basic"],
      sourceBy: updatedClientMaster["Source By"],
      autoApproveRatings: updatedClientMaster["Auto Approve Ratings"],
      notificationEmails: updatedClientMaster["Notification Emails"],
      linkedRecords: {
        timeZone: latestTimeZone,
        updatedSendingConfigs,
      },
    };

    return res.status(200).json(
      RESTRESPONSE(true, "Client config updated successfully", responsePayload)
    );
  } catch (error) {
    console.error("updateConfigsByDudaId error:", error);

    return res.status(500).json(
      RESTRESPONSE(false, "Failed to update client config", {
        error: error.message,
      })
    );
  }
};



module.exports = {
  fetchConfigsByDudaId,
  updateConfigsByDudaId,
};