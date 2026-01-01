const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');
const pool = require('./db');
const bcrypt = require('bcrypt');

const app = express();
const myCache = new NodeCache({ stdTTL: 100 }); 
// Знайди це: const JWT_SECRET = 'super_secret_key_123';
// Заміни на це:
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'; 

app.use(cors({ origin: 'http://localhost:3000', credentials: true })); 
app.use(express.json()); 
app.use(cookieParser()); 

// --- РЕЄСТРАЦІЯ ---
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
            [username, hashedPassword]
        );
        res.json({ message: 'Користувач створений!', username: newUser.rows[0].username });
    } catch (err) {
        res.status(500).json({ error: 'Логін вже зайнятий' });
    }
});

// --- ВХІД ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length > 0) {
            const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
            if (validPassword) {
                const token = jwt.sign({ userId: user.rows[0].id, name: username }, JWT_SECRET);
                res.cookie('token', token, { httpOnly: true, maxAge: 3600000, sameSite: 'lax' }); 
                return res.json({ message: 'Вхід успішний!', username });
            }
        }
        res.status(401).json({ error: 'Невірні дані' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

// --- ВИХІД (Очищення куків) ---
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Ви вийшли' });
});

// --- ЗБЕРЕЖЕННЯ РЕЗУЛЬТАТУ ---
app.post('/score', async (req, res) => {
    const { score } = req.body;
    const token = req.cookies.token; 
    if (!token) return res.status(401).json({ error: 'Треба залогінитись' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await pool.query('INSERT INTO scores (user_id, score) VALUES ($1, $2)', [decoded.userId, score]);
        myCache.del('top_scores'); // Очищуємо кеш рейтингу
        res.json({ message: 'Рекорд збережено!' });
    } catch (err) {
        res.status(401).json({ error: 'Недійсний токен' });
    }
});

// --- РЕЙТИНГ (ФІКС ПОВТОРЕНЬ) ---
app.get('/leaderboard', async (req, res) => {
    const cachedData = myCache.get('top_scores');
    if (cachedData) return res.json(cachedData);

    try {
        // GROUP BY гарантує, що кожне ім'я буде в списку лише ОДИН раз із найкращим результатом
        const result = await pool.query(`
            SELECT u.username, MAX(s.score) as score 
            FROM scores s 
            JOIN users u ON s.user_id = u.id 
            GROUP BY u.username 
            ORDER BY score DESC 
            LIMIT 10
        `);
        myCache.set('top_scores', result.rows);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Помилка бази' }); }
});

// --- ПЕРЕВІРКА СЕСІЇ (Автологін) ---
app.get('/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Немає сесії' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Якщо токен валідний, повертаємо ім'я користувача
        res.json({ username: decoded.name });
    } catch (err) {
        res.status(401).json({ error: 'Сесія застаріла' });
    }
}); 

app.listen(5000, () => console.log('Server started on port 5000'));