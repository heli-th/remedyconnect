const { isBaseThrottle } = require("../services/AirtableService");
const {
  clearCache,
  getCacheKeysByBaseName,
} = require("../services/cacheServices");
const {
  getCacheFileKeysByBaseName,
  deleteMultipleCacheFiles,
} = require("../utils/airtableCache");

const clearBaseCache = async (req, res) => {
  const { base } = req.body;

  if (!base) {
    return res.status(400).json({ error: "Base parameter is required" });
  }

  /** check if base is throttled or not */
  const isThrottled = await isBaseThrottle(base);

  if (!isThrottled) {
    try {
      /**clear node cache */
      const keys = getCacheKeysByBaseName(base);
      clearCache(keys);

      /**clear json file cache */
      const fileKeys = await getCacheFileKeysByBaseName(base);
      deleteMultipleCacheFiles(fileKeys);
      return res.status(200).json({ message: "Cache cleared successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Error clearing cache" });
    }
  } else {
    return res
      .status(429)
      .json({ error: "Base is currently throttled. Try again later." });
  }
};

module.exports = { clearBaseCache };
