// --- Game Constants and DOM Elements ---
const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');
const GAME_SIZE = 600;
const SEG_SIZE = 20;
const MAX_COORD = (GAME_SIZE / 2) - SEG_SIZE;

const START_MENU = document.getElementById('start-menu');
const START_BUTTON = document.getElementById('start-button');
const COLOR_OPTIONS = document.getElementsByName('snake_color');

let SNAKE_COLOR = document.querySelector('input[name="snake_color"]:checked').value;

// --- New Global Variables for Background Scrolling ---
let backgroundOffsetX = 0;
let backgroundOffsetY = 0;
const TILE_COLOR_1 = '#111'; // Darker black
const TILE_COLOR_2 = '#000'; // Pure black


// --- Snake, Food, and Scoreboard Classes (No Changes Needed Here) ---

class Snake {
    constructor(color) {
        this.segments = [];
        this.snakeColor = color;
        this.reset();
        this.direction = { x: SEG_SIZE, y: 0 };
    }
    reset() {
        this.segments = [];
        for (let i = 0; i < 3; i++) {
            this.segments.push({ x: 0 - i * SEG_SIZE, y: 0 });
        }
        this.direction = { x: SEG_SIZE, y: 0 };
        this.segmentsToKeep = this.segments.length;
        // Reset background offset on game reset
        backgroundOffsetX = 0;
        backgroundOffsetY = 0;
    }
    // Inside Snake class

    move() {
        const newHead = {
            x: this.segments[0].x + this.direction.x,
            y: this.segments[0].y + this.direction.y
        };
        this.segments.unshift(newHead);
        if (this.segments.length > this.segmentsToKeep) {
            this.segments.pop();
        }
        this.segmentsToKeep = this.segments.length;
        
        // --- KEY BACKGROUND UPDATE ---
        // Move the background offset by the opposite of the snake's movement.
         backgroundOffsetX -= this.direction.x;
    backgroundOffsetY -= this.direction.y;
    
    // Keep the offset within bounds to prevent large numbers (optional but good practice)
        if (Math.abs(backgroundOffsetX) >= SEG_SIZE) {
            backgroundOffsetX %= SEG_SIZE;
        }   
        if (Math.abs(backgroundOffsetY) >= SEG_SIZE) {
            backgroundOffsetY %= SEG_SIZE;
        }
    }
    extend() { this.segmentsToKeep = this.segments.length + 1; }
    setDirection(dir) {
        if (dir.x !== -this.direction.x || dir.y !== -this.direction.y) {
            this.direction = dir;
        }
    }
    draw() {
        this.segments.forEach((segment, index) => {
            // NOTE: We now draw relative to the canvas (0,0 is top-left)
            // The canvas coordinates must be adjusted to account for the background scroll.
            let canvasX = (segment.x + GAME_SIZE / 2) - backgroundOffsetX;
            let canvasY = (segment.y + GAME_SIZE / 2) - backgroundOffsetY;

            if (index > 0) {
                CTX.fillStyle = this.snakeColor;
                CTX.fillRect(canvasX, canvasY, SEG_SIZE, SEG_SIZE);
                CTX.strokeStyle = 'black';
                CTX.strokeRect(canvasX, canvasY, SEG_SIZE, SEG_SIZE);
            } else {
                // ... (Draw Head and Eye logic remains here, adjusted for canvasX/Y)
                CTX.fillStyle = this.snakeColor;
                CTX.fillRect(canvasX, canvasY, SEG_SIZE, SEG_SIZE);

                let eyeOffsetX = 0;
                let eyeOffsetY = 0;
                let eyeSeparationX = SEG_SIZE / 4;
                let eyeSeparationY = SEG_SIZE / 4;

                if (this.direction.x > 0) { eyeOffsetX = SEG_SIZE / 4; } 
                else if (this.direction.x < 0) { eyeOffsetX = -SEG_SIZE / 4; } 
                else if (this.direction.y < 0) { eyeOffsetY = -SEG_SIZE / 4; } 
                else if (this.direction.y > 0) { eyeOffsetY = SEG_SIZE / 4; }

                const drawEye = (dx, dy) => {
                    CTX.fillStyle = 'white';
                    CTX.beginPath();
                    CTX.arc(canvasX + SEG_SIZE / 2 + dx, canvasY + SEG_SIZE / 2 + dy, 3, 0, Math.PI * 2);
                    CTX.fill();

                    CTX.fillStyle = 'black';
                    CTX.beginPath();
                    CTX.arc(canvasX + SEG_SIZE / 2 + dx, canvasY + SEG_SIZE / 2 + dy, 1.5, 0, Math.PI * 2);
                    CTX.fill();
                };

                if (this.direction.x !== 0) {
                    drawEye(eyeOffsetX, -eyeSeparationY);
                    drawEye(eyeOffsetX, eyeSeparationY);
                } else { 
                    drawEye(-eyeSeparationX, eyeOffsetY);
                    drawEye(eyeSeparationX, eyeOffsetY);
                }
            }
        });
    }
}

class Food {
    constructor() { this.x = 0; this.y = 0; this.radius = 10; this.refresh(); }
    refresh() {
        const randCoord = () => {
            const numSegments = Math.floor(GAME_SIZE / SEG_SIZE) - 2;
            let r = Math.floor(Math.random() * numSegments) - (numSegments / 2);
            return r * SEG_SIZE;
        };
        this.x = randCoord();
        this.y = randCoord();
    }
    draw() {
        CTX.fillStyle = '#FF0000';
        CTX.beginPath();
        // Adjust food drawing based on background offset
        let centerX = this.x + SEG_SIZE / 2 + GAME_SIZE / 2 - backgroundOffsetX;
        let centerY = this.y + SEG_SIZE / 2 + GAME_SIZE / 2 - backgroundOffsetY;
        CTX.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
        CTX.fill();
    }
}

class Scoreboard {
    constructor() {
        this.score = 0; this.highScore = 0; this.loadHighScore();
    }
    loadHighScore() {
        const storedScore = localStorage.getItem('snakeHighScore');
        this.highScore = storedScore ? parseInt(storedScore) : 0;
    }
    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        }
    }
    increaseScore() { this.score += 1; }
    reset() { this.saveHighScore(); this.score = 0; }
    draw() {
        CTX.fillStyle = '#FFFFFF';
        CTX.font = '24px monospace';
        CTX.textAlign = 'center';
        CTX.fillText(`Score: ${this.score} High Score: ${this.highScore}`, GAME_SIZE / 2, 40);
    }
    gameOver() {
        this.saveHighScore();
        CTX.fillStyle = '#FFFFFF';
        CTX.font = '48px monospace';
        CTX.textAlign = 'center';
        CTX.fillText("GAME OVER", GAME_SIZE / 2, GAME_SIZE / 2);
        CTX.font = '24px monospace';
        CTX.fillText("Press an Arrow Key to Play Again", GAME_SIZE / 2, GAME_SIZE / 2 + 50);
    }
}

// // --- New Background Drawing Function ---
// function drawBackground() {
//     // Fill the entire canvas with the darker base color
//     CTX.fillStyle = TILE_COLOR_2;
//     CTX.fillRect(0, 0, GAME_SIZE, GAME_SIZE);

//     // Draw the checkerboard pattern (TILE_COLOR_1)
//     CTX.fillStyle = TILE_COLOR_1;
    
//     // The loop iterates over the tiles, factoring in the current offset
//     for (let x = 0; x < GAME_SIZE + SEG_SIZE; x += SEG_SIZE) {
//         for (let y = 0; y < GAME_SIZE + SEG_SIZE; y += SEG_SIZE) {
//             // Apply the background offsets
//             let drawX = x + backgroundOffsetX;
//             let drawY = y + backgroundOffsetY;

//             // Only draw the checkered tile if (x + y) is even
//             if (((Math.floor(drawX / SEG_SIZE) + Math.floor(drawY / SEG_SIZE)) % 2) === 0) {
//                 // Adjust position to handle wrapping/repeating when scrolling
//                 drawX = ((drawX % SEG_SIZE) + SEG_SIZE) % SEG_SIZE;
//                 drawY = ((drawY % SEG_SIZE) + SEG_SIZE) % SEG_SIZE;

//                 CTX.fillRect(x - drawX, y - drawY, SEG_SIZE, SEG_SIZE);
//             }
//         }
//     }
// }
// --- Corrected Background Drawing Function ---
function drawBackground() {
    // 1. Fill the entire canvas with the darker base color
    CTX.fillStyle = TILE_COLOR_2;
    CTX.fillRect(0, 0, GAME_SIZE, GAME_SIZE);

    // 2. Draw the checkered pattern (TILE_COLOR_1)
    CTX.fillStyle = TILE_COLOR_1;

    // Calculate the start position of the tile drawing based on the offset.
    // The offset must be confined to the tile size (SEG_SIZE) for wrapping.
    const startX = (backgroundOffsetX % SEG_SIZE);
    const startY = (backgroundOffsetY % SEG_SIZE);
    
    // Iterate from slightly before the start to cover the full canvas area
    for (let x = -SEG_SIZE; x < GAME_SIZE + SEG_SIZE; x += SEG_SIZE) {
        for (let y = -SEG_SIZE; y < GAME_SIZE + SEG_SIZE; y += SEG_SIZE) {

            // Calculate the actual drawing position by applying the offset.
            // When the snake moves right (positive X), the background moves left (negative X).
            const drawX = x - startX;
            const drawY = y - startY;

            // Checkerboard pattern logic: (x/SEG_SIZE + y/SEG_SIZE) % 2 === 0
            // We use the full, un-offset 'x' and 'y' to determine the tile color, 
            // but use 'drawX' and 'drawY' for its position.
            if (((Math.floor(x / SEG_SIZE) + Math.floor(y / SEG_SIZE)) % 2) === 0) {
                CTX.fillRect(drawX, drawY, SEG_SIZE, SEG_SIZE);
            }
        }
    }
}


// --- Game Initialization and Loop (UPDATED) ---
let snake;
const food = new Food();
const score = new Scoreboard();
let gameIsOn = false;
let lastTime = 0;
const moveInterval = 100;

function gameLoop(currentTime) {
    if (!gameIsOn) {
        // Draw the background once before Game Over text is shown
        drawBackground(); 
        score.gameOver();
        return;
    }
    
    const deltaTime = currentTime - lastTime;
    if (deltaTime >= moveInterval) {
        lastTime = currentTime;
        
        // 1. Draw the scrolling background first
        drawBackground(); 

        // 2. Game logic (move, collision checks)
        snake.move();

        const head = snake.segments[0];
        if (head.x === food.x && head.y === food.y) {
            food.refresh();
            snake.extend();
            score.increaseScore();
        }

        if (head.x > MAX_COORD || head.x < -MAX_COORD || head.y > MAX_COORD || head.y < -MAX_COORD) {
            gameIsOn = false;
        }
        for (let i = 1; i < snake.segments.length; i++) {
            const segment = snake.segments[i];
            if (head.x === segment.x && head.y === segment.y) {
                gameIsOn = false;
                break;
            }
        }
    }

    // 3. Draw snake and food (which are now drawn relative to the scrolled background)
    food.draw();
    snake.draw();
    score.draw();

    requestAnimationFrame(gameLoop);
}

// --- Menu and Event Listeners ---

COLOR_OPTIONS.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.checked) {
            SNAKE_COLOR = e.target.value;
        }
    });
});

START_BUTTON.addEventListener('click', () => {
    START_MENU.style.display = 'none';
    
    snake = new Snake(SNAKE_COLOR);
    
    gameIsOn = true;
    requestAnimationFrame(gameLoop);
});


document.addEventListener('keydown', (e) => {
    const key = e.key;

    if (!gameIsOn) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) && snake) {
            SNAKE_COLOR = document.querySelector('input[name="snake_color"]:checked').value; 
            
            snake.reset();
            snake.snakeColor = SNAKE_COLOR;
            food.refresh();
            score.reset();
            gameIsOn = true;
            requestAnimationFrame(gameLoop);
        }
        return;
    }

    let newDirection = null;

    switch (key) {
        case 'ArrowUp': newDirection = { x: 0, y: -SEG_SIZE }; break;
        case 'ArrowDown': newDirection = { x: 0, y: SEG_SIZE }; break;
        case 'ArrowLeft': newDirection = { x: -SEG_SIZE, y: 0 }; break;
        case 'ArrowRight': newDirection = { x: SEG_SIZE, y: 0 }; break;
    }

    if (newDirection) {
        snake.setDirection(newDirection);
    }
});

// Initial draw to show the canvas and menu
drawBackground();
score.draw();
food.draw();