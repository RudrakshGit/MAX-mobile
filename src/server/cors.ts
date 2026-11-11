// The MAX website's college dashboard calls these routes from the browser. EAS Hosting replaces the browser's Origin
// header with its own host (checked 11 Nov 2026), so the server can't tell which site is calling; the routes are
// opened to any origin instead. That is safe here because they only accept a bearer token, never cookies: another
// site can't use a counsellor's session it doesn't have, and /api/auth/google only accepts a Google ID token made
// for MAX's own client id, which Google issues only to MAX's registered sites.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

/** Adds the CORS headers to a response. */
export function cors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/** The browser's preflight before a cross-origin call with a token or a JSON body. */
export function preflight(): Response {
  return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Max-Age": "600" } });
}

/** Wraps a route handler so its responses carry the CORS headers. */
export const withCors =
  (handler: (req: Request) => Promise<Response>) =>
  (req: Request): Promise<Response> =>
    handler(req).then(cors);
