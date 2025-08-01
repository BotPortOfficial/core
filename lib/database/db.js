import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../logger/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "src",
    "config",
    ".env"
  ),
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = pool;

async function findJsonFiles(dir, jsonFiles = []) {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        await findJsonFiles(fullPath, jsonFiles);
      } else if (file.isFile() && file.name.endsWith(".json")) {
        jsonFiles.push(fullPath);
      }
    }
  } catch (error) {
    logger.warn(`Could not read directory:`, error.message);
  }

  return jsonFiles;
}

function ensureIfNotExists(query) {
  if (
    query.trim().toUpperCase().startsWith("CREATE TABLE") &&
    !query.toUpperCase().includes("IF NOT EXISTS")
  ) {
    return query.replace(/CREATE TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
  }
  return query;
}

async function createFromJson() {
  try {
    const srcDir = path.join(__dirname, "..", "..", "..", "..", "..", "src");

    try {
      const srcStats = await fs.stat(srcDir);
      if (!srcStats.isDirectory()) {
        logger.warn(`Source path exists but is not a directory`);
        return;
      }
    } catch (statError) {
      logger.error(`Source directory does not exist or is not accessible`);
      return;
    }

    const jsonFiles = await findJsonFiles(srcDir);

    logger.info(`Found ${jsonFiles.length} JSON files to process`);

    for (const fullPath of jsonFiles) {
      let cfg;

      try {
        const fileContent = await fs.readFile(fullPath, "utf8");
        cfg = JSON.parse(fileContent);
      } catch (parseError) {
        logger.warn(`Could not parse JSON file, skipping`);
        continue;
      }

      if (cfg.Database && Array.isArray(cfg.Database)) {
        for (let i = 0; i < cfg.Database.length; i++) {
          const originalQuery = cfg.Database[i];
          const query = ensureIfNotExists(originalQuery);

          try {
            await db.execute(query);
            logger.info(`Query ${i + 1} executed successfully`);
          } catch (err) {
            if (!err.message.includes("already exists")) {
              logger.error(`Error executing query ${i + 1}:`, err.message);
            }
          }
        }
      } else if (cfg.database && typeof cfg.database === "object") {
        for (const [tableName, originalSql] of Object.entries(cfg.database)) {
          const sql = ensureIfNotExists(originalSql);

          try {
            await db.execute(sql);
            logger.info(`Table ${tableName} is ready`);
          } catch (err) {
            if (!err.message.includes("already exists")) {
              logger.error(`Error creating table ${tableName}:`, err.message);
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error reading JSON configuration files:", error);
  }
}

async function initDatabases() {
  await createFromJson();
  logger.info("Database initialization completed");
}

export { db, initDatabases };
