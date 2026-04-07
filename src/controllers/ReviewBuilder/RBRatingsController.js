const Airtable = require("airtable");
const RESTRESPONSE = require("../../utils/RESTResponse");

const TABLES = {
  RATINGS: "Clients-Rating",
  MASTER: "Client Master",
  SOURCES: "Review Sources",
};

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_FILTER_BY = "provider";
const ALLOWED_FILTER_BY = new Set(["name", "provider"]);
const ALLOWED_ACTIVE = new Set(["all", "active", "inactive"]);

const airbase = new Airtable({
  apiKey: process.env.REVIEWBUILDER_AIRTABLE_API_KEY,
}).base(process.env.REVIEWBUILDER_BASE_AIRTABLE_ID);

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const sendError = (res, error, fallbackMessage = "Internal server error", status = 500) => {
  const message = error?.message || fallbackMessage;

  if (RESTRESPONSE && typeof RESTRESPONSE.error === "function") {
    return RESTRESPONSE.error(res, message, status);
  }

  return res.status(status).json({
    success: false,
    message,
  });
};

const sendBadRequest = (res, message) =>
  res.status(400).json({ success: false, message });

const sendNotFound = (res, message) =>
  res.status(404).json({ success: false, message });

const escapeFormulaValue = (value = "") =>
  String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const toSafeString = (value) => String(value ?? "").trim();

const parsePageSize = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
};

const parseRating = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }

  return req.socket?.remoteAddress || req.ip || "";
};

const buildFormulaEquals = (field, value) =>
  `{${field}} = "${escapeFormulaValue(value)}"`;

const buildFormulaSearchLower = (field, search) =>
  `SEARCH("${escapeFormulaValue(String(search).toLowerCase())}", LOWER({${field}})) > 0`;

const buildAndFormula = (conditions = []) => {
  const valid = conditions.filter(Boolean);
  if (!valid.length) return "";
  if (valid.length === 1) return valid[0];
  return `AND(${valid.join(",")})`;
};

const getSingleRecordByField = async (tableName, fieldName, fieldValue) => {
  const records = await airbase(tableName)
    .select({
      filterByFormula: buildFormulaEquals(fieldName, fieldValue),
      maxRecords: 1,
    })
    .firstPage();

  return records[0] || null;
};

const getPaginatedRecords = async ({
  tableName,
  pageSize,
  offset,
  filterByFormula,
  sortField = "Reviewed At",
  sortDirection = "desc",
}) => {
  const table = airbase(tableName);

  const queryParams = new URLSearchParams();
  queryParams.append("pageSize", String(pageSize));

  if (filterByFormula) {
    queryParams.append("filterByFormula", filterByFormula);
  }

  if (offset) {
    queryParams.append("offset", offset);
  }

  queryParams.append("sort[0][field]", sortField);
  queryParams.append("sort[0][direction]", sortDirection);

  const path = `/${table._urlEncodedNameOrId()}`;
  const queryObject = Object.fromEntries(queryParams.entries());

  return new Promise((resolve, reject) => {
    table._base.runAction("get", path, queryObject, null, (err, _response, body) => {
      if (err) return reject(err);
      resolve(body || {});
    });
  });
};

/* -------------------------------------------------------------------------- */
/*                            GET Ratings By Duda ID                          */
/* -------------------------------------------------------------------------- */
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
    const dudaId = toSafeString(req.params.dudaId);

    if (!dudaId) {
      return sendBadRequest(res, "Duda ID is required");
    }

    const pageSize = parsePageSize(req.query.pageSize);
    const offset = toSafeString(req.query.offset);
    const search = toSafeString(req.query.search);
    const filterBy = ALLOWED_FILTER_BY.has(toSafeString(req.query.filterBy).toLowerCase())
      ? toSafeString(req.query.filterBy).toLowerCase()
      : DEFAULT_FILTER_BY;
    const rating = toSafeString(req.query.rating || "all").toLowerCase();
    const active = ALLOWED_ACTIVE.has(toSafeString(req.query.active || "all").toLowerCase())
      ? toSafeString(req.query.active || "all").toLowerCase()
      : "all";
    const from = toSafeString(req.query.from);
    const to = toSafeString(req.query.to);

    const conditions = [buildFormulaEquals("Duda ID", dudaId)];

    // Search filter
    if (search) {
      const searchField = filterBy === "name" ? "Name" : "Provider";
      conditions.push(buildFormulaSearchLower(searchField, search));
    }

    // Rating filter
    if (rating !== "all") {
      const numericRating = parseRating(rating);
      if (!numericRating || numericRating < 1 || numericRating > 5) {
        return sendBadRequest(res, "Rating must be between 1 and 5 or 'all'");
      }
      conditions.push(`{Rating} = ${numericRating}`);
    }

    // Active filter
    if (active === "active") {
      conditions.push(`{Active} = 1`);
    } else if (active === "inactive") {
      conditions.push(`{Active} = 0`);
    }

    // Date filters
    if (from) {
      conditions.push(`IS_AFTER({Reviewed At}, "${escapeFormulaValue(from)}T00:00:00.000Z")`);
    }

    if (to) {
      conditions.push(`IS_BEFORE({Reviewed At}, "${escapeFormulaValue(to)}T23:59:59.999Z")`);
    }

    const filterByFormula = buildAndFormula(conditions);

    const pageResponse = await getPaginatedRecords({
      tableName: TABLES.RATINGS,
      pageSize,
      offset,
      filterByFormula,
    });

    const records = Array.isArray(pageResponse.records)
      ? pageResponse.records.map((record) => ({
          id: record.id,
          createdTime: record.createdTime,
          fields: record.fields || {},
        }))
      : [];

    return res.status(200).json({
      success: true,
      records,
      offset: pageResponse.offset || null,
      hasMore: Boolean(pageResponse.offset),
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
    return sendError(res, error, "Failed to fetch ratings");
  }
};

/* -------------------------------------------------------------------------- */
/*                                Insert Rating                               */
/* -------------------------------------------------------------------------- */
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
    const dudaId = toSafeString(req.body.dudaId);
    const toProvider = toSafeString(req.body.toProvider);
    const numericRating = Number.parseInt(req.body.rating, 10);

    // Validation
    if (!dudaId) {
      return sendBadRequest(res, "Duda ID is required");
    }

    if (!toProvider) {
      return sendBadRequest(res, "To Provider is required");
    }

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return sendBadRequest(res, "Rating must be between 1 and 5");
    }

    const fromIP = getClientIp(req);

    // Fetch in parallel for better performance
    const [masterRecord, sourceRecord] = await Promise.all([
      getSingleRecordByField(TABLES.MASTER, "Duda ID", dudaId),
      getSingleRecordByField(TABLES.SOURCES, "Source ID", toProvider),
    ]);

    if (!masterRecord) {
      return sendNotFound(res, "Client master not found");
    }

    if (!sourceRecord) {
      return sendNotFound(res, "Review source not found");
    }

    const masterRecordId = masterRecord.id;
    const sourceRecordId = sourceRecord.id;
    const clientName = masterRecord?.fields?.["Client Name"]?.[0] || "Unknown";

    // Check existing rating by same IP + provider
    const existingRecords = await airbase(TABLES.RATINGS)
      .select({
        filterByFormula: buildAndFormula([
          buildFormulaEquals("From IP", fromIP),
          buildFormulaEquals("To Provider", toProvider),
        ]),
        maxRecords: 1,
      })
      .firstPage();

    const existingRecord = existingRecords[0];

    // Update existing
    if (existingRecord) {
      const [updatedRecord] = await airbase(TABLES.RATINGS).update([
        {
          id: existingRecord.id,
          fields: {
            Rating: numericRating,
            SourceDetails: [sourceRecordId],
            "To Provider": toProvider,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        message: "Rating updated",
        recordId: updatedRecord.id,
      });
    }

    // Create new
    const createdRecord = await airbase(TABLES.RATINGS).create({
      Name: clientName,
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
  } catch (error) {
    console.error("insertRating error:", error);
    return sendError(res, error, "Failed to insert rating");
  }
};

module.exports = {
  getRatingsByDudaId,
  insertRating,
};