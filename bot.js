// Telegram bot implementation using Telegraf
const { Telegraf } = require('telegraf');
const axios = require('axios');
const db = require('./database');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

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
    const response = await apiClient.post('/user/register', {
      username: telegramUser.username
    });
    
    if (response.data.success) {
      console.log('API response for /user/register:', JSON.stringify(response.data, null, 2));
      if (response.data.data && response.data.data.apiKey) {
        console.log(`Saving API key to database for user ${telegramUser.id}`);
        db.saveUserApiKey(telegramUser.id, telegramUser.username, response.data.data.apiKey, (err) => {
          if (err) {
            console.error('Error saving API key to database:', err);
          } else {
            console.log(`Successfully saved API key to database for user ${telegramUser.id}`);
          }
        });
        
        return ctx.reply(`Welcome, @${telegramUser.username}! You have been successfully registered in our system.

Use /viewkey to view your API key anytime.\nJoin our channel for updates: https://t.me/mayeksel`);
      } else {
        console.error('API response does not contain expected data structure:', response.data);
        return ctx.reply(`Welcome, @${telegramUser.username}! You have been successfully registered in our system.`);
      }
    } else {
      if (response.data.code === 409) {
        return ctx.reply(`Welcome back, @${telegramUser.username}! You are already registered in our system. Use /viewkey to view your key, or /recreate to regenerate it

Our services are not affiliated with any others.
Trust yourself!`);
      } else {
        console.error('API error during user registration:', response.data);
        return ctx.reply('Sorry, there was an error processing your registration. Please try again later.');
      }
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 409) {
        return ctx.reply(`Welcome back, @${telegramUser.username}! You are already registered in our system. Use /viewkey to view your key.\n\nJoin our channel for updates: https://t.me/mayeksel`);
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
bot.command('viewkey', (ctx) => {
  const telegramUser = ctx.from;
  
  db.getUserApiKey(telegramUser.id, (err, apiKey) => {
    if (err) {
      console.error('Database error retrieving API key:', err);
      return ctx.reply('Sorry, there was an error retrieving your API key. Please try again later.');
    }
    
    if (apiKey) {
      // Use x-api-key header for authentication
      apiClient.get('/user/me/keys', {
        headers: {
          'x-api-key': apiKey
        }
      })
      .then(response => {
        if (response.data.success && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0 && response.data.data[0].key) {
          const retrievedApiKey = response.data.data[0].key;
          const createdAt = response.data.data[0].createdAt;
          const updatedAt = response.data.data[0].updatedAt;
          const lastUsedAt = response.data.data[0].lastUsedAt;
          
          // Update database if API key has changed
          if (retrievedApiKey !== apiKey) {
            db.saveUserApiKey(telegramUser.id, telegramUser.username, retrievedApiKey, (err) => {
              if (err) {
                console.error('Error saving API key to database:', err);
              }
            });
          }
          
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
      })
      .catch(error => {
        console.error('Error retrieving API key from API:', error.response ? error.response.data : error.message);
        return ctx.reply('Sorry, there was an error retrieving your API key. Please try again later.');
      });
    } else {
      return ctx.reply('Sorry, we could not find your API key. Please use /start to register first.');
    }
  });
});

// Handle recreate API key request
bot.command('recreate', (ctx) => {
  const telegramUser = ctx.from;
  
  if (!telegramUser.username) {
    return ctx.reply('Sorry, you need to set a username in Telegram before you can recreate your API key.');
 }
  
  // First, get the user's API key from the database for authentication
  db.getUserApiKey(telegramUser.id, (err, apiKey) => {
    if (err || !apiKey) {
      return ctx.reply('Sorry, we could not authenticate your request. Please use /start to register first.');
    }
    
    // Use the new endpoint with x-api-key header for authentication
    apiClient.put(`/user/me/keys/${telegramUser.username}/recreate`, {}, {
      headers: {
        'x-api-key': apiKey
      }
    })
    .then(response => {
      if (response.data.success && response.data.data.key) {
        const newApiKey = response.data.data.key;
        db.saveUserApiKey(telegramUser.id, telegramUser.username, newApiKey, (err) => {
          if (err) {
            console.error('Error updating API key in database:', err);
          }
        });
        
        return ctx.reply(`Your API key has been successfully regenerated.

Your new API key is:

${newApiKey}

Keep this key secure and don't share it with anyone!`);
      } else {
        console.error('API response does not contain expected data structure:', response.data);
        return ctx.reply('Sorry, we could not regenerate your API key. Please try again later.');
      }
    })
    .catch(error => {
      console.error('Error regenerating API key:', error.response ? error.response.data : error.message);
      return ctx.reply('Sorry, there was an error regenerating your API key. Please try again later.');
    });
  });
});

// Handle help command
bot.help((ctx) => {
  ctx.reply(`This bot allows you to register for our service using your Telegram username.

Commands:
/start - Register for the service
/viewkey - View your API key
/recreate - Regenerate your API key`);
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
  db.closeDatabase();
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  db.closeDatabase();
  bot.stop('SIGTERM');
});

module.exports = bot;