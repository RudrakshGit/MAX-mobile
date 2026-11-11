import { Platform } from "react-native";

// MAX on the web ("Try now" on the website, owner 11 Nov 2026): the same app, without the parts that need a phone
// or an account. Everything else works and stays in this browser. Native-only modules are never called on the web.
export const isWeb = Platform.OS === "web";

/** Where the website offers the app download. */
export const DOWNLOAD_URL = "https://max-mental-health-expert.vercel.app/download";

/** Chat replies a browser gets per day on the web preview (a crisis message always gets the helplines). */
export const WEB_CHATS_PER_DAY = 20;

/** Where a student's data lives, for copy: "this phone" in the app, "this browser" on the web. */
export const THIS_DEVICE = isWeb ? "this browser" : "this phone";
