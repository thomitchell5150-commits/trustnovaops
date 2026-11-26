/* TrustNovaOps runtime configuration (public, non-secret values only).
   This committed default disables all optional analytics. At deploy time
   scripts/write-runtime-config.mjs regenerates this file from environment
   variables (GA4_MEASUREMENT_ID). Never place secrets here — it is public. */
window.TN_CONFIG = { ga4: "", env: "default" };
