const deployedApiUrl = "https://oravista-server-474976105474.asia-southeast1.run.app";
const localHostnames = ["localhost", "127.0.0.1"];
const isLocalBrowser =
  typeof window !== "undefined" && localHostnames.includes(window.location.hostname);

// Local development uses the local Express server. Deployed builds continue to
// use Cloud Run, unless REACT_APP_API_URL explicitly supplies another API URL.
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (isLocalBrowser ? "http://localhost:5000" : deployedApiUrl);
