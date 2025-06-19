import { createResponse } from './index.js';
import { setMemberData, getMemberData } from '../utils/storage.js';

export async function registerCommand(interaction, env) {
  const userId = interaction.member.user.id;
  const ign = interaction.data.options?.[0]?.value;

  if (!ign) {
    return createResponse('Please provide your MapleStory IGN!', true);
  }

  // Validate IGN (basic check)
  if (ign.length > 12 || ign.length < 2) {
    return createResponse('IGN must be between 2-12 characters!', true);
  }

  // Check if user is already registered
  const existingData = await getMemberData(env.GUILD_KV, userId);
  
  const memberData = {
    ign: ign,
    discordId: userId,
    username: interaction.member.user.username,
    registeredAt: existingData?.registeredAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setMemberData(env.GUILD_KV, userId, memberData);

  const action = existingData ? 'updated' : 'registered';
  return createResponse(`✅ Successfully ${action} your IGN as **${ign}**!`);
}