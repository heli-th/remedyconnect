const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 });

const getCacheKeys = () => {
  return cache.keys();
};

const getCache = (key) => {
  return cache.get(key);
};

const setCache = (key, value) => {
  return cache.set(key, value);
};

const clearCache = (key) => {
  return cache.del(key);
};

const getCacheKeysByBaseName = (basename) => {
  const keys = getCacheKeys();

  return keys.filter((key) => {
    let keyBas = key.split(":")[1];
    return keyBas === basename;
  });
};

module.exports = {
  getCacheKeys,
  getCache,
  setCache,
  clearCache,
  getCacheKeysByBaseName,
  cache,
};
