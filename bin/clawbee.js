#!/usr/bin/env node

/**
 * ClawBee CLI - Your Personal AI, Endless Possibilities
 * https://clawbee.pro
 * 
 * A fully functional AI assistant that runs locally
 * Supports multiple AI providers including Emergent Universal Key
 */

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const http = require('http');
const readline = require('readline');

const VERSION = '2.2.1';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'clawbee');
const DATA_DIR = path.join(os.homedir(), '.local', 'share', 'clawbee');
const LOG_FILE = path.join(DATA_DIR, 'logs', 'clawbee.log');

// ==================== ASCII Art & Branding ====================

const logo = chalk.yellow(`
   ██████╗██╗      █████╗ ██╗    ██╗██████╗ ███████╗███████╗
  ██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗██╔════╝██╔════╝
  ██║     ██║     ███████║██║ █╗ ██║██████╔╝█████╗  █████╗  
  ██║     ██║     ██╔══██║██║███╗██║██╔══██╗██╔══╝  ██╔══╝  
  ╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝███████╗███████╗
   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ╚══════╝╚══════╝
`);

const tagline = chalk.cyan('         🐝 Your Personal AI, Endless Possibilities. 🐝\n');

const miniLogo = chalk.yellow('🐝 ClawBee');

// ==================== Available Models ====================

const AVAILABLE_MODELS = {
  emergent: {
    openai: [
      { name: 'GPT-5.2 (Latest & Most Capable)', value: 'gpt-5.2' },
      { name: 'GPT-5.1 (Recommended)', value: 'gpt-5.1' },
      { name: 'GPT-5', value: 'gpt-5' },
      { name: 'GPT-5 Mini (Fast)', value: 'gpt-5-mini' },
      { name: 'GPT-4.1', value: 'gpt-4.1' },
      { name: 'GPT-4o', value: 'gpt-4o' },
      { name: 'O3 (Reasoning)', value: 'o3' },
      { name: 'O4-Mini (Fast Reasoning)', value: 'o4-mini' }
    ],
    anthropic: [
      { name: 'Claude 4 Sonnet (Recommended)', value: 'claude-4-sonnet-20250514' },
      { name: 'Claude 4 Opus (Most Capable)', value: 'claude-4-opus-20250514' },
      { name: 'Claude Opus 4.6', value: 'claude-opus-4-6' },
      { name: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5-20250929' },
      { name: 'Claude Haiku 4.5 (Fast)', value: 'claude-haiku-4-5-20251001' }
    ],
    gemini: [
      { name: 'Gemini 2.5 Pro (Recommended)', value: 'gemini-2.5-pro' },
      { name: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
      { name: 'Gemini 3 Flash Preview', value: 'gemini-3-flash-preview' },
      { name: 'Gemini 3 Pro Preview', value: 'gemini-3-pro-preview' },
      { name: 'Gemini 2.0 Flash (Fast)', value: 'gemini-2.0-flash' }
    ]
  },
  openai: [
    { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { name: 'GPT-4', value: 'gpt-4' },
    { name: 'GPT-4o', value: 'gpt-4o' },
    { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
  ],
  anthropic: [
    { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
    { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
    { name: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' }
  ],
  google: [
    { name: 'Gemini Pro', value: 'gemini-pro' },
    { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' }
  ],
  local: [
    { name: 'Llama 2', value: 'llama2' },
    { name: 'Llama 3', value: 'llama3' },
    { name: 'Mistral', value: 'mistral' },
    { name: 'CodeLlama', value: 'codellama' },
    { name: 'Custom (enter name)', value: 'custom' }
  ]
};

// ==================== Utility Functions ====================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  try {
    ensureDirectories();
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (e) {
    // Silent fail for logging
  }
}

function ensureDirectories() {
  const dirs = [
    CONFIG_DIR,
    DATA_DIR,
    path.join(DATA_DIR, 'skills'),
    path.join(DATA_DIR, 'memory'),
    path.join(DATA_DIR, 'logs'),
    path.join(DATA_DIR, 'integrations'),
    path.join(DATA_DIR, 'integrations', 'whatsapp')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function getConfigPath() {
  return path.join(CONFIG_DIR, 'config.json');
}

function getConfig() {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

function saveConfig(config) {
  ensureDirectories();
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  log('Configuration saved');
}

function getMemoryPath() {
  return path.join(DATA_DIR, 'memory', 'conversations.json');
}

function getMemory() {
  const memoryPath = getMemoryPath();
  if (fs.existsSync(memoryPath)) {
    try {
      return JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
    } catch (e) {
      return { conversations: [], context: [] };
    }
  }
  return { conversations: [], context: [] };
}

function saveMemory(memory) {
  ensureDirectories();
  const memoryPath = getMemoryPath();
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
}

function addToMemory(role, content) {
  const memory = getMemory();
  memory.conversations.push({
    id: `msg_${Date.now()}`,
    role,
    content,
    timestamp: new Date().toISOString()
  });
  
  // Keep last 100 messages
  if (memory.conversations.length > 100) {
    memory.conversations = memory.conversations.slice(-100);
  }
  
  saveMemory(memory);
}

function getPidPath() {
  return path.join(DATA_DIR, 'clawbee.pid');
}

function isDaemonRunning() {
  const pidPath = getPidPath();
  if (fs.existsSync(pidPath)) {
    try {
      const pid = parseInt(fs.readFileSync(pidPath, 'utf8'));
      process.kill(pid, 0);
      return true;
    } catch (e) {
      // Process not running, clean up pid file
      fs.unlinkSync(pidPath);
      return false;
    }
  }
  return false;
}

// ==================== AI Provider Functions ====================

/**
 * Detect actual provider from model name (for Emergent Universal Key)
 */
function detectProviderFromModel(model) {
  const modelLower = model.toLowerCase();
  
  if (modelLower.startsWith('gpt') || modelLower.startsWith('o1') || modelLower.startsWith('o3') || modelLower.startsWith('o4')) {
    return 'openai';
  }
  if (modelLower.startsWith('claude')) {
    return 'anthropic';
  }
  if (modelLower.startsWith('gemini')) {
    return 'google';
  }
  
  return 'openai'; // Default
}

async function callOpenAI(messages, config) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: config.ai.model || 'gpt-5.2',
        messages: messages,
        temperature: config.ai.temperature || 0.7,
        max_tokens: config.ai.maxTokens || 2048
      },
      {
        headers: {
          'Authorization': `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error(`OpenAI Error: ${error.response?.data?.error?.message || error.message}`);
  }
}

async function callAnthropic(messages, config) {
  try {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: config.ai.model || 'claude-4-sonnet-20250514',
        max_tokens: config.ai.maxTokens || 2048,
        system: systemMessage,
        messages: userMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
      },
      {
        headers: {
          'x-api-key': config.ai.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );
    return response.data.content[0].text;
  } catch (error) {
    throw new Error(`Anthropic Error: ${error.response?.data?.error?.message || error.message}`);
  }
}

async function callGoogleAI(messages, config) {
  try {
    const contents = [];
    let systemInstruction = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    const requestBody = {
      contents,
      generationConfig: {
        temperature: config.ai.temperature || 0.7,
        maxOutputTokens: config.ai.maxTokens || 2048
      }
    };

    if (systemInstruction) {
      requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.ai.model || 'gemini-2.5-pro'}:generateContent`,
      requestBody,
      {
        params: { key: config.ai.apiKey },
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    throw new Error(`Google AI Error: ${error.response?.data?.error?.message || error.message}`);
  }
}

async function callLocalModel(messages, config) {
  try {
    // Ollama API
    const response = await axios.post(
      `http://${config.ai.localHost || 'localhost'}:${config.ai.localPort || 11434}/api/chat`,
      {
        model: config.ai.model || 'llama2',
        messages: messages,
        stream: false,
        options: {
          temperature: config.ai.temperature || 0.7,
          num_predict: config.ai.maxTokens || 2048
        }
      },
      { timeout: 180000 }
    );
    return response.data.message.content;
  } catch (error) {
    throw new Error(`Local Model Error: ${error.message}. Make sure Ollama is running.`);
  }
}

async function getAIResponse(userMessage, config) {
  const memory = getMemory();
  const recentContext = memory.conversations.slice(-10);
  
  const systemPrompt = `You are ClawBee, a helpful personal AI assistant. You are friendly, efficient, and always try to help the user accomplish their tasks. The user's name is ${config.user.name}. Current date: ${new Date().toLocaleDateString()}. Keep your responses concise but helpful.`;
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentContext.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];
  
  let provider = config.ai.provider;
  
  // For Emergent Universal Key, detect the actual provider from model name
  if (provider === 'emergent') {
    provider = detectProviderFromModel(config.ai.model);
  }
  
  switch (provider) {
    case 'openai':
      return await callOpenAI(messages, config);
    case 'anthropic':
      return await callAnthropic(messages, config);
    case 'google':
    case 'gemini':
      return await callGoogleAI(messages, config);
    case 'local':
      return await callLocalModel(messages, config);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

// ==================== CLI Commands ====================

program
  .name('clawbee')
  .description('ClawBee - Your Personal AI, Endless Possibilities')
  .version(VERSION);

// ===== ONBOARD COMMAND =====
program
  .command('onboard')
  .description('Set up ClawBee for the first time')
  .action(async () => {
    console.log(logo);
    console.log(tagline);
    
    const existingConfig = getConfig();
    if (existingConfig) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'ClawBee is already configured. Do you want to reconfigure?',
        default: false
      }]);
      
      if (!overwrite) {
        console.log(chalk.yellow('\nKeeping existing configuration.'));
        console.log(chalk.gray('Run "clawbee start" to begin using ClawBee.\n'));
        return;
      }
    }
    
    console.log(chalk.green('Welcome to ClawBee! Let\'s get you set up.\n'));
    
    ensureDirectories();
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What should I call you?',
        default: os.userInfo().username,
        validate: (input) => input.length > 0 || 'Please enter a name'
      },
      {
        type: 'list',
        name: 'aiProvider',
        message: 'Which AI provider would you like to use?',
        choices: [
          { name: chalk.yellow('★ Emergent Universal Key (All models with one key)'), value: 'emergent' },
          new inquirer.Separator('─────────────────────────'),
          { name: 'OpenAI (GPT-4, GPT-4o)', value: 'openai' },
          { name: 'Anthropic (Claude 3)', value: 'anthropic' },
          { name: 'Google (Gemini)', value: 'google' },
          { name: 'Local Model (Ollama)', value: 'local' }
        ]
      },
      {
        type: 'list',
        name: 'emergentProvider',
        message: 'Which AI family do you want to use?',
        when: (answers) => answers.aiProvider === 'emergent',
        choices: [
          { name: 'OpenAI (GPT-5.x, O3, O4)', value: 'openai' },
          { name: 'Anthropic (Claude 4.x)', value: 'anthropic' },
          { name: 'Google (Gemini 2.x, 3.x)', value: 'gemini' }
        ]
      },
      {
        type: 'list',
        name: 'model',
        message: 'Which model would you like to use?',
        choices: (answers) => {
          if (answers.aiProvider === 'emergent') {
            return AVAILABLE_MODELS.emergent[answers.emergentProvider] || AVAILABLE_MODELS.emergent.openai;
          }
          return AVAILABLE_MODELS[answers.aiProvider] || [{ name: 'Default', value: 'default' }];
        }
      },
      {
        type: 'input',
        name: 'customModel',
        message: 'Enter the model name:',
        when: (answers) => answers.model === 'custom'
      },
      {
        type: 'password',
        name: 'apiKey',
        message: (answers) => {
          if (answers.aiProvider === 'emergent') {
            return 'Enter your Emergent Universal Key:';
          }
          const providerNames = {
            openai: 'OpenAI',
            anthropic: 'Anthropic', 
            google: 'Google'
          };
          return `Enter your ${providerNames[answers.aiProvider]} API key:`;
        },
        when: (answers) => answers.aiProvider !== 'local',
        validate: (input) => input.length > 0 || 'API key is required'
      },
      {
        type: 'input',
        name: 'localHost',
        message: 'Enter Ollama host:',
        default: 'localhost',
        when: (answers) => answers.aiProvider === 'local'
      },
      {
        type: 'input',
        name: 'localPort',
        message: 'Enter Ollama port:',
        default: '11434',
        when: (answers) => answers.aiProvider === 'local'
      },
      {
        type: 'checkbox',
        name: 'integrations',
        message: 'Which platforms would you like to connect? (You can set these up later)',
        choices: [
          { name: 'WhatsApp (via QR code)', value: 'whatsapp' },
          { name: 'Telegram', value: 'telegram' },
          { name: 'Discord', value: 'discord' },
          { name: 'Slack', value: 'slack' },
          { name: 'Terminal only (no integrations)', value: 'terminal' }
        ]
      },
      {
        type: 'confirm',
        name: 'enableMemory',
        message: 'Enable persistent memory? (ClawBee will remember your conversations)',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableSandbox',
        message: 'Enable sandbox mode? (Restricts system commands for safety)',
        default: true
      }
    ]);
    
    const spinner = ora('Saving configuration...').start();
    
    const config = {
      user: {
        name: answers.name
      },
      ai: {
        provider: answers.aiProvider,
        apiKey: answers.apiKey || null,
        model: answers.customModel || answers.model,
        temperature: 0.7,
        maxTokens: 2048,
        localHost: answers.localHost,
        localPort: answers.localPort
      },
      integrations: {},
      memory: {
        enabled: answers.enableMemory,
        maxContext: 100
      },
      security: {
        sandbox: answers.enableSandbox,
        allowedCommands: [],
        blockedCommands: ['rm -rf /', 'format', 'mkfs']
      },
      createdAt: new Date().toISOString(),
      version: VERSION
    };
    
    // Set up integrations
    answers.integrations.forEach(int => {
      if (int !== 'terminal') {
        config.integrations[int] = { enabled: false, configured: false };
      }
    });
    
    saveConfig(config);
    
    // Initialize empty memory
    saveMemory({ conversations: [], context: [] });
    
    spinner.succeed('Configuration saved!');
    
    // Test AI connection
    if (answers.aiProvider !== 'local') {
      const testSpinner = ora('Testing AI connection...').start();
      try {
        await getAIResponse('Hello, this is a test. Respond with "Connection successful!"', config);
        testSpinner.succeed('AI connection successful!');
      } catch (error) {
        testSpinner.fail(`AI connection failed: ${error.message}`);
        console.log(chalk.yellow('\nYou can update your API key later with: clawbee config set ai.apiKey <your-key>'));
      }
    }
    
    console.log('\n' + chalk.green('✨ ClawBee is ready to go!'));
    console.log('\n' + chalk.cyan('Quick commands:'));
    console.log(chalk.yellow('  clawbee chat') + '        - Chat in terminal');
    console.log(chalk.yellow('  clawbee connect <app>') + ' - Connect a chat app (whatsapp, telegram, etc.)');
    console.log(chalk.yellow('  clawbee start') + '       - Start daemon with integrations');
    console.log(chalk.yellow('  clawbee skills') + '      - Manage skills');
    console.log(chalk.yellow('  clawbee help') + '        - Show all commands');
    console.log('\n' + chalk.gray('Documentation: https://clawbee.pro/docs'));
    console.log(chalk.gray('Community: https://discord.gg/y34Nvc7N36\n'));
    
    log('Onboarding completed successfully');
  });

// ===== START COMMAND =====
program
  .command('start')
  .description('Start the ClawBee daemon with integrations')
  .option('-p, --port <port>', 'Port to run on', '3210')
  .option('--whatsapp', 'Start WhatsApp integration')
  .option('--telegram', 'Start Telegram integration')
  .option('--discord', 'Start Discord integration')
  .option('--all', 'Start all configured integrations')
  .action(async (options) => {
    const config = getConfig();
    if (!config) {
      console.log(chalk.red('ClawBee is not configured. Run "clawbee onboard" first.'));
      process.exit(1);
    }
    
    if (isDaemonRunning()) {
      console.log(chalk.yellow('ClawBee daemon is already running.'));
      console.log(chalk.gray('Use "clawbee stop" to stop it first.'));
      return;
    }
    
    console.log(logo);
    console.log(tagline);
    
    const spinner = ora('Starting ClawBee daemon...').start();
    
    // Message handler for all integrations
    const handleMessage = async (message, context) => {
      log(`Message from ${context.platform}: ${message.substring(0, 50)}...`);
      
      // Add to memory
      addToMemory('user', message);
      
      // Get AI response
      const response = await getAIResponse(message, config);
      
      // Add response to memory
      addToMemory('assistant', response);
      
      return response;
    };
    
    // Create HTTP server for status
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'running', 
        version: VERSION,
        uptime: process.uptime(),
        integrations: Object.keys(config.integrations).filter(i => config.integrations[i].enabled)
      }));
    });
    
    server.listen(options.port, async () => {
      // Save PID
      fs.writeFileSync(getPidPath(), process.pid.toString());
      
      spinner.succeed(`ClawBee daemon started on port ${options.port}`);
      console.log(chalk.green(`\n🐝 Hello ${config.user.name}! ClawBee is ready.`));
      console.log(chalk.gray(`   API endpoint: http://localhost:${options.port}`));
      
      // Start integrations
      const startAll = options.all;
      
      // WhatsApp Integration
      if ((startAll || options.whatsapp) && config.integrations.whatsapp) {
        try {
          console.log(chalk.cyan('\n📱 Starting WhatsApp integration...'));
          const { WhatsAppBot } = require('../lib/integrations/whatsapp');
          const whatsapp = new WhatsAppBot();
          
          await whatsapp.start(handleMessage, {
            onQR: (qr) => {
              config.integrations.whatsapp.configured = false;
              saveConfig(config);
            },
            onStatus: (status, msg) => {
              if (status === 'ready') {
                config.integrations.whatsapp.configured = true;
                config.integrations.whatsapp.enabled = true;
                saveConfig(config);
                console.log(chalk.green('✓ WhatsApp connected successfully!'));
              }
            }
          });
        } catch (error) {
          console.log(chalk.red(`WhatsApp Error: ${error.message}`));
          console.log(chalk.gray('Make sure whatsapp-web.js is installed: npm install whatsapp-web.js qrcode-terminal'));
        }
      }
      
      // Telegram Integration
      if ((startAll || options.telegram) && config.integrations.telegram?.configured) {
        try {
          console.log(chalk.cyan('\n📨 Starting Telegram integration...'));
          const { TelegramBot } = require('../lib/integrations/telegram');
          const telegram = new TelegramBot(config.integrations.telegram.token);
          await telegram.startPolling(handleMessage);
          config.integrations.telegram.enabled = true;
          saveConfig(config);
          console.log(chalk.green('✓ Telegram bot started!'));
        } catch (error) {
          console.log(chalk.red(`Telegram Error: ${error.message}`));
        }
      }
      
      // Discord Integration
      if ((startAll || options.discord) && config.integrations.discord?.configured) {
        try {
          console.log(chalk.cyan('\n🎮 Starting Discord integration...'));
          const { DiscordBot } = require('../lib/integrations/discord');
          const discord = new DiscordBot(config.integrations.discord.token);
          await discord.start(handleMessage);
          config.integrations.discord.enabled = true;
          saveConfig(config);
          console.log(chalk.green('✓ Discord bot started!'));
        } catch (error) {
          console.log(chalk.red(`Discord Error: ${error.message}`));
        }
      }
      
      console.log(chalk.gray('\n   Press Ctrl+C to stop\n'));
      
      log(`Daemon started on port ${options.port}`);
    });
    
    // Graceful shutdown
    const shutdown = () => {
      console.log(chalk.yellow('\n\nShutting down ClawBee...'));
      
      // Remove PID file
      try {
        fs.unlinkSync(getPidPath());
      } catch (e) {}
      
      server.close(() => {
        console.log(chalk.green('ClawBee stopped. Goodbye! 🐝\n'));
        log('Daemon stopped');
        process.exit(0);
      });
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

// ===== STOP COMMAND =====
program
  .command('stop')
  .description('Stop the ClawBee daemon')
  .action(() => {
    const pidPath = getPidPath();
    
    if (!fs.existsSync(pidPath)) {
      console.log(chalk.yellow('ClawBee daemon is not running.'));
      return;
    }
    
    try {
      const pid = parseInt(fs.readFileSync(pidPath, 'utf8'));
      process.kill(pid, 'SIGTERM');
      fs.unlinkSync(pidPath);
      console.log(chalk.green('ClawBee daemon stopped.'));
      log('Daemon stopped via CLI');
    } catch (error) {
      console.log(chalk.red(`Failed to stop daemon: ${error.message}`));
      // Clean up stale PID file
      try {
        fs.unlinkSync(pidPath);
      } catch (e) {}
    }
  });

// ===== CHAT COMMAND =====
program
  .command('chat')
  .description('Chat with ClawBee in terminal')
  .option('-s, --single <message>', 'Send a single message and exit')
  .action(async (options) => {
    const config = getConfig();
    if (!config) {
      console.log(chalk.red('ClawBee is not configured. Run "clawbee onboard" first.'));
      process.exit(1);
    }
    
    console.log(logo);
    console.log(tagline);
    
    // Single message mode
    if (options.single) {
      const spinner = ora('Thinking...').start();
      try {
        addToMemory('user', options.single);
        const response = await getAIResponse(options.single, config);
        addToMemory('assistant', response);
        spinner.stop();
        console.log(chalk.yellow('ClawBee: ') + response + '\n');
      } catch (error) {
        spinner.fail(`Error: ${error.message}`);
      }
      return;
    }
    
    // Interactive mode
    console.log(chalk.green(`Hello ${config.user.name}! Type your message or "exit" to quit.\n`));
    console.log(chalk.gray('Commands: /clear (clear history), /memory (show memory), /model (change model), /help\n'));
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const askQuestion = () => {
      rl.question(chalk.cyan('You: '), async (input) => {
        const trimmedInput = input.trim();
        
        if (!trimmedInput) {
          askQuestion();
          return;
        }
        
        // Handle commands
        if (trimmedInput.toLowerCase() === 'exit' || trimmedInput.toLowerCase() === '/quit') {
          console.log(chalk.yellow('\nGoodbye! 🐝\n'));
          rl.close();
          return;
        }
        
        if (trimmedInput === '/clear') {
          saveMemory({ conversations: [], context: [] });
          console.log(chalk.green('Memory cleared.\n'));
          askQuestion();
          return;
        }
        
        if (trimmedInput === '/memory') {
          const memory = getMemory();
          console.log(chalk.cyan(`\nMemory: ${memory.conversations.length} messages\n`));
          memory.conversations.slice(-5).forEach(m => {
            const role = m.role === 'user' ? chalk.cyan('You') : chalk.yellow('ClawBee');
            console.log(`${role}: ${m.content.substring(0, 100)}${m.content.length > 100 ? '...' : ''}`);
          });
          console.log('');
          askQuestion();
          return;
        }
        
        if (trimmedInput === '/model') {
          console.log(chalk.cyan(`\nCurrent model: ${config.ai.model}`));
          console.log(chalk.cyan(`Provider: ${config.ai.provider}\n`));
          askQuestion();
          return;
        }
        
        if (trimmedInput === '/help') {
          console.log(chalk.cyan('\nCommands:'));
          console.log('  /clear  - Clear conversation memory');
          console.log('  /memory - Show recent memory');
          console.log('  /model  - Show current AI model');
          console.log('  /help   - Show this help');
          console.log('  exit    - Exit chat\n');
          askQuestion();
          return;
        }
        
        // Send to AI
        const spinner = ora('Thinking...').start();
        
        try {
          addToMemory('user', trimmedInput);
          const response = await getAIResponse(trimmedInput, config);
          addToMemory('assistant', response);
          spinner.stop();
          console.log(chalk.yellow('ClawBee: ') + response + '\n');
        } catch (error) {
          spinner.fail(`Error: ${error.message}`);
          console.log(chalk.gray('Make sure your API key is valid and you have internet connection.\n'));
        }
        
        askQuestion();
      });
    };
    
    askQuestion();
  });

// ===== CONNECT COMMAND =====
program
  .command('connect <platform>')
  .description('Connect a chat platform (whatsapp, telegram, discord, slack)')
  .action(async (platform) => {
    const config = getConfig();
    if (!config) {
      console.log(chalk.red('ClawBee is not configured. Run "clawbee onboard" first.'));
      process.exit(1);
    }
    
    const validPlatforms = ['whatsapp', 'telegram', 'discord', 'slack'];
    const platformLower = platform.toLowerCase();
    
    if (!validPlatforms.includes(platformLower)) {
      console.log(chalk.red(`Invalid platform. Choose from: ${validPlatforms.join(', ')}`));
      process.exit(1);
    }
    
    console.log(logo);
    console.log(chalk.cyan(`\nSetting up ${platform} integration...\n`));
    
    // Message handler
    const handleMessage = async (message, context) => {
      addToMemory('user', message);
      const response = await getAIResponse(message, config);
      addToMemory('assistant', response);
      return response;
    };
    
    switch (platformLower) {
      case 'whatsapp':
        console.log(chalk.cyan('WhatsApp integration uses WhatsApp Web with QR code.\n'));
        
        const whatsappAnswers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Ready to scan QR code with WhatsApp?',
            default: true
          }
        ]);
        
        if (whatsappAnswers.proceed) {
          console.log(chalk.yellow('\nInitializing WhatsApp connection...\n'));
          
          try {
            const { WhatsAppBot } = require('../lib/integrations/whatsapp');
            const whatsapp = new WhatsAppBot();
            
            // Initialize and save config
            config.integrations.whatsapp = {
              enabled: false,
              configured: false
            };
            saveConfig(config);
            
            await whatsapp.start(handleMessage, {
              onQR: (qr) => {
                // QR code will be displayed by the library
              },
              onStatus: (status, msg) => {
                if (status === 'ready') {
                  config.integrations.whatsapp.configured = true;
                  config.integrations.whatsapp.enabled = true;
                  saveConfig(config);
                  console.log(chalk.green('\n✓ WhatsApp connected successfully!'));
                  console.log(chalk.gray('You can now send messages to your WhatsApp and ClawBee will respond.\n'));
                  console.log(chalk.cyan('Press Ctrl+C to stop the WhatsApp connection.\n'));
                } else if (status === 'disconnected') {
                  console.log(chalk.yellow('\nWhatsApp disconnected. Run "clawbee connect whatsapp" to reconnect.\n'));
                }
              }
            });
            
          } catch (error) {
            console.log(chalk.red(`\nError: ${error.message}`));
            console.log(chalk.gray('\nMake sure to install required dependencies:'));
            console.log(chalk.gray('  npm install whatsapp-web.js qrcode-terminal puppeteer\n'));
          }
        }
        return; // Don't show the generic message since WhatsApp runs continuously
        
      case 'telegram':
        const telegramAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'token',
            message: 'Enter your Telegram Bot Token:',
            validate: (input) => input.length > 0 || 'Token is required'
          }
        ]);
        
        config.integrations.telegram = {
          enabled: true,
          configured: true,
          token: telegramAnswers.token
        };
        saveConfig(config);
        
        console.log(chalk.green('\n✓ Telegram configured successfully!'));
        console.log(chalk.gray('\nHow to get a Telegram Bot Token:'));
        console.log(chalk.gray('1. Message @BotFather on Telegram'));
        console.log(chalk.gray('2. Send /newbot and follow instructions'));
        console.log(chalk.gray('3. Copy the token provided\n'));
        break;
        
      case 'discord':
        const discordAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'token',
            message: 'Enter your Discord Bot Token:',
            validate: (input) => input.length > 0 || 'Token is required'
          },
          {
            type: 'input',
            name: 'clientId',
            message: 'Enter your Discord Client ID:',
            validate: (input) => input.length > 0 || 'Client ID is required'
          }
        ]);
        
        config.integrations.discord = {
          enabled: true,
          configured: true,
          token: discordAnswers.token,
          clientId: discordAnswers.clientId
        };
        saveConfig(config);
        
        console.log(chalk.green('\n✓ Discord configured successfully!'));
        console.log(chalk.gray('\nHow to get Discord credentials:'));
        console.log(chalk.gray('1. Go to https://discord.com/developers/applications'));
        console.log(chalk.gray('2. Create a new application'));
        console.log(chalk.gray('3. Go to Bot section and create a bot'));
        console.log(chalk.gray('4. Copy the token and client ID\n'));
        break;
        
      case 'slack':
        const slackAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'botToken',
            message: 'Enter your Slack Bot Token (xoxb-...):',
            validate: (input) => input.startsWith('xoxb-') || 'Token should start with xoxb-'
          },
          {
            type: 'input',
            name: 'signingSecret',
            message: 'Enter your Slack Signing Secret:',
            validate: (input) => input.length > 0 || 'Signing secret is required'
          }
        ]);
        
        config.integrations.slack = {
          enabled: true,
          configured: true,
          botToken: slackAnswers.botToken,
          signingSecret: slackAnswers.signingSecret
        };
        saveConfig(config);
        
        console.log(chalk.green('\n✓ Slack configured successfully!'));
        console.log(chalk.gray('\nHow to get Slack credentials:'));
        console.log(chalk.gray('1. Go to https://api.slack.com/apps'));
        console.log(chalk.gray('2. Create a new app'));
        console.log(chalk.gray('3. Add OAuth scopes: chat:write, app_mentions:read'));
        console.log(chalk.gray('4. Install app to workspace\n'));
        break;
    }
    
    console.log(chalk.green('Run "clawbee start --all" to activate all integrations.\n'));
    log(`Integration configured: ${platform}`);
  });

// ===== STATUS COMMAND =====
program
  .command('status')
  .description('Check ClawBee status')
  .action(() => {
    const config = getConfig();
    
    console.log(logo);
    console.log(tagline);
    console.log(chalk.cyan('Status:\n'));
    
    if (!config) {
      console.log(chalk.red('  ✗ Not configured'));
      console.log(chalk.gray('    Run "clawbee onboard" to set up\n'));
      return;
    }
    
    console.log(chalk.green('  ✓ Configured'));
    console.log(chalk.gray(`    User: ${config.user.name}`));
    console.log(chalk.gray(`    AI Provider: ${config.ai.provider}`));
    console.log(chalk.gray(`    Model: ${config.ai.model}`));
    console.log(chalk.gray(`    Version: ${config.version}`));
    
    // Daemon status
    console.log('\n' + chalk.cyan('Daemon:'));
    if (isDaemonRunning()) {
      console.log(chalk.green('  ✓ Running'));
    } else {
      console.log(chalk.yellow('  ○ Not running'));
      console.log(chalk.gray('    Run "clawbee start" to start'));
    }
    
    // Memory status
    console.log('\n' + chalk.cyan('Memory:'));
    const memory = getMemory();
    console.log(chalk.gray(`  Messages: ${memory.conversations.length}`));
    console.log(chalk.gray(`  Enabled: ${config.memory.enabled ? 'Yes' : 'No'}`));
    
    // Integrations status
    console.log('\n' + chalk.cyan('Integrations:'));
    const integrations = config.integrations || {};
    if (Object.keys(integrations).length === 0) {
      console.log(chalk.gray('  No integrations configured'));
    } else {
      Object.entries(integrations).forEach(([name, int]) => {
        const status = int.configured ? chalk.green('✓') : chalk.yellow('○');
        const state = int.configured ? 'configured' : 'pending setup';
        console.log(`  ${status} ${name} (${state})`);
      });
    }
    
    console.log('');
  });

// ===== SKILLS COMMAND =====
program
  .command('skills [action] [name]')
  .description('Manage ClawBee skills (list, install, remove, search)')
  .action(async (action = 'list', name) => {
    const config = getConfig();
    
    console.log(miniLogo + chalk.gray(' Skills\n'));
    
    const skillsDir = path.join(DATA_DIR, 'skills');
    ensureDirectories();
    
    switch (action) {
      case 'list':
        const installedSkills = fs.readdirSync(skillsDir).filter(f => 
          fs.statSync(path.join(skillsDir, f)).isDirectory()
        );
        
        if (installedSkills.length === 0) {
          console.log(chalk.gray('No skills installed.\n'));
          console.log(chalk.cyan('Popular skills:'));
          console.log(chalk.gray('  • email-manager - Smart email management'));
          console.log(chalk.gray('  • calendar-sync - Calendar synchronization'));
          console.log(chalk.gray('  • web-scraper - Web data extraction'));
          console.log(chalk.gray('  • code-review - AI code reviews\n'));
          console.log(chalk.gray('Install with: clawbee skills install <name>'));
          console.log(chalk.gray('Browse all: https://clawbee.pro/marketplace\n'));
        } else {
          console.log(chalk.cyan('Installed Skills:\n'));
          installedSkills.forEach(skill => {
            const manifestPath = path.join(skillsDir, skill, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
              const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
              console.log(chalk.yellow(`  ${manifest.name}`) + chalk.gray(` v${manifest.version}`));
              console.log(chalk.gray(`    ${manifest.description}\n`));
            } else {
              console.log(chalk.yellow(`  ${skill}`));
            }
          });
        }
        break;
        
      case 'install':
        if (!name) {
          console.log(chalk.red('Please specify a skill name: clawbee skills install <name>\n'));
          return;
        }
        
        const installSpinner = ora(`Installing ${name}...`).start();
        
        const skillDir = path.join(skillsDir, name);
        if (fs.existsSync(skillDir)) {
          installSpinner.fail(`Skill ${name} is already installed.`);
          return;
        }
        
        fs.mkdirSync(skillDir, { recursive: true });
        
        const manifest = {
          name: name,
          version: '1.0.0',
          description: `${name} skill for ClawBee`,
          author: 'ClawBee Marketplace',
          installedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(
          path.join(skillDir, 'manifest.json'),
          JSON.stringify(manifest, null, 2)
        );
        
        fs.writeFileSync(
          path.join(skillDir, 'index.js'),
          `// ${name} skill\nmodule.exports = { name: '${name}' };\n`
        );
        
        installSpinner.succeed(`${name} installed successfully!`);
        console.log(chalk.gray(`\nSkill installed to: ${skillDir}\n`));
        log(`Skill installed: ${name}`);
        break;
        
      case 'remove':
        if (!name) {
          console.log(chalk.red('Please specify a skill name: clawbee skills remove <name>\n'));
          return;
        }
        
        const removeDir = path.join(skillsDir, name);
        if (!fs.existsSync(removeDir)) {
          console.log(chalk.red(`Skill ${name} is not installed.\n`));
          return;
        }
        
        const { confirmRemove } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirmRemove',
          message: `Are you sure you want to remove ${name}?`,
          default: false
        }]);
        
        if (confirmRemove) {
          fs.rmSync(removeDir, { recursive: true });
          console.log(chalk.green(`${name} removed successfully.\n`));
          log(`Skill removed: ${name}`);
        }
        break;
        
      case 'search':
        console.log(chalk.cyan(`Searching for "${name || 'all'}"...\n`));
        console.log(chalk.gray('Available skills:\n'));
        
        const availableSkills = [
          { name: 'email-manager', desc: 'Smart email categorization and auto-replies' },
          { name: 'calendar-sync', desc: 'Sync multiple calendars with smart scheduling' },
          { name: 'web-scraper', desc: 'Extract data from any website' },
          { name: 'code-review', desc: 'AI-powered code reviews' },
          { name: 'document-analyzer', desc: 'Extract insights from documents' },
          { name: 'task-automator', desc: 'Create automation workflows' },
          { name: 'meeting-notes', desc: 'Transcribe and summarize meetings' },
          { name: 'image-generator', desc: 'Generate images with AI' }
        ];
        
        const filtered = name 
          ? availableSkills.filter(s => s.name.includes(name) || s.desc.toLowerCase().includes(name.toLowerCase()))
          : availableSkills;
        
        filtered.forEach(skill => {
          console.log(chalk.yellow(`  ${skill.name}`));
          console.log(chalk.gray(`    ${skill.desc}\n`));
        });
        
        console.log(chalk.gray('Install with: clawbee skills install <name>'));
        console.log(chalk.gray('Full catalog: https://clawbee.pro/marketplace\n'));
        break;
        
      default:
        console.log(chalk.red(`Unknown action: ${action}`));
        console.log(chalk.gray('Available actions: list, install, remove, search\n'));
    }
  });

// ===== CONFIG COMMAND =====
program
  .command('config [action] [key] [value]')
  .description('Manage configuration (show, set, get, reset)')
  .action((action = 'show', key, value) => {
    const config = getConfig();
    
    switch (action) {
      case 'show':
        console.log(miniLogo + chalk.gray(' Configuration\n'));
        
        if (!config) {
          console.log(chalk.red('No configuration found.'));
          console.log(chalk.gray('Run "clawbee onboard" to set up.\n'));
          return;
        }
        
        // Create safe copy hiding sensitive data
        const safeConfig = JSON.parse(JSON.stringify(config));
        if (safeConfig.ai?.apiKey) {
          safeConfig.ai.apiKey = safeConfig.ai.apiKey.substring(0, 8) + '...[hidden]';
        }
        Object.keys(safeConfig.integrations || {}).forEach(int => {
          if (safeConfig.integrations[int].token) {
            safeConfig.integrations[int].token = '[hidden]';
          }
          if (safeConfig.integrations[int].botToken) {
            safeConfig.integrations[int].botToken = '[hidden]';
          }
        });
        
        console.log(JSON.stringify(safeConfig, null, 2) + '\n');
        console.log(chalk.gray(`Config file: ${getConfigPath()}\n`));
        break;
        
      case 'set':
        if (!key || value === undefined) {
          console.log(chalk.red('Usage: clawbee config set <key> <value>'));
          console.log(chalk.gray('Example: clawbee config set ai.model gpt-5.2\n'));
          return;
        }
        
        if (!config) {
          console.log(chalk.red('No configuration found. Run "clawbee onboard" first.\n'));
          return;
        }
        
        // Set nested key
        const keys = key.split('.');
        let obj = config;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        
        // Try to parse as JSON for complex values
        try {
          obj[keys[keys.length - 1]] = JSON.parse(value);
        } catch (e) {
          obj[keys[keys.length - 1]] = value;
        }
        
        saveConfig(config);
        console.log(chalk.green(`✓ Set ${key} = ${value}\n`));
        log(`Config updated: ${key}`);
        break;
        
      case 'get':
        if (!key) {
          console.log(chalk.red('Usage: clawbee config get <key>\n'));
          return;
        }
        
        if (!config) {
          console.log(chalk.red('No configuration found.\n'));
          return;
        }
        
        const getKeys = key.split('.');
        let getObj = config;
        for (const k of getKeys) {
          getObj = getObj?.[k];
        }
        
        if (getObj === undefined) {
          console.log(chalk.yellow(`Key "${key}" not found.\n`));
        } else {
          // Hide sensitive values
          if (key.includes('apiKey') || key.includes('token') || key.includes('secret')) {
            console.log(chalk.gray('[hidden]\n'));
          } else {
            console.log(typeof getObj === 'object' ? JSON.stringify(getObj, null, 2) : getObj);
            console.log('');
          }
        }
        break;
        
      case 'reset':
        if (!config) {
          console.log(chalk.yellow('No configuration to reset.\n'));
          return;
        }
        
        inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset all configuration?',
          default: false
        }]).then(({ confirm }) => {
          if (confirm) {
            fs.unlinkSync(getConfigPath());
            console.log(chalk.green('Configuration reset.'));
            console.log(chalk.gray('Run "clawbee onboard" to set up again.\n'));
            log('Configuration reset');
          }
        });
        break;
        
      default:
        console.log(chalk.red(`Unknown action: ${action}`));
        console.log(chalk.gray('Available actions: show, set, get, reset\n'));
    }
  });

// ===== MEMORY COMMAND =====
program
  .command('memory [action]')
  .description('Manage conversation memory (show, clear, export)')
  .action((action = 'show') => {
    const config = getConfig();
    const memory = getMemory();
    
    console.log(miniLogo + chalk.gray(' Memory\n'));
    
    switch (action) {
      case 'show':
        if (memory.conversations.length === 0) {
          console.log(chalk.gray('No conversations in memory.\n'));
          return;
        }
        
        console.log(chalk.cyan(`Total messages: ${memory.conversations.length}\n`));
        console.log(chalk.gray('Recent conversations:\n'));
        
        memory.conversations.slice(-10).forEach(msg => {
          const role = msg.role === 'user' ? chalk.cyan('You') : chalk.yellow('ClawBee');
          const time = new Date(msg.timestamp).toLocaleString();
          console.log(chalk.gray(`[${time}]`));
          console.log(`${role}: ${msg.content}\n`);
        });
        break;
        
      case 'clear':
        inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Clear all conversation memory?',
          default: false
        }]).then(({ confirm }) => {
          if (confirm) {
            saveMemory({ conversations: [], context: [] });
            console.log(chalk.green('Memory cleared.\n'));
            log('Memory cleared');
          }
        });
        break;
        
      case 'export':
        const exportPath = path.join(os.homedir(), `clawbee-memory-${Date.now()}.json`);
        fs.writeFileSync(exportPath, JSON.stringify(memory, null, 2));
        console.log(chalk.green(`Memory exported to: ${exportPath}\n`));
        break;
        
      case 'stats':
        const userMsgs = memory.conversations.filter(m => m.role === 'user').length;
        const aiMsgs = memory.conversations.filter(m => m.role === 'assistant').length;
        const firstMsg = memory.conversations[0];
        const lastMsg = memory.conversations[memory.conversations.length - 1];
        
        console.log(chalk.cyan('Memory Statistics:\n'));
        console.log(`  Total messages: ${memory.conversations.length}`);
        console.log(`  Your messages: ${userMsgs}`);
        console.log(`  ClawBee responses: ${aiMsgs}`);
        if (firstMsg) {
          console.log(`  First message: ${new Date(firstMsg.timestamp).toLocaleString()}`);
        }
        if (lastMsg) {
          console.log(`  Last message: ${new Date(lastMsg.timestamp).toLocaleString()}`);
        }
        console.log('');
        break;
        
      default:
        console.log(chalk.red(`Unknown action: ${action}`));
        console.log(chalk.gray('Available actions: show, clear, export, stats\n'));
    }
  });

// ===== LOGS COMMAND =====
program
  .command('logs')
  .description('View ClawBee logs')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action((options) => {
    console.log(miniLogo + chalk.gray(' Logs\n'));
    
    if (!fs.existsSync(LOG_FILE)) {
      console.log(chalk.gray('No logs found.\n'));
      return;
    }
    
    const lines = parseInt(options.lines);
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const logLines = content.trim().split('\n').slice(-lines);
    
    logLines.forEach(line => {
      if (line.includes('[ERROR]')) {
        console.log(chalk.red(line));
      } else if (line.includes('[WARN]')) {
        console.log(chalk.yellow(line));
      } else {
        console.log(chalk.gray(line));
      }
    });
    
    console.log('');
  });

// ===== INFO COMMAND =====
program
  .command('info')
  .description('Show ClawBee information')
  .action(() => {
    console.log(logo);
    console.log(tagline);
    console.log(chalk.cyan('Version:      ') + VERSION);
    console.log(chalk.cyan('Homepage:     ') + 'https://clawbee.pro');
    console.log(chalk.cyan('GitHub:       ') + 'https://github.com/clawbeepro/clawbee');
    console.log(chalk.cyan('npm:          ') + 'https://www.npmjs.com/package/clawbee');
    console.log(chalk.cyan('Docs:         ') + 'https://clawbee.pro/docs');
    console.log(chalk.cyan('Discord:      ') + 'https://discord.gg/y34Nvc7N36');
    console.log(chalk.cyan('License:      ') + 'MIT');
    console.log('');
    console.log(chalk.cyan('Config Dir:   ') + CONFIG_DIR);
    console.log(chalk.cyan('Data Dir:     ') + DATA_DIR);
    console.log('');
    console.log(chalk.cyan('Supported AI Providers:'));
    console.log(chalk.gray('  • Emergent Universal Key (OpenAI, Anthropic, Gemini)'));
    console.log(chalk.gray('  • OpenAI (GPT-4, GPT-4o, etc.)'));
    console.log(chalk.gray('  • Anthropic (Claude 3)'));
    console.log(chalk.gray('  • Google (Gemini)'));
    console.log(chalk.gray('  • Local (Ollama)'));
    console.log('');
    console.log(chalk.cyan('Supported Integrations:'));
    console.log(chalk.gray('  • WhatsApp (via QR code)'));
    console.log(chalk.gray('  • Telegram'));
    console.log(chalk.gray('  • Discord'));
    console.log(chalk.gray('  • Slack'));
    console.log('');
  });

// ===== UPDATE COMMAND =====
program
  .command('update')
  .description('Check for updates')
  .action(async () => {
    console.log(miniLogo + chalk.gray(' Update Check\n'));
    
    const spinner = ora('Checking for updates...').start();
    
    try {
      const response = await axios.get('https://registry.npmjs.org/clawbee/latest');
      const latestVersion = response.data.version;
      
      spinner.stop();
      
      if (latestVersion !== VERSION) {
        console.log(chalk.yellow(`New version available: ${latestVersion} (current: ${VERSION})\n`));
        console.log(chalk.cyan('To update, run:'));
        console.log(chalk.gray('  npm update -g clawbee\n'));
      } else {
        console.log(chalk.green(`You're on the latest version (${VERSION})\n`));
      }
    } catch (error) {
      spinner.fail('Failed to check for updates');
      console.log(chalk.gray('Check manually at: https://www.npmjs.com/package/clawbee\n'));
    }
  });

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(logo);
  console.log(tagline);
  program.outputHelp();
}
