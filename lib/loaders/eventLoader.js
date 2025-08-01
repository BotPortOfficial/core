import path from 'path';
import * as fs from 'fs';
import {pathToFileURL} from 'url';
import logger from '../logger/logger.js';
import {getProjectDirectory} from '../config/environment.js';
export async function loadEvents(client) {
  logger.info('🔄 Checking for event handlers...');
  const projectDir = getProjectDirectory();
  const eventsPath = path.join(projectDir, 'events');
  if (!fs.existsSync(eventsPath)) {
    return;
  }
  try {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    if (eventFiles.length === 0) {
      return;
    }
    let eventsLoaded = 0;
    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      logger.debug(`Loading event from file: ${file}`);
      try {
        const imported = await import(pathToFileURL(filePath).href);
        const evt = imported.default;
        if (!evt || typeof evt.name !== 'string' || typeof evt.execute !== 'function') {
          logger.error(`Invalid event export in ${file} - must have 'name' and 'execute' properties`);
          continue;
        }
        const listener = (...args) => evt.execute(...args, client);
        if (evt.once) {
          client.once(evt.name, listener);
          logger.success(`Loaded event (once): ${evt.name}`);
        } else {
          client.on(evt.name, listener);
          logger.success(`Loaded event: ${evt.name}`);
        }
        eventsLoaded++;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error(`Failed to import event from ${file}:`, error.message);
      }
    }
    logger.success(`🎉 Successfully loaded ${eventsLoaded} event handler(s)`);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Could not read events directory:', error.message);
  }
}
