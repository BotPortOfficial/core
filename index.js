// Main entry point for @botport/tickets - Unified Discord bot framework
// Combines functionality from both docky and framework packages

// Core framework functionality (from @botport/framework)
import { db, initDatabases } from './lib/database/db.js';
import { ErrorHandler } from './lib/handlers/errors/main.js';
import { handleInteraction } from './lib/handlers/interactions/interactions.js';
import logBanner from './lib/essentials/banner.js';
import clogger from './lib/logger/logger.js';

// Bot setup functionality (from @botport/docky)
export { setupBot } from './lib/bot/setup.js';
export { validateEnvironmentVariables, getProjectDirectory, loadAddons, isDebug } from './lib/config/environment.js';
export { loadCommands } from './lib/loaders/commandLoader.js';
export { loadEvents } from './lib/loaders/eventLoader.js';
export { loadAddonsIfEnabled } from './lib/loaders/addonLoader.js';
export { registerCommands } from './lib/registration/commandRegistration.js';
export { registerMembers } from './lib/registration/memberRegistration.js';
export { parseInfoFile } from './lib/utils/fileUtils.js';

// Core framework exports
export {
  db,
  initDatabases,
  ErrorHandler,
  handleInteraction,
  logBanner,
  clogger as logger  // Export as 'logger' to match TypeScript declarations
};

// Unified BotFramework class that combines everything
export class BotFramework {
  constructor(options = {}) {
    this.options = options;
    this.initialized = false;
    this.logger = clogger; // Add logger as instance property
  }

  async initialize() {

    if (this.options.showBanner !== false) {
      logBanner();
    }
    
    await initDatabases();
    this.initialized = true;
    this.logger.success('Bot Framework initialized successfully!');
  }

  getDatabase() {
    return db;
  }

  getErrorHandler() {
    return ErrorHandler;
  }

  getLogger() {
    return this.logger;
  }

  async handleInteraction(interaction, client, logger = this.logger) {
    return await handleInteraction(interaction, client, logger);
  }
}

// Default export
export default BotFramework;