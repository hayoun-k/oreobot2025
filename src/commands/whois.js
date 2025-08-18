import { createResponse, createEmbedResponse } from './index.js';
import { getMemberData } from '../utils/storage.js';

// Configuration: Officer role detection
const OFFICER_CONFIG = {
  // Method 1: Check by role names (case insensitive)
  roleNames: ['officer', 'officers', 'guild officer', 'admin', 'moderator', 'mod', 'leader', 'guild leader'],
  
  // Method 2: Specific role IDs (more reliable, get these from Discord Developer Tools)
  // roleIds: ['1234567890123456789', '9876543210987654321'], // Uncomment and add your officer role IDs
  
  // Method 3: Permission-based (anyone with specific permissions)
  checkPermissions: false, // Set to true to check for admin/manage_guild permissions
  requiredPermissions: ['ADMINISTRATOR', 'MANAGE_GUILD'] // Discord permissions that count as officer
};

export async function whoisCommand(interaction, env) {
  const targetUser = interaction.data.options?.[0]?.value;
  const requestingUserId = interaction.member.user.id;
  
  // Helper function to check if user has officer role
  function hasOfficerRole(member) {
    if (!member || !member.roles) return false;
    
    // Method 1: Check by role names
    if (OFFICER_CONFIG.roleNames && OFFICER_CONFIG.roleNames.length > 0) {
      // This would require access to guild roles, which is limited in Workers
      // For now, we'll use a simpler approach with resolved data
    }
    
    // Method 2: Check specific role IDs (most reliable)
    if (OFFICER_CONFIG.roleIds && OFFICER_CONFIG.roleIds.length > 0) {
      return member.roles.some(roleId => OFFICER_CONFIG.roleIds.includes(roleId));
    }
    
    // Method 3: Check permissions (if available)
    if (OFFICER_CONFIG.checkPermissions && member.permissions) {
      const hasRequiredPermission = OFFICER_CONFIG.requiredPermissions.some(perm => 
        member.permissions & getPermissionBit(perm)
      );
      if (hasRequiredPermission) return true;
    }
    
    // Fallback: Check if roles array contains common officer role patterns
    // This is a simplified check when we don't have full guild data
    const roleCount = member.roles.length;
    return roleCount >= 2; // Simple heuristic: officers usually have multiple roles
  }
  
  // Helper function to get permission bit values
  function getPermissionBit(permission) {
    const permissions = {
      'ADMINISTRATOR': 0x8,
      'MANAGE_GUILD': 0x20,
      'MANAGE_ROLES': 0x10000000,
      'MANAGE_CHANNELS': 0x10
    };
    return permissions[permission] || 0;
  }
  
  // Missing user validation
  if (!targetUser) {
    const embed = {
      title: "⚠️ Missing User",
      description: "Please specify a Discord user to look up!",
      color: 0xFFC107, // Amber warning color
      fields: [
        {
          name: "💡 Example Usage",
          value: "`/whois @username`",
          inline: false
        },
        {
          name: "📋 Alternative",
          value: "Use `/guildlist` to see all registered members",
          inline: false
        }
      ],
      footer: {
        text: "OreoBot • MapleStory Guild Assistant"
      },
      timestamp: new Date().toISOString()
    };
    return createEmbedResponse(embed, true);
  }

  try {
    const memberData = await getMemberData(env.MEMBERS_KV, targetUser);
    
    // Get target user's member info from Discord (for role checking)
    let targetMember = null;
    let isOfficer = false;
    
    // Check if we have resolved member data (Discord provides this for mentioned users)
    if (interaction.data.resolved && interaction.data.resolved.members && interaction.data.resolved.members[targetUser]) {
      targetMember = interaction.data.resolved.members[targetUser];
      isOfficer = hasOfficerRole(targetMember);
    }
    
    // User not found case
    if (!memberData) {
      const embed = {
        title: "🔍 Member Not Found",
        description: `<@${targetUser}> is not registered in our guild directory.`,
        color: 0xFF9800, // Orange "not found" color
        fields: [
          {
            name: "📝 How to Register",
            value: "They can use `/register [IGN]` to join our directory!",
            inline: false
          },
          {
            name: "📋 See All Members",
            value: "Use `/guildlist` to view all registered members",
            inline: false
          }
        ],
        footer: {
          text: "Encourage them to register with /register [their_ign]"
        },
        timestamp: new Date().toISOString()
      };
      return createEmbedResponse(embed, true);
    }

    // Calculate some useful stats
    const registeredDate = new Date(memberData.registeredAt);
    const updatedDate = new Date(memberData.updatedAt);
    const daysSinceRegistration = Math.floor((new Date() - registeredDate) / (1000 * 60 * 60 * 24));
    const daysSinceUpdate = Math.floor((new Date() - updatedDate) / (1000 * 60 * 60 * 24));
    const isRecent = daysSinceRegistration <= 7;
    const hasBeenUpdated = memberData.registeredAt !== memberData.updatedAt;

    // Get user avatar for display
    let avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png"; // Default Discord avatar
    
    // Success embed with member information
    const embed = {
      title: `🎮 Member Profile${isOfficer ? ' 👑' : ''}`,
      description: `Information for <@${targetUser}>${isOfficer ? '\n*Guild Officer*' : ''}`,
      color: isOfficer ? 0xFFD700 : 0x4CAF50, // Gold for officers, green for regular members
      thumbnail: {
        url: avatarUrl
      },
      fields: [
        {
          name: "🎯 MapleStory IGN",
          value: `**${memberData.ign}**`,
          inline: true
        },
        {
          name: "👤 Discord User",
          value: `<@${memberData.discordId}>`,
          inline: true
        },
        {
          name: "📅 Member Since",
          value: `${registeredDate.toLocaleDateString()}\n*${daysSinceRegistration} days ago*`,
          inline: true
        }
      ],
      footer: {
        text: requestingUserId === targetUser 
          ? "This is your profile • Use /register to update your IGN"
          : "Use /register to add or update your own profile"
      },
      timestamp: new Date().toISOString()
    };

    // Add update information if profile has been modified
    if (hasBeenUpdated) {
      embed.fields.push({
        name: "🔄 Last Updated",
        value: `${updatedDate.toLocaleDateString()}\n*${daysSinceUpdate} days ago*`,
        inline: true
      });
    }

    // Add special badges/indicators
    const badges = [];
    if (isOfficer) badges.push("👑 Guild Officer");
    if (isRecent) badges.push("🆕 New Member");
    if (daysSinceUpdate <= 1) badges.push("⚡ Recently Active");
    if (daysSinceRegistration >= 30) badges.push("🏆 Veteran Member");
    if (hasBeenUpdated) badges.push("📝 Profile Updated");

    if (badges.length > 0) {
      embed.fields.push({
        name: "🏅 Status",
        value: badges.join("\n"),
        inline: true
      });
    }

    // Add helpful context if this is a self-lookup
    if (requestingUserId === targetUser) {
      embed.fields.push({
        name: "⚙️ Manage Your Profile",
        value: "• Use `/register [new_ign]` to update your IGN\n• Your profile appears in `/guildlist`\n• Others can find you with `/whois @you`",
        inline: false
      });
    } else {
      // Add interaction suggestions for looking up others
      const interactionText = isOfficer 
        ? "• Contact them for guild matters or questions\n• They can help with guild management\n• Show respect for their officer role"
        : "• Send them a friend request in MapleStory\n• Use `/needcarry` if you need boss help\n• Check `/guildlist` for more members";
      
      embed.fields.push({
        name: isOfficer ? "🤝 Officer Interaction" : "🤝 Guild Interaction",
        value: interactionText,
        inline: false
      });
    }

    return createEmbedResponse(embed, false);

  } catch (error) {
    console.error('Error in whois command:', error);
    
    const errorEmbed = {
      title: "💥 Lookup Failed",
      description: "Something went wrong while looking up that member.",
      color: 0xFF5722, // Red error color
      fields: [
        {
          name: "🔧 What to try",
          value: "• Make sure you mentioned a valid Discord user\n• Wait a moment and try again\n• Use `/guildlist` to see all registered members",
          inline: false
        },
        {
          name: "📝 Technical Details",
          value: `\`\`\`${error.message || 'Unknown lookup error'}\`\`\``,
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