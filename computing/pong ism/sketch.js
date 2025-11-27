// ==========================================
// RACISM - pong's take
// Increased vertical spacing between title/subtitle and instructional text.
// ==========================================

let paddleA, paddleB, ball;
let lineSegments = [];
let intersections = [];
let lastHitPos = null;
let retraceTarget = null;

let scoreA = 0;
let scoreB = 0;

let gameState = "start"; // 'start','playing','untangling','retracing','gameOver','win'
let loseReason = "";

let startButton;
let canvasElem;
let showUntangleOverlay = false;

// Play area
const PLAY_MARGIN = 80;
let playX, playY, playW, playH;

// Tunables
const retraceMaxSelectDist = 90;
const retraceDiagonalSpeedMultiplier = 2.0;
const untangleMoveSpeed = 6;
const INTERSECTION_LIMIT = 20;
const LOSE_SCORE = -10; // lose threshold

// Colors & fonts
let bgGray, bgRed, whiteCol, blackCol, winGreen, loseRed;

function setup() {
  canvasElem = createCanvas(windowWidth, windowHeight);
  canvasElem.elt.tabIndex = 0;
  canvasElem.elt.style.outline = "none";
  canvasElem.elt.focus();

  textFont('Georgia, serif');
  textAlign(CENTER, CENTER);

  bgGray = color(190); // mid gray
  bgRed = color(200, 40, 40);
  whiteCol = color(255);
  blackCol = color(20);
  winGreen = color(40, 160, 60);
  loseRed = color(200, 40, 40);

  computePlayArea();

  // create button (styling only) - position set in start/end screens
  startButton = createButton('PLAY');
  styleStartButton();
  startButton.mousePressed(() => {
    resetGame();
    gameState = "playing";
    startButton.hide();
  });

  resetGame(true);
  gameState = "start";
}

function computePlayArea() {
  playX = PLAY_MARGIN;
  playY = PLAY_MARGIN;
  playW = max(600, width - PLAY_MARGIN * 2);
  playH = max(360, height - PLAY_MARGIN * 2);
}

function styleStartButton() {
  if (!startButton) return;
  startButton.style('font-family', 'Georgia, serif');
  startButton.style('font-size', '16px');
  startButton.style('padding', '12px 24px');
  startButton.style('background-color', '#ffffff');
  startButton.style('color', '#000000');
  startButton.style('border', 'none'); // no stroke
  startButton.style('border-radius', '12px'); // only button rounded
  startButton.size(200, 54);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  computePlayArea();
  styleStartButton();
  if (paddleA) {
    paddleA.x = playX + 12;
    paddleA.y = constrain(paddleA.y, playY, playY + playH - paddleA.h);
  }
  if (paddleB) {
    paddleB.x = playX + playW - 12 - paddleB.w;
    paddleB.y = constrain(paddleB.y, playY, playY + playH - paddleB.h);
  }
  if (ball) ball.pos = createVector(playX + playW / 2, playY + playH / 2);
}

// ----------------- Classes -----------------

class Paddle {
  constructor(x, y, w, h, col, controls) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.col = col; this.controls = controls; this.speed = 8;
  }
  update() {
    if (this.controls === 'wasd') {
      if (keyIsDown(87)) this.y -= this.speed;
      if (keyIsDown(83)) this.y += this.speed;
    } else {
      if (keyIsDown(UP_ARROW)) this.y -= this.speed;
      if (keyIsDown(DOWN_ARROW)) this.y += this.speed;
    }
    this.y = constrain(this.y, playY, playY + playH - this.h);
  }
  show() {
    noStroke();
    fill(this.col);
    rect(this.x, this.y, this.w, this.h);
  }
}

class Ball {
  constructor() {
    this.radius = 12;
    this.ballColor = color(0);
    this.baseSpeed = 7.0;
    this.reset();
  }
  reset() {
    this.pos = createVector(playX + playW / 2, playY + playH / 2);
    let angle = random(-PI / 4, PI / 4);
    this.vel = p5.Vector.fromAngle(angle, this.baseSpeed);
    if (random(1) < 0.5) this.vel.x *= -1;
    this.ballColor = blackCol;
  }
  stop() { this.vel = createVector(0, 0); }
  update() {
    this.pos.add(this.vel);
    if (this.pos.y - this.radius < playY || this.pos.y + this.radius > playY + playH) {
      this.vel.y *= -1;
      this.pos.y = constrain(this.pos.y, playY + this.radius, playY + playH - this.radius);
    }
    if (this.pos.x < playX - 120 || this.pos.x > playX + playW + 120) {
      clearLinesAndReset();
    }
  }
  show() {
    noStroke();
    fill(this.ballColor);
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }
  checkPaddleHit(paddle) {
    let hit = false;
    if (paddle.x < playX + playW / 2) {
      hit = (this.pos.x - this.radius < paddle.x + paddle.w) &&
            (this.pos.x - this.radius > paddle.x) &&
            (this.pos.y > paddle.y) &&
            (this.pos.y < paddle.y + paddle.h);
    } else {
      hit = (this.pos.x + this.radius > paddle.x) &&
            (this.pos.x + this.radius < paddle.x + paddle.w) &&
            (this.pos.y > paddle.y) &&
            (this.pos.y < paddle.y + paddle.h);
    }
    if (hit) {
      this.vel.x *= -1;
      if (this.pos.x < playX + playW / 2) this.pos.x = paddle.x + paddle.w + this.radius;
      else this.pos.x = paddle.x - this.radius;
      this.vel.mult(1.03);
      this.ballColor = paddle.col;
      if (paddle.x < playX + playW / 2) scoreA--; else scoreB--;
      let currentHitPos = this.pos.copy();
      if (lastHitPos) {
        let newLine = new LineSegment(lastHitPos, currentHitPos, this.ballColor);
        for (let i = 0; i < lineSegments.length - 1; i++) {
          let oldLine = lineSegments[i];
          let pt = lineIntersect(
            newLine.start.x, newLine.start.y, newLine.end.x, newLine.end.y,
            oldLine.start.x, oldLine.start.y, oldLine.end.x, oldLine.end.y
          );
          if (pt) intersections.push(pt);
        }
        lineSegments.push(newLine);
      }
      lastHitPos = currentHitPos;
    }
  }
}

class LineSegment {
  constructor(startPos, endPos, c) {
    this.start = startPos.copy();
    this.end = endPos.copy();
    this.lineColor = color(red(c), green(c), blue(c), 200);
  }
  show() {
    stroke(this.lineColor);
    strokeWeight(3);
    line(this.start.x, this.start.y, this.end.x, this.end.y);
    noStroke();
  }
}

// ----------------- Main -----------------

function draw() {
  let t = constrain(intersections.length / INTERSECTION_LIMIT, 0, 1);
  let bg = lerpColor(bgGray, bgRed, t);
  background(bg);

  noFill();
  stroke(0);
  strokeWeight(4);
  rect(playX, playY, playW, playH);
  noStroke();

  drawLines();
  if (paddleA && paddleB) { paddleA.show(); paddleB.show(); }
  if (ball) ball.show();

  push();
  fill(0);
  textAlign(CENTER, TOP);
  textSize(20);
  text('RACISM', width / 2, 8);
  textStyle(ITALIC);
  textSize(18);
  text("pong's take", width / 2, 32);
  textStyle(NORMAL);
  pop();

  push();
  textFont('Georgia, serif');
  textSize(48);
  fill(0);
  textAlign(CENTER, TOP);
  text(scoreA, playX + playW * 0.25, playY - 50);
  text(scoreB, playX + playW * 0.75, playY - 50);
  pop();

  let warnOpacity = map(intersections.length, 0, INTERSECTION_LIMIT, 0, 255);
  warnOpacity = constrain(warnOpacity, 0, 255);
  if (intersections.length > 0) {
    push();
    textAlign(CENTER, TOP);
    textSize(16);
    fill(0, 0, 0, warnOpacity);
    textStyle(ITALIC);
    text("Think about your actions — retrace!", playX + playW / 2, playY + playH + 12);
    textStyle(NORMAL);
    pop();
  }

  if (gameState === 'start') {
    drawStartScreen();
    return;
  }
  if (gameState === 'playing') {
    if (startButton) startButton.hide();
    paddleA.update();
    paddleB.update();
    ball.update();
    ball.checkPaddleHit(paddleA);
    ball.checkPaddleHit(paddleB);
    checkLoseConditions();
    return;
  }
  if (gameState === 'untangling') {
    if (showUntangleOverlay) {
      push();
      fill(0, 100);
      rect(playX, playY, playW, playH);
      pop();
    }
    handleUntangleBallMovement();
    let nearest = getNearestLineSegment(ball.pos, retraceMaxSelectDist);
    if (nearest) {
      stroke(255, 230, 50);
      strokeWeight(3);
      let ln = nearest.line;
      line(ln.start.x, ln.start.y, ln.end.x, ln.end.y);
      noStroke();
      fill(255, 230, 50, 200);
      ellipse(nearest.closest.x, nearest.closest.y, 12, 12);
      fill(0);
      textSize(12);
      textAlign(LEFT, TOP);
      text("Press D or Q to retrace", nearest.closest.x + 12, nearest.closest.y - 10);
    }
    if (showUntangleOverlay) {
      push();
      textAlign(CENTER, CENTER);
      fill(255);
      noStroke();
      rectMode(CENTER);
      let boxW = min(playW - 80, 820);
      rect(playX + playW / 2, playY + playH / 2, boxW, 140);
      fill(0);
      textSize(20);
      text("GAMESTATE 2 — RETRACE MODE", playX + playW / 2, playY + playH / 2 - 30);
      textSize(14);
      text("Move the BALL with W / A / S / D.", playX + playW / 2, playY + playH / 2);
      text("Press D to trace left-bottom → top-right. Press Q for opposite diagonal.", playX + playW / 2, playY + playH / 2 + 24);
      pop();
    }
    return;
  }
  if (gameState === 'retracing') {
    if (retraceTarget) {
      let stepVec = p5.Vector.sub(retraceTarget, ball.pos);
      let retraceSpeed = ball.baseSpeed * retraceDiagonalSpeedMultiplier;
      if (stepVec.mag() <= retraceSpeed) {
        ball.pos = retraceTarget.copy();
        ball.stop();
        if (lineSegments.length > 0) lineSegments.pop();
        recalculateIntersections();
        retraceTarget = null;
        showUntangleOverlay = false;
        gameState = (lineSegments.length === 0) ? 'win' : 'untangling';
      } else {
        let move = stepVec.copy().setMag(retraceSpeed);
        ball.vel = move;
        ball.update();
      }
    } else {
      ball.stop();
      gameState = 'untangling';
    }
    return;
  }
  if (gameState === 'gameOver') { drawEndScreen(false); return; }
  if (gameState === 'win') { drawEndScreen(true); return; }
}

// ----------------- Input handlers -----------------

function keyPressed() {
  if (gameState === 'start') {
    resetGame();
    if (startButton) startButton.hide();
    gameState = 'playing';
    return false;
  }
  if ((key === ' ' || keyCode === 32) && gameState === 'playing') {
    gameState = 'untangling';
    if (ball) ball.stop();
    showUntangleOverlay = true;
    return false;
  }
  if (gameState === 'untangling') {
    if (key === 'd' || key === 'D') { showUntangleOverlay = false; attemptDiagonalRetrace(true); return false; }
    if (key === 'q' || key === 'Q') { showUntangleOverlay = false; attemptDiagonalRetrace(false); return false; }
  }
  if (gameState === 'gameOver' || gameState === 'win') {
    resetGame();
    if (startButton) startButton.hide();
    gameState = 'playing';
    return false;
  }
  return true;
}
function keyReleased() {}

// ----------------- Helpers / UI -----------------

function drawStartScreen() {
  push();
  fill(0); noStroke(); rectMode(CORNER); rect(0, 0, width, height);
  fill(255); textAlign(CENTER, CENTER); textFont('Georgia, serif');

  // move stack slightly up
  let centerY = height / 2 - 80;

  // Game name
  textSize(44); text('RACISM', width / 2, centerY - 36);

  // subtitle (lowercase italic)
  textStyle(ITALIC); textSize(26); text("pong's take", width / 2, centerY - 4);
  textStyle(NORMAL);

  // instructions (two lines) — increased space below tagline
  textStyle(ITALIC); textSize(14);
  // instrY moved further down to create more space between title/subtitle and instructions
  let instrY = centerY + 56; // <-- increased gap here
  text("Press any key or click PLAY to begin.", width / 2, instrY);
  text("Press SPACE once during Pong to enter retrace mode.", width / 2, instrY + 22);
  textStyle(NORMAL);

  // Larger gap before button
  let bx = width / 2 - (startButton.width || 100) / 2;
  let by = instrY + 100; // button moved further down to keep clear spacing
  startButton.position(bx, by);
  startButton.show();

  pop();
}

function drawEndScreen(isWin) {
  push();
  fill(0); noStroke(); rectMode(CORNER); rect(0, 0, width, height);
  fill(255); textAlign(CENTER, CENTER); textFont('Georgia, serif');

  let centerY = height / 2 - 80;

  if (isWin) {
    fill(winGreen); textSize(44); text("YOU WIN", width / 2, centerY - 36);
    fill(255); textStyle(ITALIC); textSize(16);
    // move instructions further down for extra spacing
    let instrY = centerY + 56; // <-- increased gap here
    text("As a society you rethought the history of your actions", width / 2, instrY);
    text("and began to play with greater humanity.", width / 2, instrY + 24);
    textStyle(NORMAL);

    // button below
    if (!startButton) {
      startButton = createButton('PLAY AGAIN');
      styleStartButton();
      startButton.mousePressed(() => {
        resetGame();
        gameState = 'playing';
        startButton.hide();
      });
    }
    let bx = width / 2 - (startButton.width || 100) / 2;
    let by = instrY + 110;
    startButton.position(bx, by);
    startButton.show();

  } else {
    fill(loseRed); textSize(44); text("YOU LOSE", width / 2, centerY - 36);
    fill(255); textStyle(ITALIC); textSize(16);
    let instrY = centerY + 56; // <-- increased gap here
    text("This outcome reflects a societal failure to confront and", width / 2, instrY);
    text("change harmful systems — a call to reconsider.", width / 2, instrY + 24);
    textStyle(NORMAL);

    if (!startButton) {
      startButton = createButton('PLAY AGAIN');
      styleStartButton();
      startButton.mousePressed(() => {
        resetGame();
        gameState = 'playing';
        startButton.hide();
      });
    }
    let bx = width / 2 - (startButton.width || 100) / 2;
    let by = instrY + 110;
    startButton.position(bx, by);
    startButton.show();
  }

  pop();
}

function drawLines() {
  for (let seg of lineSegments) seg.show();
  noStroke();
  fill(255, 40, 40, 220);
  for (let pt of intersections) ellipse(pt.x, pt.y, 8, 8);
}

function clearLinesAndReset() {
  lastHitPos = null;
  if (ball) ball.reset();
}

function resetGame(initOnly) {
  const pw = 20, ph = 110;
  paddleA = new Paddle(playX + 12, playY + playH / 2 - ph / 2, pw, ph, whiteCol, 'wasd');
  paddleB = new Paddle(playX + playW - 12 - pw, playY + playH / 2 - ph / 2, pw, ph, blackCol, 'arrows');
  ball = new Ball();

  lineSegments = [];
  intersections = [];
  lastHitPos = null;
  retraceTarget = null;
  scoreA = 0;
  scoreB = 0;
  loseReason = "";
  showUntangleOverlay = false;

  if (!initOnly) {
    if (startButton) startButton.hide();
    gameState = 'playing';
  } else {
    if (startButton) startButton.show();
  }
}

function checkLoseConditions() {
  if (min(scoreA, scoreB) <= LOSE_SCORE) {
    gameState = 'gameOver';
    loseReason = "Score reached " + LOSE_SCORE;
  }
}

function recalculateIntersections() {
  intersections = [];
  for (let i = 0; i < lineSegments.length - 1; i++) {
    for (let j = i + 1; j < lineSegments.length; j++) {
      let seg1 = lineSegments[i], seg2 = lineSegments[j];
      let pt = lineIntersect(seg1.start.x, seg1.start.y, seg1.end.x, seg1.end.y,
                             seg2.start.x, seg2.start.y, seg2.end.x, seg2.end.y);
      if (pt) intersections.push(pt);
    }
  }
}

function handleUntangleBallMovement() {
  let mv = createVector(0, 0);
  let moved = false;
  if (keyIsDown(87)) { mv.y -= untangleMoveSpeed; moved = true; }
  if (keyIsDown(83)) { mv.y += untangleMoveSpeed; moved = true; }
  if (keyIsDown(65)) { mv.x -= untangleMoveSpeed; moved = true; }
  if (keyIsDown(68)) { mv.x += untangleMoveSpeed; moved = true; }

  if (mv.mag() > 0) {
    ball.pos.add(mv);
    ball.pos.x = constrain(ball.pos.x, playX + ball.radius, playX + playW - ball.radius);
    ball.pos.y = constrain(ball.pos.y, playY + ball.radius, playY + playH - ball.radius);
    if (showUntangleOverlay && moved) showUntangleOverlay = false;
  }
}

function attemptDiagonalRetrace(dirBT) {
  let nearest = getNearestLineSegment(ball.pos, retraceMaxSelectDist);
  if (!nearest) return;
  let ln = nearest.line;
  let p1 = ln.start.copy(), p2 = ln.end.copy();

  let leftBottom, topRight;
  if (p1.x < p2.x && p1.y > p2.y) { leftBottom = p1; topRight = p2; }
  else if (p2.x < p1.x && p2.y > p1.y) { leftBottom = p2; topRight = p1; }
  else {
    if (p1.x <= p2.x) { leftBottom = (p1.y >= p2.y) ? p1 : p2; topRight = (leftBottom === p1) ? p2 : p1; }
    else { leftBottom = (p2.y >= p1.y) ? p2 : p1; topRight = (leftBottom === p2) ? p1 : p2; }
  }

  let chosenStart = dirBT ? leftBottom.copy() : topRight.copy();
  let chosenTarget = dirBT ? topRight.copy() : leftBottom.copy();

  let a = ln.start.copy(), b = ln.end.copy();
  let ab = p5.Vector.sub(b, a), ap = p5.Vector.sub(ball.pos, a);
  let ab2 = ab.x * ab.x + ab.y * ab.y;
  let t = (ab2 === 0) ? 0 : (ap.x * ab.x + ap.y * ab.y) / ab2;
  t = constrain(t, 0, 1);
  let closest = createVector(a.x + ab.x * t, a.y + ab.y * t);

  let dToLine = p5.Vector.dist(ball.pos, closest);
  let dToStart = p5.Vector.dist(ball.pos, chosenStart);
  if (dToLine > retraceMaxSelectDist && dToStart > retraceMaxSelectDist) return;

  ball.pos = closest.copy();
  ball.stop();
  retraceTarget = chosenTarget.copy();
  showUntangleOverlay = false;
  gameState = 'retracing';
}

function distToSegment(p, a, b) {
  let ap = p.copy().sub(a);
  let ab = b.copy().sub(a);
  let ab2 = ab.x * ab.x + ab.y * ab.y;
  if (ab2 === 0) return p5.Vector.dist(p, a);
  let dot = ap.x * ab.x + ap.y * ab.y;
  let t = dot / ab2; t = constrain(t, 0, 1);
  let closest = createVector(a.x + ab.x * t, a.y + ab.y * t);
  return p5.Vector.dist(p, closest);
}

function getNearestLineSegment(pt, maxDist) {
  let best = null; let bestDist = maxDist;
  for (let i = 0; i < lineSegments.length; i++) {
    let ln = lineSegments[i], a = ln.start, b = ln.end;
    let d = distToSegment(pt, a, b);
    if (d <= bestDist) {
      let ab = p5.Vector.sub(b, a), ap = p5.Vector.sub(pt, a);
      let ab2 = ab.x * ab.x + ab.y * ab.y;
      let t = (ab2 === 0) ? 0 : (ap.x * ab.x + ap.y * ab.y) / ab2;
      t = constrain(t, 0, 1);
      let closest = createVector(a.x + ab.x * t, a.y + ab.y * t);
      best = { index: i, line: ln, distance: d, closest: closest };
      bestDist = d;
    }
  }
  return best;
}

function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  let den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (den === 0) return null;
  let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
  if (t > 0 && t < 1 && u > 0 && u < 1) {
    return createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  }
  return null;
}
