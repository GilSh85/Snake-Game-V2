const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gs235331!',
    database: 'snake_game'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

app.get('/', (req, res) =>{
    res.sendFile(Path2D.join(__dirname, 'public', 'index.html'));
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    if (password.length < 8) {
        return res.json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(query, [email, hashedPassword], (err, result) => {
        if (err) {
            console.error(err);
            res.json({ success: false, message: 'Registration failed' });
        } else {
            res.json({ success: true, message: 'Registration successful' });
        }
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error(err);
            res.json({ success: false, message: 'Login failed' });
        } else if (results.length > 0) {
            const match = await bcrypt.compare(password, results[0].password);
            if (match) {
                res.json({ success: true, message: 'Login successful', highScore: results[0].high_score });
            } else {
                res.json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.json({ success: false, message: 'User not found' });
        }
    });
});

app.post('/updateHighScore', (req, res) => {
    const { score, email } = req.body;

    const query = 'UPDATE users SET high_score = ? WHERE email = ? AND high_score < ?';
    db.query(query, [score, email, score], (err, result) => {
        if (err) {
            console.error(err);
            res.json({ success: false, message: 'Failed to update high score' });
        } else {
            res.json({ success: true, message: 'High score updated' });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});