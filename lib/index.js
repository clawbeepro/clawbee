/**
 * ClawBee - Your Personal AI, Endless Possibilities
 * https://clawbee.pro
 * 
 * Main library entry point
 */

const { AIProvider } = require('./ai/provider');
const { SkillManager, builtInSkills } = require('./skills/manager');
const { SystemCommands } = require('./automation/system');
const { TelegramBot } = require('./integrations/telegram');

module.exports = {
  AIProvider,
  SkillManager,
  builtInSkills,
  SystemCommands,
  TelegramBot,
  version: '2.1.0'
};
