import {readFileSync} from 'fs';
import logger from '../logger/logger.js';
export function parseInfoFile(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    const info = {};
    raw.split(/\r?\n/).forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const [key, ...rest] = line.split(':');
      if (!key) return;
      info[key.trim()] = rest.join(':').trim();
    });
    return info;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`Failed to read info file at ${filePath}:`, error);
    return null;
  }
}
