// Since Android 11 an app only "sees" other apps it declares in <queries>. Screen time needs to read the
// names of launchable apps and know which app is the home screen, so declare exactly those two intents
// (not QUERY_ALL_PACKAGES, which Play restricts).
const { withAndroidManifest } = require("expo/config-plugins");

const wanted = [
  { action: "android.intent.action.MAIN", category: "android.intent.category.LAUNCHER" },
  { action: "android.intent.action.MAIN", category: "android.intent.category.HOME" },
];

module.exports = function withUsageQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries ?? [{}];
    const q = manifest.queries[0];
    q.intent = q.intent ?? [];
    for (const w of wanted) {
      const exists = q.intent.some(
        (i) => i.action?.[0]?.$?.["android:name"] === w.action && i.category?.[0]?.$?.["android:name"] === w.category,
      );
      if (!exists) q.intent.push({ action: [{ $: { "android:name": w.action } }], category: [{ $: { "android:name": w.category } }] });
    }
    return cfg;
  });
};
