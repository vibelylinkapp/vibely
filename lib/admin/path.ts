// Public base path for the admin panel. The real routes live at app/admin,
// but they are only reachable through this unguessable base: middleware
// rewrites `/${ADMIN_PATH}/*` to `/admin/*` and 404s any direct hit to /admin.
// Override per deployment with the ADMIN_PANEL_PATH env var (no leading slash).
export const ADMIN_PATH = (process.env.ADMIN_PANEL_PATH || "ops-8f3k2p9x7q")
  .replace(/^\/+|\/+$/g, "");
