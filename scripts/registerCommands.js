const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const APPLICATION_ID = process.env.APPLICATION_ID;

const commands = [
  {
    name: 'register',
    description: 'Register or update your MapleStory IGN',
    options: [
      {
        type: 3, // STRING
        name: 'ign',
        description: 'Your MapleStory In-Game Name',
        required: true
      }
    ]
  },
  {
    name: 'whois',
    description: 'Look up someone\'s MapleStory IGN',
    options: [
      {
        type: 6, // USER
        name: 'user',
        description: 'Discord user to look up',
        required: true
      }
    ]
  },
  {
    name: 'needcarry',
    description: 'Request a carry for a boss',
    options: [
      {
        type: 3, // STRING
        name: 'boss',
        description: 'Which boss you need help with',
        required: true
      },
      {
        type: 3, // STRING
        name: 'notes',
        description: 'Additional notes (optional)',
        required: false
      }
    ]
  },
  {
    name: 'guildlist',
    description: 'Show all registered guild members'
  }
];

async function registerCommands() {
  const url = `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commands)
    });

    if (response.ok) {
      console.log('✅ Successfully registered slash commands!');
      const data = await response.json();
      console.log(`Registered ${data.length} commands:`, data.map(cmd => cmd.name));
    } else {
      console.error('❌ Failed to register commands');
      console.error('Status:', response.status);
      console.error('Response:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

registerCommands();