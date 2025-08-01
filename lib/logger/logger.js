import chalk from "chalk";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
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
const isDebug = process.env.DEBUG === "true";
const getTimestamp = () => new Date().toLocaleTimeString();
const clogger = {
  info: (msg, ...args) => {
    console.log(chalk.white(`${getTimestamp()}:ℹ️[INFO] ${msg}`), ...args);
  },
  warn: (msg, ...args) => {
    console.warn(chalk.yellow(`${getTimestamp()}:⚠️[WARN] ${msg}`), ...args);
  },
  error: (msg, ...args) => {
    console.error(chalk.red(`${getTimestamp()}:❌[ERROR] ${msg}`), ...args);
  },
  debug: (msg, ...args) => {
    if (isDebug) {
      console.log(chalk.cyan(`${getTimestamp()}:🛠️[DEBUG] ${msg}`), ...args);
    }
  },
  success: (msg, ...args) => {
    console.log(chalk.green(`${getTimestamp()}:✅[SUCCESS] ${msg}`), ...args);
  },
  log: (msg, ...args) => {
    console.log(chalk.white(`${getTimestamp()}:📝[LOG] ${msg}`), ...args);
  },
};

export default clogger;
