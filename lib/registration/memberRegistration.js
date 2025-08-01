import { db } from '../database/db.js';
import { ErrorHandler } from '../handlers/errors/main.js';
import logBanner from '../essentials/banner.js';
import logger from '../logger/logger.js';

export async function registerMembers(client) {
  const guilds = client.guilds.cache;
  let savedCount = 0;
  let totalMembers = 0;
  let processedGuilds = 0;
  logger.info(`🔄 Starting member registration for ${guilds.size} server(s)...`);
  if (guilds.size === 0) {
    logger.warn('Bot is not in any servers - no members to register');
    return;
  }
  for (const guild of guilds.values()) {
    try {
      logger.debug(`Fetching members from server: ${guild.name} (${guild.id})`);
      const members = await guild.members.fetch();
      totalMembers += members.size;
      logger.debug(`Found ${members.size} members in ${guild.name}`);
      let guildSavedCount = 0;
      for (const member of members.values()) {
        try {
          const memberData = prepareMemberData(member);
          await saveMemberToDatabase(memberData);
          savedCount++;
          guildSavedCount++;
          if (guildSavedCount % 100 === 0) {
            logger.debug(`Processed ${guildSavedCount}/${members.size} members in ${guild.name}...`);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          const isCritical = ErrorHandler.handleAndCheckCritical(
            error,
            `Saving member ${member.user.tag} (${member.id})`,
            logger
          );
          if (isCritical) {
            logger.error('🚨 Critical database error detected - stopping bot to prevent data corruption');
            process.exit(1);
          }
          logger.warn(`⚠️  Skipping member ${member.user.tag} due to error, continuing...`);
          continue;
        }
      }
      processedGuilds++;
      logger.success(`✅ Registered ${guildSavedCount} members from ${guild.name}`);
    } catch (error) {
      const isCritical = ErrorHandler.handleAndCheckCritical(
        error,
        `Fetching members from guild ${guild.name} (${guild.id})`,
        logger
      );
      if (isCritical) {
        logger.error('🚨 Critical error during member fetching - stopping bot');
        process.exit(1);
      }
      logger.warn(`⚠️  Failed to process server ${guild.name}, continuing with other servers...`);
      continue;
    }
  }
  if (savedCount > 0) {
    logger.success(`🎉 Member registration complete!`);
    logger.info(`📊 Successfully registered ${savedCount} members from ${processedGuilds}/${guilds.size} server(s)`);
    logBanner();  } else if (guilds.size > 0) {
    logger.warn('⚠️  No members were registered - check database connectivity and bot permissions');
    logger.info("💡 Make sure the bot has 'View Server Members' permission in your Discord server");
  }
}
function prepareMemberData(member) {
  const roles = member.roles.cache.map(role => role.id).join(',');
  const username = member.user.tag;
  const userId = member.id;
  const joinedAt = new Date(member.joinedTimestamp);
  const formattedJoinedAt = `${joinedAt.getFullYear()}-${(joinedAt.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${joinedAt.getDate().toString().padStart(2, '0')} ${joinedAt
    .getHours()
    .toString()
    .padStart(2, '0')}:${joinedAt.getMinutes().toString().padStart(2, '0')}:${joinedAt
    .getSeconds()
    .toString()
    .padStart(2, '0')}`;
  return {
    userId,
    username,
    roles,
    formattedJoinedAt,
  };
}
async function saveMemberToDatabase(memberData) {
  const {userId, username, roles, formattedJoinedAt} = memberData;
  await db.execute(
    `INSERT INTO Users (UserId, Username, Roles, JoinedServer)
     VALUES (?, ?, ?, ?) ON DUPLICATE KEY
    UPDATE Username=?, Roles=?, JoinedServer=?`,
    [userId, username, roles, formattedJoinedAt, username, roles, formattedJoinedAt]
  );
}