// telegram-bot/database.js - SQLite database module for telegram bot
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or open the database file
const dbPath = path.join(__dirname, 'telegram-bot.db');
const db = new sqlite3.Database(dbPath, (err) => {
 if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize the database and create tables if they don't exist
function initializeDatabase() {
  console.log('Initializing database');
  db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      api_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table ready');
      }
    });
  });
}

// Save or update user API key
function saveUserApiKey(telegramId, username, apiKey, callback) {
  console.log(`Saving API key to database for telegram_id: ${telegramId}, username: ${username}`);
  const query = `
    INSERT OR REPLACE INTO users (telegram_id, username, api_key, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [telegramId, username, apiKey], function(err) {
    if (err) {
      console.error('Error executing saveUserApiKey query:', err);
    } else {
      console.log(`Successfully saved API key to database for telegram_id: ${telegramId}`);
    }
    callback(err, this ? this.lastID : null);
  });
}

// Get user API key by telegram ID
function getUserApiKey(telegramId, callback) {
  console.log(`Retrieving API key from database for telegram_id: ${telegramId}`);
  const query = 'SELECT api_key FROM users WHERE telegram_id = ?';
  
  db.get(query, [telegramId], (err, row) => {
    if (err) {
      console.error('Error executing getUserApiKey query:', err);
      callback(err, null);
    } else {
      console.log(`Found API key in database for telegram_id ${telegramId}: ${row ? row.api_key : 'null'}`);
      callback(null, row ? row.api_key : null);
    }
  });
}

// Get user API key by username
function getUserApiKeyByUsername(username, callback) {
  const query = 'SELECT api_key FROM users WHERE username = ?';
  
  db.get(query, [username], (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, row ? row.api_key : null);
    }
  });
}

// Update user API key
function updateUserApiKey(telegramId, newApiKey, callback) {
  console.log(`Updating API key in database for telegram_id: ${telegramId}`);
  const query = 'UPDATE users SET api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?';
  
  db.run(query, [newApiKey, telegramId], function(err) {
    if (err) {
      console.error('Error executing updateUserApiKey query:', err);
    } else {
      console.log(`Successfully updated API key in database for telegram_id: ${telegramId}`);
    }
    callback(err, this ? this.changes : 0);
  });
}

// Close the database connection
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}

// Initialize the database when the module is loaded
initializeDatabase();

module.exports = {
  saveUserApiKey,
  getUserApiKey,
  getUserApiKeyByUsername,
  updateUserApiKey,
  closeDatabase
};