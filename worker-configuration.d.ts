declare namespace Cloudflare {
  interface Env {
    CMS_DB?: D1Database;
    SITE_URL?: string;
    ACCESS_TEAM_DOMAIN?: string;
    ACCESS_AUD?: string;
    ADMIN_EMAIL?: string;
    LOCAL_ADMIN_TOKEN?: string;
  }
}
