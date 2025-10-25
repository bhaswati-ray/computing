class Ball {
  constructor() {
    this.radius = 12;
    this.ballColor = color(255);
    // 25% slower than 6 is 6 * 0.75 = 4.5
    this.baseSpeed = 4.5; 
    this.reset();
  }

  reset() {
    this.pos = createVector(width / 2, height / 2);
    let angle = random(-PI / 4, PI / 4);
    this.vel = p5.Vector.fromAngle(angle, this.baseSpeed);
    if (random(1) < 0.5) {
      this.vel.x *= -1;
    }
  }

  stop() {
    this.vel = createVector(0, 0);
  }

  update() {
    this.pos.add(this.vel);
    if (this.pos.y - this.radius < 0 || this.pos.y + this.radius > height) {
      this.vel.y *= -1;
      this.pos.y = constrain(this.pos.y, this.radius, height - this.radius);
    }
  }

  show() {
    noStroke();
    fill(this.ballColor);
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }

  isClicked(mx, my) {
    return dist(mx, my, this.pos.x, this.pos.y) < this.radius;
  }

  checkScore() {
    if (this.pos.x - this.radius < 0) {
      scoreB++;
      clearLinesAndReset(); // This is in sketch.js
    } else if (this.pos.x + this.radius > width) {
      scoreA++;
      clearLinesAndReset(); // This is in sketch.js
    }
  }

  checkPaddleHit(paddle) {
    let hit = false;
    if (paddle.x < width / 2) { // Left paddle
      hit = this.pos.x - this.radius < paddle.x + paddle.w &&
            this.pos.x - this.radius > paddle.x &&
            this.pos.y > paddle.y &&
            this.pos.y < paddle.y + paddle.h;
    } else { // Right paddle
      hit = this.pos.x + this.radius > paddle.x &&
            this.pos.x + this.radius < paddle.x + paddle.w &&
            this.pos.y > paddle.y &&
            this.pos.y < paddle.y + paddle.h;
    }

    if (hit) {
      this.vel.x *= -1;
      if (this.pos.x < width / 2) {
        this.pos.x = paddle.x + paddle.w + this.radius;
      } else {
        this.pos.x = paddle.x - this.radius;
      }
      this.vel.mult(1.03); // Increase speed slightly on hit
      this.ballColor = paddle.col;

      let currentHitPos = this.pos.copy();
      if (lastHitPos) {
        let newLine = new LineSegment(lastHitPos, currentHitPos, this.ballColor);
        for (let i = 0; i < lineSegments.length - 1; i++) {
          let oldLine = lineSegments[i];
          let pt = lineIntersect(
            newLine.start.x, newLine.start.y, newLine.end.x, newLine.end.y,
            oldLine.start.x, oldLine.start.y, oldLine.end.x, oldLine.end.y
          );
          if (pt) {
            intersections.push(pt);
          }
        }
        lineSegments.push(newLine);
      }
      lastHitPos = currentHitPos;
    }
  }
}