// Telegram bot implementation using Telegraf
const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Handle user registration
bot.start(async (ctx) => {
  const telegramUser = ctx.from;
  
  if (!telegramUser.username) {
    return ctx.reply('Sorry, you need to set a username in Telegram before you can register. Please go to Telegram settings and set a username, then try again.');
  }
  
  try {
    const response = await apiClient.post('/user/register-telegram', {
      username: telegramUser.username,
      telegramId: telegramUser.id.toString(),
      role: "user"
    });
    
    if (response.data) {
      console.log('API response for /user/register:', JSON.stringify(response.data, null, 2));
      if (response.data.data && response.data.data.apiKey) {

        return ctx.reply(`Welcome, @${telegramUser.username}! You have been successfully registered in our system.

Your API key is: ${response.data.data.apiKey}

Please save this API key securely as we don't store it locally. You'll need it for /viewkey and /recreate commands.

Join Grup : https://t.me/cooking_mayeksel`);

      } else {
        console.error('API response does not contain expected data structure:', response.data);
        return ctx.reply(`Welcome, @${telegramUser.username}! You have been successfully registered in our system.`);
      }
    } else {
      if (response.data.code === 409) {
        return ctx.reply(`Welcome back, @${telegramUser.username}! You are already registered in our system. Use /viewkey to view your key, or /recreate to regenerate it

Join our channel for updates: https://t.me/mayeksel`);
      } else {
        console.error('API error during user registration:', response.data);
        return ctx.reply('Sorry, there was an error processing your registration. Please try again later.');
      }
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 409) {
        return ctx.reply(`Welcome back, @${telegramUser.username}! You are already registered in our system. Use /viewkey to view your key.

Join our channel for updates: https://t.me/mayeksel`);
      } else {
        console.error('API error during user registration:', error.response.data);
        return ctx.reply('Sorry, there was an error processing your registration. Please try again later.');
      }
    } else if (error.request) {
      console.error('Network error during user registration:', error.message);
      return ctx.reply('Sorry, there was a network error processing your registration. Please try again later.');
    } else {
      console.error('Unexpected error during user registration:', error.message);
      return ctx.reply('Sorry, there was an unexpected error processing your registration. Please try again later.');
    }
  }
});

// Handle view API key request
bot.command('viewkey', async (ctx) => {
  const telegramUser = ctx.from;
  const telegramId = telegramUser.id

  try {
    const response = await apiClient.get(`/user/telegram/${telegramId.toString()}/key`, {
    });

    console.log(response.data)
    
    if (response.data.success == true ) {
      const retrievedApiKey = response.data.data.key;
      // Convert timestamps to GMT+7 (Jakarta) timezone
      const createdAt = new Date(response.data.data.createdAt).toLocaleString('en-GB', { 
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const updatedAt = new Date(response.data.data.updatedAt).toLocaleString('en-GB', { 
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const lastUsedAt = new Date(response.data.data.lastUsedAt).toLocaleString('en-GB', { 
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      return ctx.reply(`Here is your API key:

${retrievedApiKey}

Key Information:
- Created: ${createdAt}
- Last Updated: ${updatedAt}
- Last Used: ${lastUsedAt}

Keep this key secure and don't share it with anyone!
Use /recreate to regenerate your key.`);
    } else {
      console.error('API response does not contain expected data structure:', response.data);
      return ctx.reply('Sorry, we could not retrieve your API key. Please try again later.');
    }
  } catch (error) {
    console.error('Error retrieving API key from API:', error.response ? error.response.data : error.message);
    return ctx.reply('Sorry, there was an error retrieving your API key. Please check your API key and try again.');
  }
});

// Handle recreate API key request  
bot.command('recreate', async (ctx) => {
  const telegramUser = ctx.from;
  const telegramId = telegramUser.id;

  try {
    const keyResponse = await apiClient.get(`/user/telegram/${telegramId.toString()}/key`, {
    });

    if (keyResponse.data.success && keyResponse.data.data && keyResponse.data.data.key) {
      const currentApiKey = keyResponse.data.data.key;

      const response = await apiClient.put(`/user/me/keys/${telegramUser.username}/recreate`, {}, {
        headers: {
          'x-api-key': currentApiKey
        }
      });
      
      if (response.data.success && response.data.data.key) {
        const newApiKey = response.data.data.key;
        
        return ctx.reply(`Your API key has been successfully regenerated.

Your new API key is:

${newApiKey}

Keep this key secure and don't share it with anyone!`);
      } else {
        console.error('API response does not contain expected data structure:', response.data);
        return ctx.reply('Sorry, we could not regenerate your API key. Please try again later.');
      }
    } else {
      console.error('Could not retrieve current API key for user:', keyResponse.data);
      return ctx.reply('Sorry, we could not authenticate your request. Please contact support or try /start to register again.');
    }
  } catch (error) {
    console.error('Error regenerating API key:', error.response ? error.response.data : error.message);
    return ctx.reply('Sorry, there was an error regenerating your API key. Please try again later.');
  }
});

// Handle health check command
bot.command('health', async (ctx) => {
  try {
    const response = await axios.get('http://api.axios.lol/health');
    
    if (response.data.success) {
      const healthData = response.data.data;
      return ctx.reply(`🟢 Crypto API Health Status:

Status: ${healthData.status}
Latency: ${healthData.latency}
Timestamp: ${new Date(healthData.timestamp).toLocaleString()}
Message: ${response.data.message}`);
    } else {
      return ctx.reply('🔴 API Health Check: Service is not responding properly');
    }
  } catch (error) {
    console.error('Error during health check:', error.message);
    return ctx.reply('🔴 API Health Check: Unable to connect to the service');
  }
});

// Handle help command
bot.help((ctx) => {
  ctx.reply(`This bot allows you to register for our service using your Telegram username.

Commands:
/start - Register for the service
/viewkey - View your API key details
/recreate - Regenerate your API key
/health - Check API health status`);
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('Oops, something went wrong! Please try again later.');
});

// Start the bot
bot.launch()
  .then(() => {
    console.log('Telegram bot started successfully');
  })
  .catch((error) => {
    console.error('Failed to start Telegram bot:', error);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
});

module.exports = bot;