/**
 * ClawBee Discord Integration
 * Real working Discord bot integration
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');

class DiscordBot {
  constructor(token) {
    this.token = token;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ],
      partials: [Partials.Channel, Partials.Message]
    });
    this.messageHandler = null;
  }

  async start(messageHandler) {
    this.messageHandler = messageHandler;

    this.client.on('ready', () => {
      console.log(`🐝 Discord bot logged in as ${this.client.user.tag}`);
    });

    this.client.on('messageCreate', async (message) => {
      // Ignore bot messages
      if (message.author.bot) return;
      
      // Check if bot is mentioned or in DM
      const isMentioned = message.mentions.has(this.client.user);
      const isDM = !message.guild;
      
      if (!isMentioned && !isDM) return;

      // Remove mention from message
      let content = message.content.replace(/<@!?\d+>/g, '').trim();
      
      if (!content) {
        content = 'Hello!';
      }

      try {
        await message.channel.sendTyping();
        
        const response = await this.messageHandler(content, {
          platform: 'discord',
          channelId: message.channel.id,
          username: message.author.username,
          userId: message.author.id,
          guildId: message.guild?.id
        });

        // Split long messages
        if (response.length > 2000) {
          const chunks = response.match(/.{1,2000}/g);
          for (const chunk of chunks) {
            await message.reply(chunk);
          }
        } else {
          await message.reply(response);
        }
      } catch (error) {
        await message.reply(`❌ Error: ${error.message}`);
      }
    });

    await this.client.login(this.token);
  }

  stop() {
    this.client.destroy();
  }

  async sendMessage(channelId, content) {
    const channel = await this.client.channels.fetch(channelId);
    return channel.send(content);
  }
}

module.exports = { DiscordBot };
