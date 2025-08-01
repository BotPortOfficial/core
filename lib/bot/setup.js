import {Client, Collection} from 'discord.js';
import {GatewayIntentBits} from 'discord.js';
import { handleInteraction } from '../handlers/interactions/interactions.js';
import logger from '../logger/logger.js';
import {loadCommands} from '../loaders/commandLoader.js';
import {loadEvents} from '../loaders/eventLoader.js';
import {loadAddonsIfEnabled} from '../loaders/addonLoader.js';
import {registerCommands} from '../registration/commandRegistration.js';
import {registerMembers} from '../registration/memberRegistration.js';
export async function setupBot() {
  logger.info('🤖 Setting up Discord bot...');
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });
  client.commands = new Collection();
  logger.debug('Discord client created with required intents');
  const commandsLoaded = await loadCommands(client);
  await loadEvents(client);
  client.on('interactionCreate', async interaction => {
    try {
      await handleInteraction(interaction, client, logger);
    } catch (error) {
      logger.error('Error handling interaction:', error);
    }
  });
  client.once('ready', async () => {
    await handleBotReady(client, commandsLoaded);
  });
  return client;
}
async function handleBotReady(client, commandsLoaded) {
  const readyMessage = `🎉 ${client.user?.tag} is now online and ready!`;
  logger.success(readyMessage);
  logger.info(`📡 Connected to Discord as: ${client.user?.tag}`);
  logger.info(`🌐 Serving ${client.guilds.cache.size} server(s) with ${client.users.cache.size} users`);
  if (commandsLoaded) {
    await registerCommands(client);
  }
  await loadAddonsIfEnabled(client);
  await registerMembers(client);
  globalThis.client = client;
}
