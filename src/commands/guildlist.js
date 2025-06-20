import { createResponse } from './index.js';
import { getAllMembers } from '../utils/storage.js';

export async function guildlistCommand(interaction, env) {
  try {
    const members = await getAllMembers(env.GUILD_KV);
    
    if (members.length === 0) {
      return createResponse('No guild members registered yet! Use `/register [ign]` to be the first!');
    }

    // Sort members by IGN alphabetically
    members.sort((a, b) => a.ign.toLowerCase().localeCompare(b.ign.toLowerCase()));

    // Create formatted list
    let memberList = `📋 **Guild Member Directory** (${members.length} members)\n\n`;
    
    // Split into chunks if too many members (Discord has 2000 char limit)
    const maxMembersPerMessage = 20;
    
    if (members.length <= maxMembersPerMessage) {
      // Show all members
      members.forEach((member, index) => {
        memberList += `${index + 1}. **${member.ign}** - <@${member.discordId}>\n`;
      });
    } else {
      // Show first 20 and mention there are more
      members.slice(0, maxMembersPerMessage).forEach((member, index) => {
        memberList += `${index + 1}. **${member.ign}** - <@${member.discordId}>\n`;
      });
      memberList += `\n*... and ${members.length - maxMembersPerMessage} more members*`;
    }

    // Add helpful footer
    memberList += `\n\n*Use \`/whois @user\` to look up specific members*`;

    return createResponse(memberList);
    
  } catch (error) {
    console.error('Error fetching guild list:', error);
    return createResponse('❌ Failed to fetch guild member list. Please try again later.', true);
  }
}