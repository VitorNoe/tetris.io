class TetrisGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 30;
        this.rows = 20;
        this.cols = 10;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.pieces = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[1,1,1],[0,1,0]], // T
            [[1,1,1],[1,0,0]], // L
            [[1,1,1],[0,0,1]], // J
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]]  // Z
        ];
        this.colors = [
            '#00f3ff', '#ff00ff', '#00ff9d', 
            '#ff009d', '#9d00ff', '#ff9d00', '#00ff00'
        ];
        this.currentPiece = null;
        this.currentColor = '';
        this.currentX = 0;
        this.currentY = 0;
        this.init();
    }

    init() {
        this.spawnPiece();
        this.draw();
        this.gameLoop();
    }

    spawnPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.currentPiece = this.pieces[pieceIndex];
        this.currentColor = this.colors[pieceIndex];
        this.currentX = Math.floor(this.cols/2) - Math.floor(this.currentPiece[0].length/2);
        this.currentY = 0;
        
        if (this.collision(this.currentX, this.currentY, this.currentPiece)) {
            this.gameOver = true;
        }
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.length; y++) {
                for (let x = 0; x < this.currentPiece[y].length; x++) {
                    if (this.currentPiece[y][x]) {
                        this.drawBlock(this.currentX + x, this.currentY + y, this.currentColor);
                    }
                }
            }
        }

        // Draw grid
        this.ctx.strokeStyle = 'rgba(0, 255, 157, 0.2)';
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
        
        // Add cyberpunk effect
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x * this.gridSize, y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
    }

    collision(x, y, piece) {
        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) return true;
                    if (newY >= 0 && this.board[newY][newX]) return true;
                }
            }
        }
        return false;
    }

    rotate() {
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );
        if (!this.collision(this.currentX, this.currentY, rotated)) {
            this.currentPiece = rotated;
        }
    }

    moveDown() {
        if (!this.collision(this.currentX, this.currentY + 1, this.currentPiece)) {
            this.currentY++;
        } else {
            this.lockPiece();
        }
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    if (this.currentY + y < 0) {
                        this.gameOver = true;
                        return;
                    }
                    this.board[this.currentY + y][this.currentX + x] = this.currentColor;
                }
            }
        }
        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            this.score += linesCleared * 100;
            document.getElementById('score').textContent = this.score;
        }
    }

    gameLoop() {
        if (!this.gameOver) {
            this.moveDown();
            this.draw();
            setTimeout(() => this.gameLoop(), 1000);
        } else {
            document.getElementById('gameOver').style.display = 'block';
        }
    }
}

// Inicialização do jogo
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const startButton = document.getElementById('startButton');
    let game = null;

    startButton.addEventListener('click', () => {
        document.getElementById('gameOver').style.display = 'none';
        game = new TetrisGame(canvas);
    });

    // Controles
    document.addEventListener('keydown', (e) => {
        if (!game || game.gameOver) return;

        switch(e.keyCode) {
            case 37: // Left
                if (!game.collision(game.currentX - 1, game.currentY, game.currentPiece)) {
                    game.currentX--;
                    game.draw();
                }
                break;
            case 39: // Right
                if (!game.collision(game.currentX + 1, game.currentY, game.currentPiece)) {
                    game.currentX++;
                    game.draw();
                }
                break;
            case 40: // Down
                game.moveDown();
                game.draw();
                break;
            case 32: // Space
                game.rotate();
                game.draw();
                break;
        }
    });
});
