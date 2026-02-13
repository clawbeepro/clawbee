# 🐝 ClawBee

**Your Personal AI, Endless Possibilities.**

ClawBee is an open-source AI assistant that runs locally on your machine and connects to any chat app you already use. It's designed to automate your daily tasks while keeping your data private.

[![npm version](https://badge.fury.io/js/clawbee.svg)](https://www.npmjs.com/package/clawbee)
[![GitHub license](https://img.shields.io/github/license/clawbeepro/clawbee)](https://github.com/clawbeepro/clawbee/blob/main/LICENSE)

## ✨ Features

- 🖥️ **Runs Locally** - Your data stays on your machine
- 💬 **Any Chat App** - WhatsApp (QR code), Telegram, Discord, Slack
- 🧠 **Persistent Memory** - Remembers context across conversations
- 🌐 **Browser Control** - Automate web tasks with Puppeteer
- 🔧 **Extensible** - Add skills from the marketplace or build your own
- 🔐 **Private & Secure** - Full control over your data
- 🤖 **Multi-AI Support** - Emergent Universal Key, OpenAI, Anthropic, Google, or local models

## 🚀 Quick Start

### Install via npm

```bash
npm install -g clawbee
clawbee onboard
```

### Install via One-liner

```bash
# macOS/Linux
curl -fsSL https://clawbee.io/install.sh | bash

# Windows (PowerShell)
irm https://clawbee.io/install.ps1 | iex
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

# Chat in terminal
clawbee chat

# Send a single message
clawbee chat -s "What's the weather like?"

# Start daemon with all integrations
clawbee start --all

# Check status
clawbee status

# View logs
clawbee logs

# Update ClawBee
clawbee update
```

### Connect Chat Platforms

```bash
# Connect WhatsApp (with QR code scanning)
clawbee connect whatsapp

# Connect Telegram
clawbee connect telegram

# Connect Discord
clawbee connect discord

# Connect Slack
clawbee connect slack
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
clawbee config set ai.model gpt-5.2
clawbee config set ai.temperature 0.8

# Get a value
clawbee config get ai.provider

# Reset configuration
clawbee config reset
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

ClawBee supports multiple AI providers with a single universal key!

### Emergent Universal Key (Recommended)

Use one key for all AI providers:

| Provider | Models Available |
|----------|------------------|
| OpenAI | GPT-5.2, GPT-5.1, GPT-5, GPT-4o, O3, O4-mini |
| Anthropic | Claude 4 Sonnet, Claude 4 Opus, Claude Opus 4.6 |
| Google | Gemini 2.5 Pro, Gemini 3 Flash, Gemini 3 Pro |

### Individual Provider Keys

| Provider | Models | API Key Required |
|----------|--------|------------------|
| OpenAI | GPT-4, GPT-4o, GPT-4 Turbo | Yes |
| Anthropic | Claude 3 Opus, Sonnet, Haiku | Yes |
| Google | Gemini Pro, Gemini 1.5 Pro | Yes |
| Ollama | Llama 2, Llama 3, Mistral, CodeLlama | No (local) |

### Setting up API Keys

```bash
# Emergent Universal Key (works for all providers)
clawbee config set ai.apiKey your-emergent-universal-key

# Or individual provider keys
clawbee config set ai.apiKey sk-your-openai-key
```

### Using Local Models (Ollama)

1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3`
3. Configure ClawBee:
   ```bash
   clawbee config set ai.provider local
   clawbee config set ai.model llama3
   ```

## 🔗 Integrations

### WhatsApp (via QR Code)

1. Run `clawbee connect whatsapp`
2. Scan the QR code with your phone
3. Open WhatsApp > Settings > Linked Devices > Link a Device
4. ClawBee will respond to your messages!

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
    └── whatsapp/        # WhatsApp session
```

## 🛠️ Development

### Building from Source

```bash
git clone https://github.com/clawbeepro/clawbee.git
cd clawbee
npm install
```

### Using as a Library

```javascript
const { AIProvider, WhatsAppBot, TelegramBot } = require('clawbee');

// Create AI provider with Emergent Universal Key
const ai = new AIProvider({
  provider: 'emergent',
  apiKey: 'your-emergent-key',
  model: 'gpt-5.2'
});

// Chat
const response = await ai.chat([
  { role: 'user', content: 'Hello!' }
]);

console.log(response.content);

// Use with different models (same key!)
ai.withModel('anthropic', 'claude-4-sonnet-20250514');
const claudeResponse = await ai.chat([
  { role: 'user', content: 'Hello from Claude!' }
]);
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

- [Website](https://clawbee.io)
- [Documentation](https://clawbee.io/docs)
- [Skill Marketplace](https://clawbee.io/marketplace)
- [Discord Community](https://discord.gg/y34Nvc7N36)
- [GitHub](https://github.com/clawbeepro/clawbee)
- [npm](https://www.npmjs.com/package/clawbee)

---

Made with 🐝 by the ClawBee Team
