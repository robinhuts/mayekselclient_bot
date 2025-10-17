# Telegram Bot for Crypto API

This Telegram bot allows users to register for our crypto service, view their API key, and regenerate their API key as needed. It integrates with our main Crypto API service to manage user accounts and API keys.

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- A Telegram Bot Token (obtained from [@BotFather](https://t.me/BotFather))
- Access to the Crypto API service

## Installation

1. Clone the repository or navigate to the telegram-bot directory
2. Install the required dependencies:
   ```bash
   npm install
   ```

## Configuration

Before running the bot, you need to set up the environment variables. Copy the `.env.example` file to `.env` and fill in the required values:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# API Configuration
API_BASE_URL=http://localhost:3000/api
```

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token obtained from [@BotFather](https://t.me/BotFather)
- `API_BASE_URL`: The base URL of your Crypto API service (default is http://localhost:3000/api)

## Usage

To start the bot, run:

```bash
npm start
```

Or for development with auto-restart on file changes:

```bash
npm run dev
```

## Bot Commands

- `/start` - Register for the service or check if already registered
- `/viewkey` - View your API key and key information (usage: /viewkey [your_api_key])
- `/recreate` - Regenerate your API key (usage: /recreate [your_api_key])
- `/help` - Display help information about the bot commands

## Database

The bot no longer uses a local database to store user information. API keys are not stored locally and must be provided with each request to /viewkey or /recreate commands.
```

## License

This project is licensed under the ISC License.

## Contact

For support or inquiries, please contact the development team or join our Telegram channel: https://t.me/mayeksel