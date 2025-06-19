import { createResponse } from './index.js';
import { getMemberData } from '../utils/storage.js';

export async function whoisCommand(interaction, env) {
  const targetUser = interaction.data.options?.[0]?.value;
  
  if (!targetUser) {
    return createResponse('Please specify a user to look up!', true);
  }

  const memberData = await getMemberData(env.GUILD_KV, targetUser);
  
  if (!memberData) {
    return createResponse('User not found in guild directory!', true);
  }

  const response = `**${memberData.username}**\n` +
    `MapleStory IGN: **${memberData.ign}**\n` +
    `Registered: ${new Date(memberData.registeredAt).toLocaleDateString()}`;

  return createResponse(response);
}
