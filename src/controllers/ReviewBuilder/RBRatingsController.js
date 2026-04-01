const Airtable = require("airtable");
const RESTRESPONSE = require("../../utils/RESTResponse");

const TABLE_NAME = "Clients-Rating";
const MASTER_TABLE = "Client Master";
const SOURCES_TABLE = "Review Sources";

// Airtable config
const airbase = new Airtable({
  apiKey: process.env.REVIEWBUILDER_AIRTABLE_API_KEY,
}).base(process.env.REVIEWBUILDER_BASE_AIRTABLE_ID);

/**
 * Escape double quotes for Airtable formula strings
 */
const escapeFormulaValue = (value = "") => String(value).replace(/"/g, '\\"');

/**
 * Fetch Client Master records by Duda ID (WITHOUT AXIOS)
 */
const fetchClientMasterByDudaId = async (dudaId) => {
  const records = await airbase(MASTER_TABLE)
    .select({
      filterByFormula: `{Duda ID} = "${escapeFormulaValue(dudaId)}"`,
      maxRecords: 1,
    })
    .firstPage();

  return records;
};


/**
 * Fetch Review Sources records by Place ID (WITHOUT AXIOS)
 */
const fetchSourceByPlaceId = async (placeId) => {
  const records = await airbase(SOURCES_TABLE)
    .select({
      filterByFormula: `{Source ID} = "${escapeFormulaValue(placeId)}"`,
      maxRecords: 1,
    })
    .firstPage();

  return records;
};

/**
 * GET /api/reviewbuilder/getRatingsByDudaId/:dudaId
 *
 * Query Params:
 * - pageSize   (default: 50, max: 100)
 * - offset     (Airtable pagination token string)
 * - search     (search text)
 * - filterBy   (name | provider) default: provider
 * - rating     (1-5 or "all")
 * - active     (active | inactive | all)
 * - from       (YYYY-MM-DD)
 * - to         (YYYY-MM-DD)
 */
const getRatingsByDudaId = async (req, res) => {
  try {
    const dudaId = req.params.dudaId;

    const pageSize = Math.min(parseInt(req.query.pageSize ?? 50, 10) || 50, 100);
    const offset = req.query.offset || "";

    const search = (req.query.search || "").trim();
    const filterBy = (req.query.filterBy || "provider").trim().toLowerCase();
    const rating = req.query.rating || "all";
    const active = req.query.active || "all";
    const from = req.query.from || "";
    const to = req.query.to || "";

    const conditions = [];

    // Required filter
    conditions.push(`{Duda ID} = "${escapeFormulaValue(dudaId)}"`);

    // Search filter
    if (search) {
      const safeSearch = escapeFormulaValue(search.toLowerCase());

      if (filterBy === "name") {
        conditions.push(`SEARCH("${safeSearch}", LOWER({Name})) > 0`);
      } else {
        conditions.push(`SEARCH("${safeSearch}", LOWER({Provider})) > 0`);
      }
    }

    // Rating filter
    if (rating !== "all" && !isNaN(parseInt(rating, 10))) {
      conditions.push(`{Rating} = ${parseInt(rating, 10)}`);
    }

    // Active filter
    if (active === "active") {
      conditions.push(`{Active} = 1`);
    } else if (active === "inactive") {
      conditions.push(`{Active} = 0`);
    }

    // Date filter using Reviewed At
    if (from) {
      conditions.push(`IS_AFTER({Reviewed At}, "${from}T00:00:00.000Z")`);
    }

    if (to) {
      conditions.push(`IS_BEFORE({Reviewed At}, "${to}T23:59:59.999Z")`);
    }

    const filterByFormula =
      conditions.length > 1 ? `AND(${conditions.join(",")})` : conditions[0];

    const table = airbase(TABLE_NAME);

    // IMPORTANT:
    // Use URLSearchParams with runAction because Airtable SDK select() expects numeric offset,
    // but REST API pagination offset is a string token like "itrXXXXX"
    const queryParams = new URLSearchParams();
    queryParams.append("pageSize", String(pageSize));
    queryParams.append("filterByFormula", filterByFormula);

    if (offset) {
      queryParams.append("offset", offset); // string token
    }

    // Sort by Reviewed At DESC
    queryParams.append("sort[0][field]", "Reviewed At");
    queryParams.append("sort[0][direction]", "desc");

    const path = `/${table._urlEncodedNameOrId()}`;

    const pageResponse = await new Promise((resolve, reject) => {
      table._base.runAction(
        "get",
        path,
        queryParams,
        null,
        (err, response, body) => {
          if (err) return reject(err);
          resolve(body);
        }
      );
    });

    const records = (pageResponse.records || []).map((record) => ({
      id: record.id,
      createdTime: record.createdTime,
      fields: record.fields,
    }));

    return res.status(200).json({
      success: true,
      records,
      offset: pageResponse.offset || null,
      hasMore: !!pageResponse.offset,
      pageSize,
      filters: {
        dudaId,
        search,
        filterBy,
        rating,
        active,
        from,
        to,
      },
    });
  } catch (error) {
    console.error("getRatingsByDudaId error:", error);

    if (RESTRESPONSE && typeof RESTRESPONSE.error === "function") {
      return RESTRESPONSE.error(res, error.message || "Failed to fetch ratings");
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ratings",
      error: error.message,
    });
  }
};

/**
 * POST /api/reviewbuilder/insertRating
 *
 * Body:
 * - dudaId
 * - rating
 * - toProvider
 */
const insertRating = async (req, res) => {
  try {
    const { dudaId, rating, toProvider } = req.body;

    // Validate dudaId
    if (!dudaId) {
      return res.status(400).json({ message: "DudaId required" });
    }

    if (!toProvider || toProvider.trim() === "") {
      return res.status(400).json({
        message: "To Provider required",
      });
    }

    // Validate rating
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // Fetch client master record (WITHOUT AXIOS)
    const masterRecords = await fetchClientMasterByDudaId(dudaId);

    if (masterRecords.length === 0) {
      return res.status(404).json({ message: "Client master not found" });
    }

    const masterRecord = masterRecords[0];
    const masterRecordId = masterRecord.id;
    const name = masterRecord?.fields?.["Client Name"]?.[0] || "Unknown";

    const sourceRecords = await fetchSourceByPlaceId(toProvider);

    if (sourceRecords.length === 0) {
      return res.status(404).json({ message: "Review source not found" });
    }
     const sourceRecordId = sourceRecords[0]?.id;

    // Get user IP
    const fromIP =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip;

    // Check existing rating by same IP + provider
    const existingRecords = await airbase(TABLE_NAME)
      .select({
        filterByFormula: `AND(
          {From IP} = "${escapeFormulaValue(fromIP)}",
          {To Provider} = "${escapeFormulaValue(toProvider)}"
        )`,
        maxRecords: 1,
      })
      .firstPage();

    // If record exists → UPDATE
    if (existingRecords.length > 0) {
      const updatedRecords = await airbase(TABLE_NAME).update([
        {
          id: existingRecords[0].id,
          fields: {
            Rating: numericRating,
            SourceDetails: [sourceRecordId],
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Rating updated",
        recordId: updatedRecords[0].id,
      });
    }

    // If not exists → CREATE
    const createdRecord = await airbase(TABLE_NAME).create({
      Name: name,
      "Client Master Ref": [masterRecordId],
      "From IP": fromIP,
      Active: true,
      Rating: numericRating,
      SourceDetails: [sourceRecordId],
      "To Provider": toProvider,
    });

    return res.status(201).json({
      success: true,
      message: "Rating inserted",
      recordId: createdRecord.id,
    });
  } catch (err) {
    console.error("insertRating error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  getRatingsByDudaId,
  insertRating,
};