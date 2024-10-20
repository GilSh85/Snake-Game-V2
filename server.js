const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Gs235331!',
    database: 'snake_game'
};

async function initializeDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await connection.query(`USE ${dbConfig.database}`);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                high_score INT DEFAULT 0
            )
        `);

        console.log('Database and table initialized successfully');
        await connection.end();
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

const pool = mysql.createPool(dbConfig);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/register', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    if (password.length < 8) {
        return res.json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)';
        await pool.query(query, [email, hashedPassword, firstName, lastName]);
        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.json({ success: false, message: 'Email already exists' });
        } else {
            res.json({ success: false, message: 'Registration failed' });
        }
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (results.length > 0) {
            const match = await bcrypt.compare(password, results[0].password);
            if (match) {
                res.json({
                    success: true,
                    message: 'Login successful',
                    highScore: results[0].high_score,
                    firstName: results[0].first_name,
                    lastName: results[0].last_name
                });
            } else {
                res.json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Login failed' });
    }
});

app.post('/updateHighScore', async (req, res) => {
    const { score, email } = req.body;

    try {
        const query = 'UPDATE users SET high_score = ? WHERE email = ? AND high_score < ?';
        const [result] = await pool.query(query, [score, email, score]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'High score updated' });
        } else {
            res.json({ success: true, message: 'High score not updated (not higher than current)' });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Failed to update high score' });
    }
});