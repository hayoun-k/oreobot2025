import { setMemberData, getMemberData } from '../utils/storage.js';

// Enhanced createEmbedResponse function
export function createEmbedResponse(embed, ephemeral = false) {
  return new Response(JSON.stringify({
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      embeds: [embed],
      flags: ephemeral ? 64 : 0
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function registerCommand(interaction, env) {
  const userId = interaction.member.user.id;
  const ign = interaction.data.options?.[0]?.value;
  const username = interaction.member.user.username;
  const userAvatar = interaction.member.user.avatar;

  // Missing IGN validation
  if (!ign) {
    const embed = {
      title: "⚠️ Missing Information",
      description: "Please provide your MapleStory IGN to register!",
      color: 0xFFC107, // Amber warning color
      fields: [
        {
          name: "💡 Example Usage",
          value: "`/register MyMapleIGN`",
          inline: false
        }
      ],
      footer: {
        text: "OreoBot • MapleStory Guild Assistant",
        icon_url: "https://cdn.discordapp.com/emojis/1234567890123456789.png" // Optional: Add your bot's icon
      },
      timestamp: new Date().toISOString()
    };
    return createEmbedResponse(embed, true);
  }

  // IGN length validation
  if (ign.length > 12 || ign.length < 2) {
    const embed = {
      title: "❌ Invalid IGN Length",
      description: "MapleStory IGNs must be between **2-12 characters** long!",
      color: 0xFF5722, // Red error color
      fields: [
        {
          name: "📏 Your IGN",
          value: `\`${ign}\` (${ign.length} characters)`,
          inline: true
        },
        {
          name: "✅ Valid Range",
          value: "2-12 characters",
          inline: true
        }
      ],
      footer: {
        text: "Please try again with a valid IGN"
      }
    };
    return createEmbedResponse(embed, true);
  }

  // Special character validation (optional enhancement)
  const validIGNPattern = /^[a-zA-Z0-9]+$/;
  if (!validIGNPattern.test(ign)) {
    const embed = {
      title: "❌ Invalid Characters",
      description: "MapleStory IGNs can only contain **letters and numbers**!",
      color: 0xFF5722,
      fields: [
        {
          name: "🚫 Your IGN",
          value: `\`${ign}\``,
          inline: true
        },
        {
          name: "✅ Allowed Characters",
          value: "A-Z, a-z, 0-9",
          inline: true
        }
      ],
      footer: {
        text: "Please try again with only letters and numbers"
      }
    };
    return createEmbedResponse(embed, true);
  }

  try {
    // Check if user is already registered
    const existingData = await getMemberData(env.MEMBERS_KV, userId);
    const isUpdate = !!existingData;
    const previousIGN = existingData?.ign;
    
    const memberData = {
      ign: ign,
      discordId: userId,
      username: username,
      registeredAt: existingData?.registeredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setMemberData(env.MEMBERS_KV, userId, memberData);

    // Success embed with different content for new vs update
    const embed = {
      title: `🎉 ${isUpdate ? 'Profile Updated!' : 'Welcome to the Guild!'}`,
      description: isUpdate 
        ? `Your MapleStory IGN has been successfully updated!`
        : `You've been registered in our guild directory!`,
      color: 0x4CAF50, // Green success color
      thumbnail: {
        url: userAvatar 
          ? `https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png`
          : "https://cdn.discordapp.com/embed/avatars/0.png"
      },
      fields: [
        {
          name: "🎮 MapleStory IGN",
          value: `**${ign}**`,
          inline: true
        },
        {
          name: "👤 Discord User",
          value: `<@${userId}>`,
          inline: true
        },
        {
          name: "📅 Action",
          value: isUpdate ? "Profile Updated" : "New Registration",
          inline: true
        }
      ],
      footer: {
        text: "Use /guildlist to see all registered members • /whois to look up others"
      },
      timestamp: new Date().toISOString()
    };

    // Add previous IGN field if this was an update
    if (isUpdate && previousIGN !== ign) {
      embed.fields.splice(2, 0, {
        name: "🔄 Previous IGN",
        value: `~~${previousIGN}~~`,
        inline: true
      });
    }

    // Add some encouraging flavor text for new users
    if (!isUpdate) {
      embed.fields.push({
        name: "🚀 What's Next?",
        value: "• Use `/needcarry [boss]` when you need help\n• Check `/guildlist` to see other members\n• Look forward to weekly boss reminders!",
        inline: false
      });
    }

    return createEmbedResponse(embed, false);

  } catch (error) {
    console.error('Registration error:', error);
    
    const errorEmbed = {
      title: "💥 Registration Failed",
      description: "Something went wrong while processing your registration. Our developers have been notified!",
      color: 0xFF5722, // Red error color
      fields: [
        {
          name: "🔧 What to try",
          value: "• Wait a moment and try again\n• Make sure your IGN is valid\n• Contact a guild officer if the problem persists",
          inline: false
        },
        {
          name: "📝 Error Details",
          value: `\`\`\`${error.message || 'Unknown error occurred'}\`\`\``,
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