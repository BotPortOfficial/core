import * as dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path: path.join(__dirname, '..', '..', '..', '..', '..', 'src', 'config', '.env')});
export const loadAddons = process.env.ADDONS === 'true';
export const isDebug = process.env.DEBUG === 'true';
export function validateEnvironmentVariables() {
  const requiredEnvVars = ['TOKEN', 'CLIENT_ID', 'GUILD_ID'];
  return requiredEnvVars.filter(varName => !process.env[varName]);
}
export function getProjectDirectory() {
  return path.dirname(path.dirname(__dirname));
}
