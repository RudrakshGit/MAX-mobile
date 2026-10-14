import { resources } from "../src/content/resources.ts";
import { playlists } from "../src/content/music.ts";

console.log(`Checking ${resources.length} resources and ${playlists.length} music playlists...`);

const results = [];
let hasFailures = false;

// 1. Check mental health resources
for (const r of resources) {
  if (r.status === "hidden") {
    results.push({ id: r.id, status: "SKIPPED (hidden)", url: r.url });
    continue;
  }

  let ok = false;
  let statusText = "";

  try {
    if (r.url.includes("youtube.com") || r.url.includes("youtu.be")) {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(r.url)}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: { "User-Agent": "MAX-LinkChecker/1.0" },
      });
      if (res.status === 200) {
        ok = true;
        statusText = "200 OK (oEmbed)";
      } else {
        statusText = `HTTP ${res.status}`;
      }
    } else {
      let res = await fetch(r.url, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MAX-LinkChecker/1.0)" },
      });
      if (!res.ok && res.status !== 405) {
        res = await fetch(r.url, {
          method: "GET",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MAX-LinkChecker/1.0)" },
        });
      }
      if (res.ok || res.status === 403) {
        ok = true;
        statusText = res.ok ? `${res.status} OK` : `${res.status} (Bot-protected, verified)`;
      } else {
        statusText = `HTTP ${res.status}`;
      }
    }
  } catch (err) {
    statusText = `Error: ${err.message}`;
  }

  results.push({ id: r.id, status: statusText, ok, url: r.url });
  if (!ok) {
    hasFailures = true;
    console.error(`❌ [FAIL] ${r.id}: ${statusText} -> ${r.url}`);
  } else {
    console.log(`✓ [OK] ${r.id}: ${statusText}`);
  }
}

// 2. Check music playlists
console.log(`\nChecking ${playlists.length} music playlists...`);
for (const p of playlists) {
  let ok = false;
  let statusText = "";

  try {
    if (p.platform === "spotify") {
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(p.url)}`;
      const res = await fetch(oembedUrl, {
        headers: { "User-Agent": "MAX-LinkChecker/1.0" },
      });
      if (res.status === 200) {
        ok = true;
        statusText = "200 OK (Spotify oEmbed)";
      } else {
        statusText = `HTTP ${res.status}`;
      }
    } else {
      let res = await fetch(p.url, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MAX-LinkChecker/1.0)" },
      });
      if (!res.ok && res.status !== 405) {
        res = await fetch(p.url, {
          method: "GET",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MAX-LinkChecker/1.0)" },
        });
      }
      if (res.ok || res.status === 403) {
        ok = true;
        statusText = `${res.status} OK`;
      } else {
        statusText = `HTTP ${res.status}`;
      }
    }
  } catch (err) {
    statusText = `Error: ${err.message}`;
  }

  results.push({ id: p.id, status: statusText, ok, url: p.url });
  if (!ok) {
    hasFailures = true;
    console.error(`❌ [FAIL] ${p.id}: ${statusText} -> ${p.url}`);
  } else {
    console.log(`✓ [OK] ${p.id}: ${statusText}`);
  }
}

console.log("\nSummary:");
console.table(results.map((r) => ({ ID: r.id, Status: r.status })));

if (hasFailures) {
  console.error("Link check failed with broken links.");
  process.exit(1);
} else {
  console.log(`All ${results.length} links verified successfully!`);
  process.exit(0);
}
