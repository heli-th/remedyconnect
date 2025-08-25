const fs = require("fs");
const fsp = require("fs").promises;
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

const getCacheFileKeysByBaseName = async (baseName) => {
  const cacheDir = path.join(__dirname, "../cache");

  try {
    const files = await fsp.readdir(cacheDir);
    return files
      .filter((file) => file.startsWith(baseName))
      .map((file) => path.join(cacheDir, file));
  } catch (err) {
    console.error("Error reading cache directory:", err);
    return [];
  }
};

const deleteCacheFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const deleteMultipleCacheFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    deleteCacheFile(filePath);
  });
};

module.exports = {
  saveToCache,
  readFromCache,
  getCacheFileKeysByBaseName,
  deleteCacheFile,
  deleteMultipleCacheFiles,
};
