const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "../cache");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

const getCacheKey = (baseId, viewName) =>
  path.join(CACHE_DIR, `${baseId}_${viewName.replace(/\s+/g, "_")}.json`);

const saveToCache = (baseId, viewName, data) => {
  const key = getCacheKey(baseId, viewName);
  fs.writeFileSync(key, JSON.stringify(data, null, 2));
};

const readFromCache = (baseId, viewName) => {
  const key = getCacheKey(baseId, viewName);
  if (fs.existsSync(key)) {
    return JSON.parse(fs.readFileSync(key));
  }
  return null;
};

module.exports = { saveToCache, readFromCache };
