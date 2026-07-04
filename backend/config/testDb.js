// config/testDb.js
import { Sequelize } from "sequelize";
import { ROOT_ENV_PATH } from "./paths.js";
import dotenv from "dotenv";

dotenv.config({ path: ROOT_ENV_PATH });

const testSequelize = process.env.NODE_ENV === "test"
  ? new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
    })
  : null;

export default testSequelize;
