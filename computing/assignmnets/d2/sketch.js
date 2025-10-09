function setup() {
  createCanvas(400, 400);
  background(200); // grey background
  rectMode(CENTER);
  noStroke();
  
  let centerX = width / 2;
  let centerY = height / 2;
  
  // Draw rectangles (sparks)
  for (let i = 0; i < 12; i++) {
    let len = random(50, 120);
    let w = random(5, 15);
    let angle = random(TWO_PI);
    fill(random(200, 255), random(100, 150), 0, random(150, 255)); // yellow to orange with alpha
    push();
    translate(centerX, centerY);
    rotate(angle);
    rect(0, 0, len, w);
    pop();
  }
  
  // Draw circles (spark particles)
  for (let i = 0; i < 10; i++) {
    let r = random(5, 25);
    fill(255, random(150, 200), 0, random(100, 255)); // bright yellow-orange
    ellipse(centerX + random(-50, 50), centerY + random(-50, 50), r, r);
  }}