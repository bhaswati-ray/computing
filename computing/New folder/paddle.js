class Paddle {
  constructor(x, y, col, controls) {
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 100;
    this.col = col;
    this.controls = controls;
    this.speed = 8;
  }

  update() {
    if (this.controls === "wasd") {
      if (keyIsDown(87)) { // W
        this.y -= this.speed;
      } else if (keyIsDown(83)) { // S
        this.y += this.speed;
      }
    } else {
      if (keyIsDown(UP_ARROW)) {
        this.y -= this.speed;
      } else if (keyIsDown(DOWN_ARROW)) {
        this.y += this.speed;
      }
    }
    this.y = constrain(this.y, 0, height - this.h);
  }

  show() {
    // If the paddle is white, add a black border to see it
    if (this.col.levels[0] === 255 && this.col.levels[1] === 255 && this.col.levels[2] === 255) {
      stroke(0);
      strokeWeight(2);
    } else {
      noStroke();
    }
    fill(this.col);
    rect(this.x, this.y, this.w, this.h, 5);
  }
}