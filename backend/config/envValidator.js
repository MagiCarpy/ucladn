import dotenv from "dotenv";
import { ROOT_ENV_PATH } from "./paths.js";

// Make sure env is loaded
dotenv.config({ path: ROOT_ENV_PATH });

const REQUIRED_ENV_VARS = [
  "MYSQL_HOST",
  "MYSQL_USER",
  "MYSQL_PASS",
  "MYSQL_DB",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "ORS_API_KEY",
];

export function validateEnv() {
  // Skip environment check in testing mode to prevent CI test blockages
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const missing = [];

  for (const name of REQUIRED_ENV_VARS) {
    if (!process.env[name] || process.env[name].trim() === "") {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    console.error("==================================================");
    console.error("FATAL ERROR: Missing critical environment variables!");
    console.error("Please configure the following in your .env file:");
    for (const name of missing) {
      console.error(` - ${name}`);
    }
    console.error("==================================================");
    process.exit(1);
  }
}
