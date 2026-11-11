import { isWeb } from "@/lib/platform";
import { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";

// Google sign-in (free "Original" API of @react-native-google-signin/google-signin). We only need an ID token:
// the MAX server verifies it and issues its own session. Scopes stay at the default (name, email, profile).
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

/** True when this build was made with a Google client id; otherwise the backup option is hidden. */
export const googleConfigured = !isWeb && WEB_CLIENT_ID.endsWith(".apps.googleusercontent.com");

let configured = false;
function ensureConfigured() {
  if (configured || !googleConfigured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
}

export type GoogleToken = { ok: true; idToken: string } | { ok: false; reason: "cancelled" | "not-configured" | "offline" | "failed" };

export async function googleIdToken(): Promise<GoogleToken> {
  if (!googleConfigured) return { ok: false, reason: "not-configured" };
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (isCancelledResponse(res)) return { ok: false, reason: "cancelled" };
    const idToken = res.data?.idToken;
    // no token means the web client id in this build doesn't match the Google Cloud project
    return idToken ? { ok: true, idToken } : { ok: false, reason: "not-configured" };
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) return { ok: false, reason: "cancelled" };
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { ok: false, reason: "failed" };
      // "10" = DEVELOPER_ERROR: the app's SHA-1 / package isn't registered as an Android client in Google Cloud
      if (String(e.code) === "10") return { ok: false, reason: "not-configured" };
      if (String(e.code) === "7") return { ok: false, reason: "offline" }; // NETWORK_ERROR
    }
    return { ok: false, reason: "failed" };
  }
}

export async function googleSignOut() {
  if (!googleConfigured) return;
  ensureConfigured();
  await GoogleSignin.signOut().catch(() => {});
}
