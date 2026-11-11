// AsyncStorage on Android caps its whole database at 6 MB by default. A year of journaling plus chats can
// approach that, and writes past the cap fail. Raise it to 32 MB (still small; the data is text).
const { withGradleProperties } = require("expo/config-plugins");

const KEY = "AsyncStorage_db_size_in_MB";

module.exports = function withAsyncStorageSize(config, sizeMb = 32) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter((p) => !(p.type === "property" && p.key === KEY));
    cfg.modResults.push({ type: "property", key: KEY, value: String(sizeMb) });
    return cfg;
  });
};
