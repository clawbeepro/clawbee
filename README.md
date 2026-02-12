# 🐝 ClawBee

**Your Personal AI, Endless Possibilities.**

ClawBee is an open-source AI assistant that runs locally on your machine and connects to any chat app you already use. It's designed to automate your daily tasks while keeping your data private.

[![npm version](https://badge.fury.io/js/clawbee.svg)](https://www.npmjs.com/package/clawbee)
[![GitHub license](https://img.shields.io/github/license/clawbeepro/clawbee)](https://github.com/clawbeepro/clawbee/blob/main/LICENSE)

## ✨ Features

- 🖥️ **Runs Locally** - Your data stays on your machine
- 💬 **Any Chat App** - WhatsApp, Telegram, Discord, Slack, and more
- 🧠 **Persistent Memory** - Remembers context across conversations
- 🌐 **Browser Control** - Automate web tasks with Puppeteer
- 🔧 **Extensible** - Add skills from the marketplace or build your own
- 🔐 **Private & Secure** - Full control over your data
- 🤖 **Multi-AI Support** - OpenAI, Anthropic, Google, or local models (Ollama)

## 🚀 Quick Start

### Install via npm

```bash
npm install -g clawbee
clawbee onboard
```

### Install via One-liner

```bash
# macOS/Linux
curl -fsSL https://clawbee.pro/install.sh | bash

# Windows (PowerShell)
irm https://clawbee.pro/install.ps1 | iex
```

### Install from Source

```bash
git clone https://github.com/clawbeepro/clawbee.git
cd clawbee
npm install
npm link
clawbee onboard
```

## 📖 Usage

### Basic Commands

```bash
# Initial setup
clawbee onboard

# Start the daemon
clawbee start

# Chat in terminal
clawbee chat

# Send a single message
clawbee chat -s "What's the weather like?"

# Check status
clawbee status

# View logs
clawbee logs

# Update ClawBee
clawbee update
```

### Connect Chat Platforms

```bash
# Connect Telegram
clawbee connect telegram

# Connect Discord
clawbee connect discord

# Connect Slack
clawbee connect slack

# Connect WhatsApp (coming soon)
clawbee connect whatsapp
```

### Manage Skills

```bash
# List installed skills
clawbee skills list

# Search for skills
clawbee skills search email

# Install a skill
clawbee skills install email-manager

# Remove a skill
clawbee skills remove email-manager
```

### Configuration

```bash
# Show configuration
clawbee config show

# Set a value
clawbee config set ai.model gpt-4-turbo
clawbee config set ai.temperature 0.8

# Get a value
clawbee config get ai.provider

# Reset configuration
clawbee config reset

# Edit config file directly
clawbee config edit
```

### Memory Management

```bash
# Show conversation history
clawbee memory show

# Clear memory
clawbee memory clear

# Export memory
clawbee memory export

# Memory statistics
clawbee memory stats
```

## 🔌 AI Providers

ClawBee supports multiple AI providers:

| Provider | Models | API Key Required |
|----------|--------|------------------|
| OpenAI | GPT-4, GPT-4 Turbo, GPT-3.5 | Yes |
| Anthropic | Claude 3 Opus, Sonnet, Haiku | Yes |
| Google | Gemini Pro, Gemini Pro Vision | Yes |
| Ollama | Llama 2, Mistral, CodeLlama, etc. | No (local) |

### Setting up API Keys

```bash
# OpenAI
clawbee config set ai.apiKey sk-your-openai-key

# Anthropic
clawbee config set ai.apiKey sk-ant-your-anthropic-key

# Google
clawbee config set ai.apiKey your-google-api-key
```

### Using Local Models (Ollama)

1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama2`
3. Configure ClawBee:
   ```bash
   clawbee config set ai.provider local
   clawbee config set ai.model llama2
   ```

## 🔗 Integrations

### Telegram

1. Message @BotFather on Telegram
2. Create a new bot with `/newbot`
3. Copy the token
4. Run `clawbee connect telegram`

### Discord

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to Bot section, create a bot
4. Enable MESSAGE CONTENT INTENT
5. Copy the token
6. Run `clawbee connect discord`

### Slack

1. Go to https://api.slack.com/apps
2. Create a new app
3. Add OAuth scopes: `chat:write`, `app_mentions:read`, `im:history`
4. Install app to workspace
5. Run `clawbee connect slack`

## 📁 File Structure

```
~/.config/clawbee/
├── config.json          # Main configuration

~/.local/share/clawbee/
├── skills/              # Installed skills
├── memory/              # Conversation memory
│   └── conversations.json
├── logs/                # Log files
│   └── clawbee.log
└── integrations/        # Integration data
```

## 🛠️ Development

### Building from Source

```bash
git clone https://github.com/clawbeepro/clawbee.git
cd clawbee
npm install
```

### Creating a Skill

```javascript
// skills/my-skill/manifest.json
{
  "name": "my-skill",
  "version": "1.0.0",
  "description": "My custom skill",
  "commands": [
    {
      "name": "mycommand",
      "description": "Does something",
      "handler": "handleCommand"
    }
  ],
  "triggers": [
    {
      "type": "keyword",
      "pattern": "my trigger",
      "handler": "handleTrigger"
    }
  ]
}

// skills/my-skill/index.js
module.exports = {
  handleCommand: async (args, context) => {
    return "Command executed!";
  },
  handleTrigger: async (message, context) => {
    return "Trigger activated!";
  }
};
```

### Using as a Library

```javascript
const { AIProvider, SkillManager } = require('clawbee');

// Create AI provider
const ai = new AIProvider({
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4'
});

// Chat
const response = await ai.chat([
  { role: 'user', content: 'Hello!' }
]);

console.log(response.content);
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Website](https://clawbee.pro)
- [Documentation](https://docs.clawbee.pro)
- [Skill Marketplace](https://clawbee.pro/marketplace)
- [Discord Community](https://discord.gg/clawbee)
- [GitHub](https://github.com/clawbeepro/clawbee)
- [npm](https://www.npmjs.com/package/clawbee)

---

Made with 🐝 by the ClawBee Team
