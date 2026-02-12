/**
 * ClawBee - Your Personal AI, Endless Possibilities
 * https://clawbee.pro
 * 
 * Main library entry point
 * Exports all modules for programmatic use
 */

const { AIProvider, AVAILABLE_MODELS, DEFAULT_MODELS } = require('./ai/provider');
const { SkillManager, builtInSkills } = require('./skills/manager');
const { SystemCommands } = require('./automation/system');
const { BrowserAutomation, scrapeUrl } = require('./automation/browser');
const { TelegramBot } = require('./integrations/telegram');
const { DiscordBot } = require('./integrations/discord');
const { SlackBot } = require('./integrations/slack');
const { WhatsAppBot, formatWhatsAppId } = require('./integrations/whatsapp');

module.exports = {
  // AI
  AIProvider,
  AVAILABLE_MODELS,
  DEFAULT_MODELS,
  
  // Skills
  SkillManager,
  builtInSkills,
  
  // Automation
  SystemCommands,
  BrowserAutomation,
  scrapeUrl,
  
  // Integrations
  TelegramBot,
  DiscordBot,
  SlackBot,
  WhatsAppBot,
  formatWhatsAppId,
  
  // Version
  version: '2.2.0'
};
