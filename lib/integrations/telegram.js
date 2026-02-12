/**
 * ClawBee Telegram Integration
 * Real working Telegram bot integration
 */

const axios = require('axios');

class TelegramBot {
  constructor(token) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
    this.offset = 0;
    this.running = false;
  }

  async getMe() {
    const response = await axios.get(`${this.baseUrl}/getMe`);
    return response.data.result;
  }

  async sendMessage(chatId, text, options = {}) {
    const response = await axios.post(`${this.baseUrl}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: options.parseMode || 'Markdown',
      ...options
    });
    return response.data.result;
  }

  async getUpdates(timeout = 30) {
    try {
      const response = await axios.get(`${this.baseUrl}/getUpdates`, {
        params: {
          offset: this.offset,
          timeout: timeout,
          allowed_updates: ['message', 'callback_query']
        },
        timeout: (timeout + 10) * 1000
      });
      
      const updates = response.data.result;
      if (updates.length > 0) {
        this.offset = updates[updates.length - 1].update_id + 1;
      }
      return updates;
    } catch (error) {
      if (error.code !== 'ETIMEDOUT') {
        throw error;
      }
      return [];
    }
  }

  async startPolling(messageHandler) {
    this.running = true;
    console.log('🐝 Telegram bot started polling...');

    while (this.running) {
      try {
        const updates = await this.getUpdates();
        
        for (const update of updates) {
          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const username = update.message.from.username || update.message.from.first_name;
            
            try {
              const response = await messageHandler(text, { 
                platform: 'telegram',
                chatId,
                username,
                messageId: update.message.message_id
              });
              
              await this.sendMessage(chatId, response);
            } catch (error) {
              await this.sendMessage(chatId, `❌ Error: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.error('Telegram polling error:', error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  stop() {
    this.running = false;
  }
}

module.exports = { TelegramBot };
