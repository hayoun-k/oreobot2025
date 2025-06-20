import { createResponse } from './index.js';
import { getMemberData } from '../utils/storage.js';

export async function needcarryCommand(interaction, env) {
  const userId = interaction.member.user.id;
  const username = interaction.member.user.username;
  const boss = interaction.data.options?.[0]?.value;
  const notes = interaction.data.options?.[1]?.value || '';

  if (!boss) {
    return createResponse('Please specify which boss you need help with!', true);
  }

  // Check if user is registered
  const memberData = await getMemberData(env.MEMBERS_KV, userId);
  if (!memberData) {
    return createResponse('Please register your IGN first using `/register [your_ign]`!', true);
  }

  // Create carry request message
  const carryRequest = {
    content: `🆘 **Carry Request**\n\n` +
      `**Player:** ${username} (IGN: **${memberData.ign}**)\n` +
      `**Boss:** ${boss}\n` +
      `**Notes:** ${notes || 'None'}\n` +
      `**Requested:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
      `React with ✋ to help out!`
  };

  // Send to carry channel via webhook
  try {
    const webhookUrl = env.CARRY_CHANNEL_WEBHOOK; // You'll need to set this up
    
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carryRequest)
      });
      
      if (response.ok) {
        return createResponse('✅ Your carry request has been posted to the carry channel!', true);
      }
    }
    
    // Fallback: respond in current channel if webhook not set up
    return createResponse(
      `✅ Carry request created!\n\n${carryRequest.content}`,
      false
    );
    
  } catch (error) {
    console.error('Error posting carry request:', error);
    return createResponse('❌ Failed to post carry request. Please try again later.', true);
  }
}