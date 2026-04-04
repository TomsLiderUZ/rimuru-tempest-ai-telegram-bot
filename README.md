![Banner](public/assets/images/banner.jpg)

# Rimuru Tempest AI Telegram Bot

A persistent personality-driven AI Telegram bot that embodies Rimuru Tempest from the Tensura universe.

Built with production-grade Node.js architecture by the Anitoku Team.

## Features

- **Persistent Identity**: Rimuru Tempest personality that never breaks character.
- **Dynamic Relationships**: Evolving user relationships from stranger to friend.
- **Memory System**: Remembers every conversation and user detail.
- **Language Matching**: Automatically responds in the user's language (Uzbek, English, Russian, etc.).
- **Group Chat Support**: Responds only when mentioned in group chats.
- **API Key Rotation**: Automatic Groq API key switching on rate limits (supports multiple keys).
- **Atomic Data Storage**: Corruption-safe local JSON database for chats, users, and relationships.
- **Idle Follow-ups**: Sends messages to friends after periods of silence.

---

## Prerequisites

- **Node.js**: v18.0.0 or higher.
- **Telegram Bot Token**: Created via [@BotFather](https://t.me/BotFather).
- **Groq API Keys**: At least one key from [Groq Console](https://console.groq.com/keys).

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/TomsLiderUZ/rimuru-tempest-ai-telegram-bot
cd rimuru-tempest-ai-telegram-bot

# 2. Install dependencies
npm install

# 3. Create a .env file from the example
cp .env.example .env

# 4. Initialize data folders
npm run init-data

# 5. Start the bot
npm start
```

---

## Configuration (`.env`)

Create a `.env` file in the root directory and fill it with the following template:

```env
# Telegram Configuration
BOT_TOKEN=your_bot_token
BOT_USERNAME=your_bot_username
ADMIN_NAME=Your_Admin_Name
ADMIN_CONTACT_LINK=https://t.me/your_admin_username

# AI Configuration (Groq API Keys)
GROQ_API_KEY_1=your_groq_key_1
GROQ_API_KEY_2=your_groq_key_2
GROQ_API_KEY_3=your_groq_key_3
GROQ_API_KEY_4=your_groq_key_4
GROQ_API_KEY_5=your_groq_key_5

# Model Configuration
GROQ_MODEL=openai/gpt-oss-120b
DEFAULT_LANGUAGE=uz

# Server Configuration
PORT=3000
```

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | Your Telegram bot token. |
| `BOT_USERNAME` | The username of your bot (without @). |
| `ADMIN_NAME` | Your name for Rimuru to recognize. |
| `ADMIN_CONTACT_LINK` | Link to your Telegram for support. |
| `GROQ_API_KEY_1...N` | Multiple keys for rotation when rate limits are hit. |
| `GROQ_MODEL` | The AI model to use (default: `openai/gpt-oss-120b`). |
| `DEFAULT_LANGUAGE` | Default response language if detection fails. |

---

## System Logic (Personality & Dimensionality)

### Relationship Progression
Rimuru's behavior changes based on his "opinion" of you:
- **Stranger**: Cold, dismissive, or suspicious. He will investigate how you reached him.
- **Known**: Recognizes you by name, becomes slightly more conversational.
- **Friend**: Warm, shares details about Tempest, sends follow-up messages if he hasn't heard from you.
- **Enemy**: Blocked status. Rimuru will refuse to talk to you after repeated insults.

### The ANITOKU Gate
The bot is programmed with "Mortal Pride" and "Dimensional Awareness". He knows he's connected via a "bridge" (portal) and will react with curiosity or condescension when challenged about his nature.

### Commands
- `/start` - Initial setup and introduction.
- `/restart` - Manually restart the Telegram connection.

---

## Deployment on Hosting Platforms

The bot includes a built-in health check server for platforms like **Render**, **Heroku**, or **Railway**.

1. **Port**: The bot listens on the port defined by `$PORT` (default 3000).
2. **Endpoints**:
   - `GET /` - Simple alive check.
   - `GET /health` - JSON status with uptime and timestamp information.
3. **Persistency**: If using a platform with an ephemeral filesystem, ensure your `data/` directory is either on a persistent volume or use a cloud database provider.

---

## Maintenance & Tools

```bash
# Repair the local JSON database if corrupted
npm run repair-db

# Run with development auto-restart
npm run dev
```

## Internal Architecture Overview

```
src/
├── ai/          # AI client, key rotation logic, dynamic prompt builder
├── bot/         # handlers, middleware, idle message scheduler
├── config/      # System settings, paths, and shared constants
├── memory/      # User storage, relationship states, conversation buffers
├── prompts/     # Rimuru's personality rules (merged core & behavior)
├── services/    # Higher-level logic orchestration
├── storage/     # Atomic JSON writer for safe data persistence
└── utils/       # Shared logger, time, and validation utilities
```

## Official Bot Link

[https://t.me/rimuru_tempest_ai_bot](https://t.me/rimuru_tempest_ai_bot)

## License

[MIT](LICENSE) © ANITOKU Team
