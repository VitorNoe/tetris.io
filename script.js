let isGameRunning = false;
const MAX_HIGHSCORES = 5;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
const BLOCK_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Cores no estilo Frutiger Aero
const COLORS = [
    '#7EC8E3', // Azul claro
    '#8FD8A0', // Verde água
    '#FFD700', // Dourado
    '#FF6B6B', // Coral
    '#BA55D3', // Lavanda
    '#4ECDC4', // Turquesa
    '#FFA07A'  // Salmão
];

// Peças do Tetris
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let gameLoop;
let dropCounter = 0;
let lastTime = 0;

class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
        this.x = Math.floor(BOARD_WIDTH/2) - Math.floor(shape[0].length/2);
        this.y = 0;
    }
}

function createNewPiece() {
    const index = Math.floor(Math.random() * SHAPES.length);
    return new Piece(SHAPES[index], COLORS[index]);
}

function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // Efeito de brilho
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, 2);
    
    // Borda
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grade de fundo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    for(let y = 0; y < BOARD_HEIGHT; y++) {
        for(let x = 0; x < BOARD_WIDTH; x++) {
            ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
    
    // Peças no tabuleiro
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value) {
                drawBlock(ctx, x, y, value);
            }
        });
    });
    
    // Peça atual
    if(currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if(value) {
                    drawBlock(ctx, x + currentPiece.x, y + currentPiece.y, currentPiece.color);
                }
            });
        });
    }
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value) {
                drawBlock(nextCtx, x + 1, y + 1, nextPiece.color);
            }
        });
    });
}

function collision() {
    return currentPiece.shape.some((row, y) => {
        return row.some((value, x) => {
            if(!value) return false;
            const newX = currentPiece.x + x;
            const newY = currentPiece.y + y;
            return newX < 0 || 
                   newX >= BOARD_WIDTH ||
                   newY >= BOARD_HEIGHT ||
                   board[newY]?.[newX];
        });
    });
}

function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value) {
                board[y + currentPiece.y][x + currentPiece.x] = currentPiece.color;
            }
        });
    });
}

function rotate() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    const previousShape = currentPiece.shape;
    currentPiece.shape = rotated;
    if(collision()) {
        currentPiece.shape = previousShape;
    }
}

function clearLines() {
    let linesCleared = 0;
    for(let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if(board[y].every(value => value)) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
        }
    }
    if(linesCleared > 0) {
        score += linesCleared * 100 * level;
        document.getElementById('score').textContent = score;
        if(score >= level * 1000) {
            level++;
            document.getElementById('level').textContent = level;
        }
    }
}

function gameOver() {
    cancelAnimationFrame(gameLoop);
    updateHighscores();
    document.querySelector('.start-screen').style.display = 'flex';
    isGameRunning = false;
    alert(`Game Over! Score: ${score}`);
}

function updateHighscores() {
    let highscores = JSON.parse(localStorage.getItem('tetrisHighscores')) || [];
    highscores.push(score);
    highscores = [...new Set(highscores)].sort((a, b) => b - a).slice(0, MAX_HIGHSCORES);
    localStorage.setItem('tetrisHighscores', JSON.stringify(highscores));
    
    const list = document.getElementById('highscores-list');
    list.innerHTML = highscores.map(score => `<li>${score}</li>`).join('');
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    if(dropCounter > 1000 / level) {
        currentPiece.y++;
        if(collision()) {
            currentPiece.y--;
            merge();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createNewPiece();
            drawNextPiece();
            if(collision()) {
                // Game Over
                cancelAnimationFrame(gameLoop);
                alert(`Game Over! Score: ${score}`);
            }
        }
        dropCounter = 0;
    }
    
    drawBoard();
    gameLoop = requestAnimationFrame(update);
}

document.getElementById('start').addEventListener('click', () => {
    document.querySelector('.start-screen').style.display = 'none';
    if(!isGameRunning) {
        board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        score = 0;
        level = 1;
        currentPiece = createNewPiece();
        nextPiece = createNewPiece();
        isGameRunning = true;
        update();
    }
});

document.addEventListener('keydown', event => {
    switch(event.keyCode) {
        case 37: // Left
            currentPiece.x--;
            if(collision()) currentPiece.x++;
            break;
        case 39: // Right
            currentPiece.x++;
            if(collision()) currentPiece.x--;
            break;
        case 40: // Down
            currentPiece.y++;
            if(collision()) {
                currentPiece.y--;
                merge();
                clearLines();
                currentPiece = nextPiece;
                nextPiece = createNewPiece();
                drawNextPiece();
            }
            dropCounter = 0;
            break;
        case 38: // Up
            rotate();
            break;
        case 32: // Space
            while(!collision()) {
                currentPiece.y++;
            }
            currentPiece.y--;
            merge();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createNewPiece();
            drawNextPiece();
            break;
    }
});

document.getElementById('restart').addEventListener('click', () => {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    score = 0;
    level = 1;
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    currentPiece = createNewPiece();
    nextPiece = createNewPiece();
    drawNextPiece();
    if(gameLoop) cancelAnimationFrame(gameLoop);
    update();
});

// Inicialização
currentPiece = createNewPiece();
nextPiece = createNewPiece();
drawNextPiece();
update();
