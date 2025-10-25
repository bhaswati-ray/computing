// --- Global Variables ---
let paddleA;
let paddleB;
let ball;

let lineSegments = [];
let intersections = [];
let lastHitPos = null;
let retraceTarget = null; // For the retrace animation

let scoreA = 0;
let scoreB = 0;

// 'playing', 'untangling', 'retracing', 'gameOver', 'win'
let gameState = "playing"; 
let loseReason = "";

let colorWhite, colorBlack, colorRed, colorGrey;

// --- p5.js Setup Function ---
function setup() {
  createCanvas(800, 500);
  colorWhite = color(255);
  colorBlack = color(0);
  colorRed = color(255, 0, 0);
  colorGrey = color(200); // Base grey background color

  resetGame();
}

// --- p5.js Draw Function ---
function draw() {
  // 1. Set background (starts grey, turns red)
  updateBackground();

  // 2. Draw all lines and intersections
  drawLines();

  // 3. Draw paddles
  if (paddleA && paddleB) {
    paddleA.show();
    paddleB.show();
  }

  // 4. Draw ball
  if (ball) {
    ball.show();
  }

  // 5. Handle game state logic
  if (gameState === "playing") {
    paddleA.update();
    paddleB.update();
    ball.update();
    ball.checkPaddleHit(paddleA);
    ball.checkPaddleHit(paddleB);
    ball.checkScore();
    checkLoseConditions();
    drawUI();
  } else if (gameState === "untangling") {
    drawUI();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Game Paused: Click the ball to untangle!", width / 2, 40);
    text("Lines left: " + lineSegments.length, width / 2, 80);
    
  } else if (gameState === "retracing") {
    // --- NEW STATE for retrace animation ---
    ball.update(); // Move the ball
    
    // Check if we've reached the target
    let d = p5.Vector.dist(ball.pos, retraceTarget);
    let retraceSpeed = ball.baseSpeed * 2; // Move faster when retracing

    // If we are close enough (or overshot), stop.
    if (d < retraceSpeed) {
      ball.pos = retraceTarget.copy(); // Snap to target
      ball.stop();
      
      // Now we can safely remove the line
      lineSegments.pop();
      recalculateIntersections();
      
      // Check for win
      if (lineSegments.length === 0) {
        gameState = "win";
      } else {
        // Go back to waiting for the next click
        gameState = "untangling";
      }
      retraceTarget = null; // Clear the target
    }
    
    // Draw UI during retrace
    drawUI();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Retracing path...", width / 2, 40);
    text("Lines left: " + lineSegments.length, width / 2, 80);
    
  } else if (gameState === "gameOver") {
    drawMessage("Game Over", loseReason, "Click to restart");
  } else if (gameState === "win") {
    drawMessage("You Win!", "You untangled the mess!", "Click to restart");
  }
}

// --- Mouse Click Handler ---
function mousePressed() {
  if (gameState === "playing") {
    if (ball.isClicked(mouseX, mouseY)) {
      gameState = "untangling";
      ball.stop();
    }
  } else if (gameState === "untangling") {
    // --- UPDATED UNTANGLE LOGIC ---
    if (ball.isClicked(mouseX, mouseY)) {
      if (lineSegments.length > 0) {
        let lastLine = lineSegments[lineSegments.length - 1];
        
        // The ball is at lastLine.end. We need to go to lastLine.start.
        retraceTarget = lastLine.start.copy();
        
        // Set the ball's velocity to move towards the target
        let direction = p5.Vector.sub(retraceTarget, ball.pos);
        let retraceSpeed = ball.baseSpeed * 2; // Use a faster speed for retrace
        direction.setMag(retraceSpeed);
        ball.vel = direction;
        
        gameState = "retracing"; // Start the animation
      }
    }
  } else if (gameState === "gameOver" || gameState === "win") {
    resetGame();
  }
}

// --- Helper Functions ---

function updateBackground() {
  let lerpAmount = map(intersections.length, 0, 20, 0, 1);
  let bgColor = lerpColor(colorGrey, colorRed, lerpAmount);
  background(bgColor);
}

function drawLines() {
  for (let seg of lineSegments) {
    seg.show();
  }
  noStroke();
  fill(255, 0, 0, 200); // Semi-transparent red for intersections
  for (let pt of intersections) {
    ellipse(pt.x, pt.y, 10, 10);
  }
}

function drawUI() {
  fill(0);
  noStroke();
  textSize(48);
  textAlign(CENTER);
  text(scoreA, width / 4, 60);
  text(scoreB, (width * 3) / 4, 60);

  textSize(18);
  textAlign(LEFT, TOP);
  fill(0, 150);
  text("Intersections: " + intersections.length + " / 20", 20, 20);

  if (intersections.length >= 15 && gameState === "playing") {
    fill(0);
    textAlign(CENTER, TOP);
    textSize(32);
    text("UNTANGLE VIOLENCE", width / 2, 20);
  }
}

function drawMessage(title, subtitle, prompt) {
  fill(0, 0, 0, 180);
  noStroke();
  rect(width / 2 - 250, height / 2 - 100, 500, 200, 10);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(52);
  text(title, width / 2, height / 2 - 40);
  textSize(22);
  text(subtitle, width / 2, height / 2 + 15);
  textSize(16);
  fill(200);
  text(prompt, width / 2, height / 2 + 60);
}

function checkLoseConditions() {
  if (intersections.length >= 20) {
    gameState = "gameOver";
    loseReason = "Full Red! Too many intersections!";
  }
}

// This only resets the ball, not the lines (per your request)
function clearLinesAndReset() {
  lastHitPos = null;
  ball.reset(); 
}

// This function FULLY resets the game (on Game Over or Win)
function resetGame() {
  paddleA = new Paddle(20, height / 2 - 50, colorWhite, "wasd");
  paddleB = new Paddle(width - 40, height / 2 - 50, colorBlack, "arrows");
  ball = new Ball();
  
  lineSegments = [];
  intersections = [];
  lastHitPos = null;
  retraceTarget = null;
  scoreA = 0;
  scoreB = 0;
  gameState = "playing";
  loseReason = "";
}

function recalculateIntersections() {
  intersections = [];
  for (let i = 0; i < lineSegments.length - 1; i++) {
    for (let j = i + 1; j < lineSegments.length; j++) {
      let seg1 = lineSegments[i];
      let seg2 = lineSegments[j];
      let pt = lineIntersect(
        seg1.start.x, seg1.start.y, seg1.end.x, seg1.end.y,
        seg2.start.x, seg2.start.y, seg2.end.x, seg2.end.y
      );
      if (pt) {
        intersections.push(pt);
      }
    }
  }
}