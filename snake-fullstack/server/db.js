const { Pool } = require('pg');
require('dotenv').config(); // Цей рядок "вмикає" читання файлу .env

const pool = new Pool({
  // Беремо лінк прямо з нашого "сейфа" .env
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Обов'язково для хмарних баз на Neon
  }
});

// Перевірка підключення
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Помилка підключення до Neon:', err.message);
  } else {
    console.log('✅ Сервер успішно підключився до хмарної бази Neon!');
  }
});

module.exports = pool;