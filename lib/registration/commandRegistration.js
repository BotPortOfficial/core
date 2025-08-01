import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v10';
import logger from '../logger/logger.js';
import {isDebug} from '../config/environment.js';
export async function registerCommands(client) {
  if (!process.env.TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
    logger.error('Missing required environment variables: TOKEN, CLIENT_ID, or GUILD_ID');
    logger.error('Please check your .env file configuration');
    return;
  }
  const rest = new REST({version: '10'}).setToken(process.env.TOKEN);
  const commandsData = client.commands.map(cmd => cmd.data.toJSON());
  if (commandsData.length === 0) {
    logger.warn('No commands to register - skipping command registration');
    return;
  }
  logger.debug(`Registering ${commandsData.length} commands with Discord API...`);
  try {
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {body: commandsData});
    logger.success(`🎉 Successfully registered ${commandsData.length} command(s) in guild: ${process.env.GUILD_ID}`);
    logger.info('Commands are now available as slash commands in your Discord server!');
  } catch (error) {
    logger.error('❌ Failed to register commands with Discord:', error.message);
    handleRegistrationError(error);
  }
}
function handleRegistrationError(error) {
  if (!isDebug) return;
  logger.debug('Command registration debug info:');
  logger.debug(`Client ID: ${process.env.CLIENT_ID}`);
  logger.debug(`Guild ID: ${process.env.GUILD_ID}`);
  if (error.code) {
    logger.debug(`Discord API Error Code: ${error.code}`);
  }
  switch (error.code) {
    case 50001:
      logger.error('💡 Bot is missing access to the guild. Make sure the bot is added to your server.');
      break;
    case 50013:
      logger.error("💡 Bot lacks permissions. Ensure it has 'applications.commands' scope.");
      break;
    case 401:
      logger.error('💡 Invalid bot token. Check your TOKEN in the .env file.');
      break;
    default:
      logger.debug(`Full error: ${error.stack}`);
  }
}
