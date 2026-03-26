const Airtable = require("airtable");
const RESTRESPONSE = require("../../utils/RESTResponse");

const TABLE_NAME = "Clients-Rating";

// Airtable config
const airbase = new Airtable({
  apiKey: process.env.REVIEWBUILDER_AIRTABLE_API_KEY,
}).base(process.env.REVIEWBUILDER_BASE_AIRTABLE_ID);

/**
 * GET /api/reviewbuilder/getRatingsByDudaId/:dudaId
 *
 * Query Params:
 * - pageSize   (default: 10)
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

    const pageSize = Math.min(parseInt(req.query.pageSize??50, 10) || 50, 100);
    const offset = req.query.offset || "";

    const search = (req.query.search || "").trim();
    const filterBy = (req.query.filterBy || "provider").trim().toLowerCase();
    const rating = req.query.rating || "all";
    const active = req.query.active || "all";
    const from = req.query.from || "";
    const to = req.query.to || "";

    const conditions = [];

    // Required filter
    conditions.push(`{Duda ID} = "${String(dudaId).replace(/"/g, '\\"')}"`);

    // Search filter
    if (search) {
      const safeSearch = String(search).replace(/"/g, '\\"').toLowerCase();

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

    // Active filter (ONLY if you have an Active field in Airtable)
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

    // Build query params manually for Airtable REST via runAction
    const queryParams = new URLSearchParams();
    queryParams.append("pageSize", String(pageSize));
    queryParams.append("filterByFormula", filterByFormula);

    if (offset) {
      queryParams.append("offset", offset); // string token like itrXXXX
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

module.exports = {
  getRatingsByDudaId,
};