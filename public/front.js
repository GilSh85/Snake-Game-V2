const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const userInfoElement = document.getElementById('user-info');
const gameContainer = document.getElementById('game-container');
const loginContainer = document.querySelector('.login-container');
const startMessage = document.getElementById('start-message');
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{x: 200, y: 200}];
let food = {};
let direction = 'right';
let score = 0;
let highScore = 0;
let gameInterval;
let currentUser = null;
let gameStarted = false;

function showRegisterForm() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
}

function showLoginForm() {
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success) {
            currentUser = {
                email: email,
                firstName: data.firstName,
                lastName: data.lastName
            };
            highScore = data.highScore;
            startGame();
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

async function register() {
    const firstName = document.getElementById('register-first-name').value;
    const lastName = document.getElementById('register-last-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, firstName, lastName }),
        });

        const data = await response.json();

        if (data.success) {
            alert('Registration successful! Please log in.');
            clearRegisterForm();
            showLoginForm();
        } else {
            alert('Registration failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration. Please try again.');
    }
}

function clearRegisterForm() {
    document.getElementById('register-first-name').value = '';
    document.getElementById('register-last-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
}

function startGame() {
    document.querySelector('.background').style.display = 'none';
    gameContainer.style.display = 'block';
    userInfoElement.textContent = `Welcome, ${currentUser.firstName} ${currentUser.lastName}!`;
    highScoreElement.textContent = `High Score: ${highScore}`;
    startNewGame();
}

function drawSnakePart(snakePart, index) {
    if (index == 0) {
        
        ctx.fillStyle = 'rgba(0, 200, 0, 0.8)'; 
        ctx.beginPath();
        ctx.arc(snakePart.x + gridSize/2, snakePart.y + gridSize/2, gridSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'darkgreen';
        ctx.stroke();

        
        ctx.fillStyle = 'white';
        let eyeSize = gridSize / 5;
        let eyeOffset = gridSize / 3;
        
        
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        switch(direction) {
            case 'up':
                leftEyeX = snakePart.x + eyeOffset;
                leftEyeY = snakePart.y + eyeOffset;
                rightEyeX = snakePart.x + gridSize - eyeOffset;
                rightEyeY = snakePart.y + eyeOffset;
                break;
            case 'down':
                leftEyeX = snakePart.x + eyeOffset;
                leftEyeY = snakePart.y + gridSize - eyeOffset;
                rightEyeX = snakePart.x + gridSize - eyeOffset;
                rightEyeY = snakePart.y + gridSize - eyeOffset;
                break;
            case 'left':
                leftEyeX = snakePart.x + eyeOffset;
                leftEyeY = snakePart.y + eyeOffset;
                rightEyeX = snakePart.x + eyeOffset;
                rightEyeY = snakePart.y + gridSize - eyeOffset;
                break;
            case 'right':
                leftEyeX = snakePart.x + gridSize - eyeOffset;
                leftEyeY = snakePart.y + eyeOffset;
                rightEyeX = snakePart.x + gridSize - eyeOffset;
                rightEyeY = snakePart.y + gridSize - eyeOffset;
                break;
        }
        
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize/2, 0, Math.PI * 2);
        ctx.arc(rightEyeX, rightEyeY, eyeSize/2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(snakePart.x, snakePart.y, gridSize, gridSize);
        ctx.strokeStyle = 'darkgreen';
        ctx.strokeRect(snakePart.x, snakePart.y, gridSize, gridSize);
    }
}

function drawFood() {
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(food.x + gridSize/2, food.y + gridSize/2, gridSize/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'darkred';
    ctx.stroke();
      
    
}

function moveSnake() {
    const head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
        case 'up': head.y -= 10; break;
        case 'down': head.y += 10; break;
        case 'left': head.x -= 10; break;
        case 'right': head.x += 10; break;
    }

    snake.unshift(head);

    if (head.x == food.x && head.y == food.y) {
        score++;
        scoreElement.textContent = `Score: ${score}`;
        generateFood();
    } else {
        snake.pop();
    }
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * 50) * 10,
        y: Math.floor(Math.random() * 50) * 10
    };
    if (snake.some(part => part.x == food.x && part.y == food.y)) {
        generateFood();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    moveSnake();
    drawFood();
    snake.forEach(drawSnakePart);

    if (isGameOver()) {
        clearInterval(gameInterval);
        alert(`Game Over! Your score: ${score}`);
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = `High Score: ${highScore}`;
            updateHighScore(score);
        }
        startNewGame();
    }
}

function isGameOver() {
    const head = snake[0];
    return (
        head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height ||
        snake.slice(1).some(part => part.x == head.x && part.y == head.y)
    );
}

function startNewGame() {
    snake = [{x: 200, y: 200}];
    direction = '';
    score = 0;
    scoreElement.textContent = 'Score: 0';
    generateFood();
    if (gameInterval) clearInterval(gameInterval);
    gameStarted = false;
    startMessage.style.display = 'block';
    drawInitialState();
}

function drawInitialState() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    drawSnakePart(snake[0], 0);
}

function exitGame() {
    clearInterval(gameInterval);
    gameContainer.style.display = 'none';
    document.querySelector('.background').style.display = 'flex';
    currentUser = null;
    showLoginForm();
}

async function updateHighScore(score) {
    try {
        const response = await fetch('/updateHighScore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ score, email: currentUser.email }),
        });

        const data = await response.json();

        if (!data.success) {
            console.error('Failed to update high score:', data.message);
        }
    } catch (error) {
        console.error('Error updating high score:', error);
    }
}
document.addEventListener('keydown', (e) => {
    if (!gameStarted && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        gameStarted = true;
        startMessage.style.display = 'none';
        gameInterval = setInterval(gameLoop, 150);
    }

    switch (e.key) {
        case 'ArrowUp': if (direction != 'down') direction = 'up'; break;
        case 'ArrowDown': if (direction != 'up') direction = 'down'; break;
        case 'ArrowLeft': if (direction != 'right') direction = 'left'; break;
        case 'ArrowRight': if (direction != 'left') direction = 'right'; break;

    }
})
