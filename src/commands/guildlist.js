import { createResponse, createEmbedResponse } from './index.js';
import { getAllMembers } from '../utils/storage.js';

export async function guildlistCommand(interaction, env) {
  try {
    const members = await getAllMembers(env.MEMBERS_KV);
    
    // Empty guild case
    if (members.length === 0) {
      const embed = {
        title: "🏰 Guild Member Directory",
        description: "No guild members registered yet!\n\nUse `/register [ign]` to be the first to join our directory!",
        color: 0x6C7B7F, // Gray color for empty state
        thumbnail: {
          url: "https://cdn.discordapp.com/emojis/🏰.png" // Optional: Castle emoji as image
        },
        fields: [
          {
            name: "🎯 Getting Started",
            value: "• Use `/register YourIGN` to add yourself\n• Use `/needcarry [boss]` when you need help\n• Check back here to see the guild grow!",
            inline: false
          }
        ],
        footer: {
          text: "OreoBot • MapleStory Guild Assistant"
        },
        timestamp: new Date().toISOString()
      };
      return createEmbedResponse(embed);
    }

    // Sort members alphabetically by IGN
    members.sort((a, b) => a.ign.toLowerCase().localeCompare(b.ign.toLowerCase()));

    // Pagination settings
    const maxMembersPerPage = 20;
    const totalPages = Math.ceil(members.length / maxMembersPerPage);
    const currentPage = 1; // For now, always show page 1. Could add pagination later.
    const startIndex = (currentPage - 1) * maxMembersPerPage;
    const endIndex = Math.min(startIndex + maxMembersPerPage, members.length);
    const displayMembers = members.slice(startIndex, endIndex);
    
    // Create formatted member list with better styling
    const memberList = displayMembers.map((member, index) => {
      const globalIndex = startIndex + index + 1;
      const paddedNumber = String(globalIndex).padStart(2, '0');
      return `\`${paddedNumber}.\` **${member.ign}** • <@${member.discordId}>`;
    }).join('\n');

    // Calculate some fun statistics
    const registrationDates = members.map(m => new Date(m.registeredAt));
    const oldestRegistration = new Date(Math.min(...registrationDates));
    const newestRegistration = new Date(Math.max(...registrationDates));
    const daysSinceFirst = Math.floor((new Date() - oldestRegistration) / (1000 * 60 * 60 * 24));

    const embed = {
      title: "🏰 Guild Member Directory",
      description: memberList,
      color: 0x4CAF50, // Green success color
      thumbnail: {
        url: "https://i.imgur.com/YourGuildLogo.png" // Optional: Add your guild logo
      },
      fields: [
        {
          name: "📊 Guild Statistics",
          value: `**Total Members:** ${members.length}\n**Days Active:** ${daysSinceFirst}\n**Newest Member:** ${members.find(m => m.registeredAt === newestRegistration.toISOString())?.ign || 'Unknown'}`,
          inline: true
        },
        {
          name: "📈 Growth Info",
          value: `**This Page:** ${displayMembers.length} members\n**Pages:** ${currentPage} of ${totalPages}\n**Recently Active:** ${members.filter(m => {
            const daysSinceUpdate = (new Date() - new Date(m.updatedAt)) / (1000 * 60 * 60 * 24);
            return daysSinceUpdate <= 7;
          }).length} (7 days)`,
          inline: true
        }
      ],
      footer: {
        text: `Page ${currentPage}/${totalPages} • Use /whois @user for member details • Updated ${new Date().toLocaleTimeString()}`
      },
      timestamp: new Date().toISOString()
    };

    // Add pagination info if there are multiple pages
    if (totalPages > 1) {
      embed.fields.push({
        name: "📄 Pagination Info",
        value: `Showing members ${startIndex + 1}-${endIndex} of ${members.length}\n*Pagination coming soon!*`,
        inline: false
      });
    }

    // Add helpful commands section for smaller guilds
    if (members.length <= 5) {
      embed.fields.push({
        name: "🚀 Grow Your Guild",
        value: "• Share `/register` with new members\n• Use `/needcarry` to help each other\n• Weekly boss reminders keep everyone active!",
        inline: false
      });
    }

    return createEmbedResponse(embed);
    
  } catch (error) {
    console.error('Error fetching guild list:', error);
    
    const errorEmbed = {
      title: "❌ Directory Unavailable",
      description: "Unable to load the guild member directory right now.",
      color: 0xFF5722, // Red error color
      fields: [
        {
          name: "🔧 What to try",
          value: "• Wait a moment and try again\n• Check if the bot has proper permissions\n• Contact a guild officer if this persists",
          inline: false
        },
        {
          name: "📝 Technical Details",
          value: `\`\`\`${error.message || 'Unknown database error'}\`\`\``,
          inline: false
        }
      ],
      footer: {
        text: "Error logged • Please try again in a few moments"
      },
      timestamp: new Date().toISOString()
    };
    
    return createEmbedResponse(errorEmbed, true);
  }
}