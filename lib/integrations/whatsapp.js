/**
 * ClawBee WhatsApp Integration
 * Real working WhatsApp integration using whatsapp-web.js
 * Connects via QR code scanning
 */

const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('os').homedir();

// Session directory for persistent login
const SESSION_DIR = `${path}/.local/share/clawbee/integrations/whatsapp`;

class WhatsAppBot {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.messageHandler = null;
    this.qrHandler = null;
    this.statusHandler = null;
  }

  /**
   * Initialize the WhatsApp client
   */
  async initialize() {
    // Dynamic import for whatsapp-web.js (ES module compatibility)
    const { Client, LocalAuth } = await import('whatsapp-web.js');

    // Ensure session directory exists
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: SESSION_DIR
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    return this;
  }

  /**
   * Start the WhatsApp bot
   * @param {Function} messageHandler - Function to handle incoming messages
   * @param {Object} options - Additional options
   */
  async start(messageHandler, options = {}) {
    if (!this.client) {
      await this.initialize();
    }

    this.messageHandler = messageHandler;
    this.qrHandler = options.onQR || null;
    this.statusHandler = options.onStatus || null;

    // QR Code event - display for scanning
    this.client.on('qr', (qr) => {
      console.log('\n🐝 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
      console.log('\nOpen WhatsApp > Settings > Linked Devices > Link a Device\n');
      
      if (this.qrHandler) {
        this.qrHandler(qr);
      }
    });

    // Ready event - successfully connected
    this.client.on('ready', () => {
      this.isReady = true;
      console.log('🐝 WhatsApp client is ready!');
      
      if (this.statusHandler) {
        this.statusHandler('ready', 'WhatsApp connected successfully');
      }
    });

    // Authentication success
    this.client.on('authenticated', () => {
      console.log('🐝 WhatsApp authenticated');
      
      if (this.statusHandler) {
        this.statusHandler('authenticated', 'Authentication successful');
      }
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('🐝 WhatsApp authentication failed:', msg);
      
      if (this.statusHandler) {
        this.statusHandler('auth_failure', msg);
      }
    });

    // Disconnected event
    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      console.log('🐝 WhatsApp disconnected:', reason);
      
      if (this.statusHandler) {
        this.statusHandler('disconnected', reason);
      }
    });

    // Message received event
    this.client.on('message', async (message) => {
      // Skip status updates and own messages
      if (message.isStatus || message.fromMe) return;

      const chat = await message.getChat();
      const contact = await message.getContact();

      const context = {
        platform: 'whatsapp',
        chatId: message.from,
        chatName: chat.name || contact.pushname || contact.number,
        username: contact.pushname || contact.name || contact.number,
        isGroup: chat.isGroup,
        messageId: message.id._serialized,
        timestamp: message.timestamp,
        hasMedia: message.hasMedia
      };

      // Only process text messages for now
      if (message.body && this.messageHandler) {
        try {
          // Show typing indicator
          await chat.sendStateTyping();

          // Get AI response
          const response = await this.messageHandler(message.body, context);

          // Send response
          await message.reply(response);
        } catch (error) {
          console.error('WhatsApp message handling error:', error);
          await message.reply(`❌ Error: ${error.message}`);
        }
      }
    });

    // Initialize client
    console.log('🐝 Initializing WhatsApp connection...');
    await this.client.initialize();
  }

  /**
   * Send a message to a specific chat
   * @param {string} chatId - WhatsApp chat ID (number@c.us for contacts, number-id@g.us for groups)
   * @param {string} content - Message content
   */
  async sendMessage(chatId, content) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    return this.client.sendMessage(chatId, content);
  }

  /**
   * Get all chats
   */
  async getChats() {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    return this.client.getChats();
  }

  /**
   * Get contact info
   * @param {string} contactId - Contact ID
   */
  async getContact(contactId) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    return this.client.getContactById(contactId);
  }

  /**
   * Get current connection state
   */
  getState() {
    return {
      isReady: this.isReady,
      state: this.client?.info?.wid ? 'connected' : 'disconnected',
      phoneNumber: this.client?.info?.wid?.user || null,
      platform: this.client?.info?.platform || null
    };
  }

  /**
   * Logout and clear session
   */
  async logout() {
    if (this.client) {
      await this.client.logout();
      this.isReady = false;
      
      // Clear session files
      if (fs.existsSync(SESSION_DIR)) {
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      }
    }
  }

  /**
   * Destroy client connection
   */
  async stop() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
    }
  }
}

/**
 * Format phone number to WhatsApp ID
 * @param {string} phoneNumber - Phone number with country code
 * @returns {string} WhatsApp chat ID
 */
function formatWhatsAppId(phoneNumber) {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  return `${cleaned}@c.us`;
}

module.exports = { WhatsAppBot, formatWhatsAppId };
