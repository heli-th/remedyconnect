const { getAllowedDomains } = require("../services/AirtableService");

const checkAllowedOrigin = async (req, res, next) => {
  const origin = req.headers.origin;
  const { base, baseId } = req.query;

  if (!base && !baseId) {
    return res
      .status(400)
      .json({ message: "base or baseId query parameter is required" });
  }

  // handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  try {
    const allowedDomains = await getAllowedDomains(base || baseId);
    if (allowedDomains && allowedDomains.includes(origin)) {
      next();
    } else {
      res.status(403).json({ message: "Cors Error: Origin not allowed" });
    }
  } catch (err) {
    console.error("Error in checkAllowedOrigin:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const checkAllowedOriginForGlobalBase = async (req, res, next) => {
  const origin = req.headers.origin;
  const GLOBAL_BASE_ID = process.env.BASE_AIRTABLE_ID;

  if (!GLOBAL_BASE_ID) {
    return res
      .status(500)
      .json({ message: "Global base ID is not configured" });
  }

  // handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  try {
    const allowedDomains = await getAllowedDomains(GLOBAL_BASE_ID);
    if (allowedDomains && allowedDomains.includes(origin)) {
      next();
    } else {
      res.status(403).json({ message: "Cors Error: Origin not allowed" });
    }
  } catch (err) {
    console.error("Error in checkAllowedOrigin:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { checkAllowedOrigin, checkAllowedOriginForGlobalBase };
