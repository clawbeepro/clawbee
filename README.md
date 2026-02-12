# 🐝 ClawBee

**Your Personal AI, Endless Possibilities.**

ClawBee is an open-source AI assistant that runs locally on your machine and connects to any chat app you already use.

![ClawBee](https://clawbee.pro/og-image.png)

## ✨ Features

- 🖥️ **Runs Locally** - Your data stays on your machine
- 💬 **Any Chat App** - WhatsApp, Telegram, Discord, Slack, and more
- 🧠 **Persistent Memory** - Remembers context across conversations
- 🌐 **Browser Control** - Automate web tasks
- 🔧 **Extensible** - Add skills from the marketplace or build your own
- 🔒 **Private & Secure** - Full control over your data

## 🚀 Quick Start

### One-liner Install

```bash
curl -fsSL https://clawbee.pro/install.sh | bash
```

### npm Install

```bash
npm install -g clawbee
clawbee onboard
```

### From Source

```bash
git clone https://github.com/clawbeepro/clawbee.git
cd clawbee
pnpm install
pnpm run build
pnpm run clawbee onboard
```

## 📖 Usage

```bash
# Start the onboarding wizard
clawbee onboard

# Start the daemon
clawbee start

# Chat in terminal
clawbee chat

# Connect a chat platform
clawbee connect whatsapp
clawbee connect telegram
clawbee connect discord

# Check status
clawbee status

# Manage skills
clawbee skills list
clawbee skills install email-manager
clawbee skills search calendar

# Configuration
clawbee config show
clawbee config set ai.provider openai
clawbee config set ai.apiKey sk-xxx
```

## 🔌 Integrations

| Platform | Status |
|----------|--------|
| WhatsApp | ✅ Supported |
| Telegram | ✅ Supported |
| Discord | ✅ Supported |
| Slack | ✅ Supported |
| Signal | 🚧 Coming Soon |
| iMessage | 🚧 Coming Soon |

## 🧩 AI Providers

- OpenAI (GPT-4, GPT-4 Turbo)
- Anthropic (Claude 3)
- Google (Gemini Pro)
- Local Models (Ollama, LM Studio)

## 📁 Directory Structure

```
~/.config/clawbee/     # Configuration files
~/.local/share/clawbee/
  ├── skills/          # Installed skills
  ├── memory/          # Conversation memory
  └── logs/            # Log files
```

## 🛠️ Development

```bash
# Clone the repo
git clone https://github.com/clawbeepro/clawbee.git
cd clawbee

# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build
pnpm run build

# Run tests
pnpm test
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

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

---

Made with 🐝 by the ClawBee Team
