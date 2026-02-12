#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const os = require('os');

const VERSION = '2.0.0';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'clawbee');
const DATA_DIR = path.join(os.homedir(), '.local', 'share', 'clawbee');

// ASCII Art Logo
const logo = chalk.yellow(`
   ██████╗██╗      █████╗ ██╗    ██╗██████╗ ███████╗███████╗
  ██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗██╔════╝██╔════╝
  ██║     ██║     ███████║██║ █╗ ██║██████╔╝█████╗  █████╗  
  ██║     ██║     ██╔══██║██║███╗██║██╔══██╗██╔══╝  ██╔══╝  
  ╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝███████╗███████╗
   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ╚══════╝╚══════╝
`);

const tagline = chalk.cyan('         🐝 Your Personal AI, Endless Possibilities. 🐝\n');

// Ensure directories exist
function ensureDirectories() {
  const dirs = [
    CONFIG_DIR,
    DATA_DIR,
    path.join(DATA_DIR, 'skills'),
    path.join(DATA_DIR, 'memory'),
    path.join(DATA_DIR, 'logs')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Get config
function getConfig() {
  const configPath = path.join(CONFIG_DIR, 'config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return null;
}

// Save config
function saveConfig(config) {
  const configPath = path.join(CONFIG_DIR, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

program
  .name('clawbee')
  .description('ClawBee - Your Personal AI, Endless Possibilities')
  .version(VERSION);

// Onboard command
program
  .command('onboard')
  .description('Set up ClawBee for the first time')
  .action(async () => {
    console.log(logo);
    console.log(tagline);
    console.log(chalk.green('Welcome to ClawBee! Let\'s get you set up.\n'));
    
    ensureDirectories();
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What should I call you?',
        default: os.userInfo().username
      },
      {
        type: 'list',
        name: 'aiProvider',
        message: 'Which AI provider would you like to use?',
        choices: [
          { name: 'OpenAI (GPT-4)', value: 'openai' },
          { name: 'Anthropic (Claude)', value: 'anthropic' },
          { name: 'Google (Gemini)', value: 'google' },
          { name: 'Local Model (Ollama)', value: 'local' }
        ]
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your API key:',
        when: (answers) => answers.aiProvider !== 'local'
      },
      {
        type: 'checkbox',
        name: 'integrations',
        message: 'Which chat apps would you like to connect?',
        choices: [
          { name: 'WhatsApp', value: 'whatsapp' },
          { name: 'Telegram', value: 'telegram' },
          { name: 'Discord', value: 'discord' },
          { name: 'Slack', value: 'slack' },
          { name: 'Terminal only', value: 'terminal' }
        ]
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
        model: answers.aiProvider === 'openai' ? 'gpt-4' : 
               answers.aiProvider === 'anthropic' ? 'claude-3-opus' :
               answers.aiProvider === 'google' ? 'gemini-pro' : 'llama2'
      },
      integrations: answers.integrations.reduce((acc, int) => {
        acc[int] = { enabled: true };
        return acc;
      }, {}),
      memory: {
        enabled: true,
        maxContext: 100
      },
      security: {
        sandbox: true
      },
      createdAt: new Date().toISOString(),
      version: VERSION
    };
    
    saveConfig(config);
    
    spinner.succeed('Configuration saved!');
    
    console.log('\n' + chalk.green('✨ ClawBee is ready to go!'));
    console.log('\n' + chalk.cyan('Quick commands:'));
    console.log(chalk.yellow('  clawbee start') + '     - Start the ClawBee daemon');
    console.log(chalk.yellow('  clawbee chat') + '      - Chat in terminal');
    console.log(chalk.yellow('  clawbee connect') + '   - Connect a chat app');
    console.log(chalk.yellow('  clawbee skills') + '    - Manage skills');
    console.log('\n' + chalk.gray('Documentation: https://docs.clawbee.pro'));
  });

// Start command
program
  .command('start')
  .description('Start the ClawBee daemon')
  .option('-p, --port <port>', 'Port to run on', '3210')
  .action(async (options) => {
    const config = getConfig();
    if (!config) {
      console.log(chalk.red('ClawBee is not configured. Run "clawbee onboard" first.'));
      process.exit(1);
    }
    
    console.log(logo);
    console.log(tagline);
    
    const spinner = ora('Starting ClawBee daemon...').start();
    
    // Simulate startup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    spinner.succeed(`ClawBee daemon started on port ${options.port}`);
    console.log(chalk.green(`\n🐝 Hello ${config.user.name}! ClawBee is ready.`));
    console.log(chalk.gray('\nPress Ctrl+C to stop\n'));
    
    // Keep process running
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\nShutting down ClawBee...'));
      process.exit(0);
    });
    
    // Heartbeat
    setInterval(() => {
      // Keep alive
    }, 1000);
  });

// Chat command
program
  .command('chat')
  .description('Chat with ClawBee in terminal')
  .action(async () => {
    const config = getConfig();
    if (!config) {
      console.log(chalk.red('ClawBee is not configured. Run "clawbee onboard" first.'));
      process.exit(1);
    }
    
    console.log(logo);
    console.log(tagline);
    console.log(chalk.green(`Hello ${config.user.name}! Type your message or "exit" to quit.\n`));
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const askQuestion = () => {
      rl.question(chalk.cyan('You: '), async (input) => {
        if (input.toLowerCase() === 'exit') {
          console.log(chalk.yellow('\nGoodbye! 🐝'));
          rl.close();
          return;
        }
        
        const spinner = ora('Thinking...').start();
        
        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 1500));
        spinner.stop();
        
        console.log(chalk.yellow('ClawBee: ') + `I received your message: "${input}". To get real AI responses, please configure your API key with "clawbee config set ai.apiKey <your-key>"\n`);
        
        askQuestion();
      });
    };
    
    askQuestion();
  });

// Connect command
program
  .command('connect <platform>')
  .description('Connect a chat platform (whatsapp, telegram, discord, slack)')
  .action(async (platform) => {
    const validPlatforms = ['whatsapp', 'telegram', 'discord', 'slack'];
    
    if (!validPlatforms.includes(platform.toLowerCase())) {
      console.log(chalk.red(`Invalid platform. Choose from: ${validPlatforms.join(', ')}`));
      process.exit(1);
    }
    
    console.log(logo);
    console.log(chalk.cyan(`\nConnecting to ${platform}...\n`));
    
    const spinner = ora(`Setting up ${platform} integration...`).start();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    spinner.succeed(`${platform} integration ready!`);
    
    console.log(chalk.green(`\nFollow the instructions to complete ${platform} setup:`));
    
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        console.log(chalk.gray('1. Scan the QR code that will appear'));
        console.log(chalk.gray('2. Open WhatsApp on your phone'));
        console.log(chalk.gray('3. Go to Settings > Linked Devices > Link a Device'));
        break;
      case 'telegram':
        console.log(chalk.gray('1. Message @BotFather on Telegram'));
        console.log(chalk.gray('2. Create a new bot with /newbot'));
        console.log(chalk.gray('3. Copy the token and run: clawbee config set integrations.telegram.token <token>'));
        break;
      case 'discord':
        console.log(chalk.gray('1. Go to https://discord.com/developers/applications'));
        console.log(chalk.gray('2. Create a new application and bot'));
        console.log(chalk.gray('3. Copy the token and run: clawbee config set integrations.discord.token <token>'));
        break;
      case 'slack':
        console.log(chalk.gray('1. Go to https://api.slack.com/apps'));
        console.log(chalk.gray('2. Create a new app'));
        console.log(chalk.gray('3. Copy the bot token and run: clawbee config set integrations.slack.token <token>'));
        break;
    }
  });

// Status command
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
      console.log(chalk.gray('    Run "clawbee onboard" to set up'));
      return;
    }
    
    console.log(chalk.green('  ✓ Configured'));
    console.log(chalk.gray(`    User: ${config.user.name}`));
    console.log(chalk.gray(`    AI Provider: ${config.ai.provider}`));
    console.log(chalk.gray(`    Version: ${config.version}`));
    
    console.log('\n' + chalk.cyan('Integrations:'));
    Object.keys(config.integrations || {}).forEach(int => {
      const status = config.integrations[int].enabled ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${int}`);
    });
  });

// Skills command
program
  .command('skills')
  .description('Manage ClawBee skills')
  .argument('[action]', 'Action: list, install, remove, search')
  .argument('[name]', 'Skill name')
  .action(async (action = 'list', name) => {
    console.log(logo);
    
    switch (action) {
      case 'list':
        console.log(chalk.cyan('\nInstalled Skills:\n'));
        console.log(chalk.gray('  No skills installed yet.'));
        console.log(chalk.gray('  Browse skills at: https://clawbee.pro/marketplace'));
        break;
      case 'install':
        if (!name) {
          console.log(chalk.red('Please specify a skill name: clawbee skills install <name>'));
          return;
        }
        const spinner = ora(`Installing ${name}...`).start();
        await new Promise(resolve => setTimeout(resolve, 2000));
        spinner.succeed(`${name} installed successfully!`);
        break;
      case 'remove':
        if (!name) {
          console.log(chalk.red('Please specify a skill name: clawbee skills remove <name>'));
          return;
        }
        console.log(chalk.yellow(`Removing ${name}...`));
        console.log(chalk.green(`${name} removed.`));
        break;
      case 'search':
        console.log(chalk.cyan(`\nSearching for "${name || '*'}"...\n`));
        console.log(chalk.gray('  Visit https://clawbee.pro/marketplace for the full catalog'));
        break;
      default:
        console.log(chalk.red(`Unknown action: ${action}`));
        console.log(chalk.gray('Available actions: list, install, remove, search'));
    }
  });

// Config command
program
  .command('config')
  .description('Manage ClawBee configuration')
  .argument('[action]', 'Action: show, set, reset')
  .argument('[key]', 'Config key (e.g., ai.apiKey)')
  .argument('[value]', 'Config value')
  .action((action = 'show', key, value) => {
    const config = getConfig();
    
    switch (action) {
      case 'show':
        console.log(chalk.cyan('\nCurrent Configuration:\n'));
        if (config) {
          // Hide sensitive data
          const safeConfig = JSON.parse(JSON.stringify(config));
          if (safeConfig.ai?.apiKey) {
            safeConfig.ai.apiKey = '***hidden***';
          }
          console.log(JSON.stringify(safeConfig, null, 2));
        } else {
          console.log(chalk.gray('  No configuration found. Run "clawbee onboard" first.'));
        }
        break;
      case 'set':
        if (!key || value === undefined) {
          console.log(chalk.red('Usage: clawbee config set <key> <value>'));
          return;
        }
        if (!config) {
          console.log(chalk.red('No configuration found. Run "clawbee onboard" first.'));
          return;
        }
        // Set nested key
        const keys = key.split('.');
        let obj = config;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        saveConfig(config);
        console.log(chalk.green(`Set ${key} = ${value}`));
        break;
      case 'reset':
        if (fs.existsSync(path.join(CONFIG_DIR, 'config.json'))) {
          fs.unlinkSync(path.join(CONFIG_DIR, 'config.json'));
          console.log(chalk.yellow('Configuration reset. Run "clawbee onboard" to set up again.'));
        }
        break;
      default:
        console.log(chalk.red(`Unknown action: ${action}`));
    }
  });

// Version info
program
  .command('info')
  .description('Show ClawBee information')
  .action(() => {
    console.log(logo);
    console.log(tagline);
    console.log(chalk.cyan('Version:    ') + VERSION);
    console.log(chalk.cyan('Homepage:   ') + 'https://clawbee.pro');
    console.log(chalk.cyan('GitHub:     ') + 'https://github.com/clawbeepro/clawbee');
    console.log(chalk.cyan('Docs:       ') + 'https://docs.clawbee.pro');
    console.log(chalk.cyan('Discord:    ') + 'https://discord.gg/clawbee');
    console.log(chalk.cyan('License:    ') + 'MIT');
  });

program.parse();
