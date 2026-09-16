const deployedApiUrl =
  "https://oravista-server-474976105474.asia-southeast1.run.app";

const configuredApiUrl = process.env.REACT_APP_API_BASE_URL?.trim();

// Use the Vercel/React environment variable when available.
// If it is not defined, fall back to the deployed Google Cloud Run server.
// Remove any trailing slash so endpoint paths can safely use `${API_BASE_URL}/api/...`.
export const API_BASE_URL = (
  configuredApiUrl || deployedApiUrl
).replace(/\/+$/, "");