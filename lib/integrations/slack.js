/**
 * ClawBee Slack Integration
 * Real working Slack bot integration
 */

const { App } = require('@slack/bolt');

class SlackBot {
  constructor(botToken, signingSecret, appToken) {
    this.app = new App({
      token: botToken,
      signingSecret: signingSecret,
      appToken: appToken,
      socketMode: !!appToken
    });
    this.messageHandler = null;
  }

  async start(messageHandler) {
    this.messageHandler = messageHandler;

    // Listen for app mentions
    this.app.event('app_mention', async ({ event, say }) => {
      const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
      
      try {
        const response = await this.messageHandler(text, {
          platform: 'slack',
          channelId: event.channel,
          userId: event.user,
          threadTs: event.thread_ts || event.ts
        });

        await say({
          text: response,
          thread_ts: event.thread_ts || event.ts
        });
      } catch (error) {
        await say({
          text: `❌ Error: ${error.message}`,
          thread_ts: event.thread_ts || event.ts
        });
      }
    });

    // Listen for direct messages
    this.app.event('message', async ({ event, say }) => {
      if (event.channel_type !== 'im' || event.bot_id) return;

      try {
        const response = await this.messageHandler(event.text, {
          platform: 'slack',
          channelId: event.channel,
          userId: event.user
        });

        await say(response);
      } catch (error) {
        await say(`❌ Error: ${error.message}`);
      }
    });

    await this.app.start();
    console.log('🐝 Slack bot started');
  }

  async stop() {
    await this.app.stop();
  }
}

module.exports = { SlackBot };
