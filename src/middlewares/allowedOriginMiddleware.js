const {
  getAllowedDomains,
  getGlobalBaseAllowedDomains,
} = require("../services/AirtableService");

const checkAllowedOrigin = async (req, res, next) => {
  const origin = req.headers.origin;
  const { base, baseId, airtableId } = req.query;
  const { base: baseBody } = req.body;
  const { base: baseFromParams } = req.params;
  let hostname;

  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin;
  }

  // handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  if (req.headers["x-airtable-source"]) {
    return next();
  }

  if (
    req.headers["x-site-deployment-id"] &&
    req.headers["x-site-deployment-id"] === "dudacollection"
  ) {
    if (
      req.headers["authorization"] &&
      req.headers["authorization"].startsWith("Bearer ")
    ) {
      const token = req.headers["authorization"].split(" ")[1];
      if (token === process.env.AIRTABLE_API_KEY) {
        return next();
      }
    }
  }

  if (
    req.headers["x-postman-token"] &&
    req.headers["x-postman-token"] === process.env.POSTMAN_SECRET
  ) {
    return next();
  }

  if (!base && !baseId && !airtableId && !baseBody && !baseFromParams) {
    return res
      .status(400)
      .json({ message: "base or baseId query parameter is required" });
  }

  try {
    const allowedDomains = await getAllowedDomains(
      base || baseId || airtableId || baseBody || baseFromParams
    );
    if (
      allowedDomains?.some(
        (domain) =>
          domain.includes("://")
            ? domain === origin // if stored with protocol, match full origin
            : domain === hostname // if stored without protocol, match hostname
      )
    ) {
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
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin;
  }

  // handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  if (
    req.headers["x-postman-token"] &&
    req.headers["x-postman-token"] === process.env.POSTMAN_SECRET
  ) {
    return next();
  }

  if (
    req.headers["x-site-deployment-id"] &&
    req.headers["x-site-deployment-id"] === "dudacollection"
  ) {
    if (
      req.headers["authorization"] &&
      req.headers["authorization"].startsWith("Bearer ")
    ) {
      const token = req.headers["authorization"].split(" ")[1];
      if (token === process.env.AIRTABLE_API_KEY) {
        return next();
      }
    }
  }

  if (req.headers["x-airtable-source"]) {
    return next();
  }

  try {
    const allowedDomains = await getGlobalBaseAllowedDomains();
    if (
      allowedDomains?.some(
        (domain) =>
          domain.includes("://")
            ? domain === origin // if stored with protocol, match full origin
            : domain === hostname // if stored without protocol, match hostname
      )
    ) {
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
