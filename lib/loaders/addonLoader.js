import path from 'path';
import * as fs from 'fs';
import {pathToFileURL} from 'url';
import logger from '../logger/logger.js';
import {parseInfoFile} from '../utils/fileUtils.js';
import {loadAddons, isDebug, getProjectDirectory} from '../config/environment.js';

export async function loadAddonsIfEnabled(client) {
  if (!loadAddons) {
    logger.debug('Addon loading is disabled (ADDONS=false)');
    return;
  }

  logger.info('🔄 Loading addons...');
  const projectDir = getProjectDirectory();
  const addonsRoot = path.join(projectDir, '..', '..', '..', 'src', 'addons');

  if (!fs.existsSync(addonsRoot)) {
    return;
  }

  const addonDirs = fs
    .readdirSync(addonsRoot, {withFileTypes: true})
    .filter(d => d.isDirectory())
    .map(d => d.name);

  if (addonDirs.length === 0) {
    logger.info('No addon directories found in src/addons folder');
    return;
  }

  let addonsLoaded = 0;
  for (const dirName of addonDirs) {
    const success = await loadSingleAddon(client, addonsRoot, dirName);
    if (success) {
      addonsLoaded++;
    }
  }

  if (addonsLoaded > 0) {
    logger.success(`🎉 Successfully loaded ${addonsLoaded} addon(s)`);
  } else {
    logger.info('No addons were loaded');
  }
}

async function loadSingleAddon(client, addonsRoot, dirName) {
  const dirPath = path.join(addonsRoot, dirName);
  const infoPath = path.join(dirPath, 'addon.info');

  if (!fs.existsSync(infoPath)) {
    logger.debug(`Skipping ${dirName}: no addon.info file found`);
    return false;
  }

  const info = parseInfoFile(infoPath);
  if (!info) {
    logger.error(`Failed to parse addon.info for ${dirName}`);
    return false;
  }

  if (info.type && info.type.toLowerCase() !== 'addon') {
    logger.debug(`Skipping ${dirName}: type is '${info.type}', not 'addon'`);
    return false;
  }

  if (!info.mainfile) {
    logger.error(`Addon "${dirName}" is missing 'mainfile' field in addon.info`);
    return false;
  }

  const addonFilePath = path.join(dirPath, info.mainfile);
  if (!fs.existsSync(addonFilePath)) {
    logger.error(`Main file for addon "${dirName}" not found at ${info.mainfile}`);
    return false;
  }

  logger.debug(`Loading addon: ${info.name || dirName} v${info.version || '1.0'}`);

  try {
    const addon = await import(pathToFileURL(addonFilePath).href);
    if (addon.default && typeof addon.default.execute === 'function') {
      await addon.default.execute(client);
      logger.success(`Loaded addon: ${info.name || dirName} v${info.version || '1.0'}`);
      return true;
    } else {
      logger.error(`⛔ Failed to initialize addon ${dirName}: missing default export or execute function`);
      return false;
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`❌ Error loading addon ${dirName}:`, error.message);
    if (isDebug) {
      logger.debug(`Full error details: ${error.stack}`);
    }
    return false;
  }
}