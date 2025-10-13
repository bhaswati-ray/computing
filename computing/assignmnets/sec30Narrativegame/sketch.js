// Arrays to hold the particles for each animation
let flowers = [];
let rainDrops = [];

// Spectacle lens properties
let rightButtonX, leftButtonX, buttonY, buttonRadius = 70;

function setup() {
  createCanvas(800, 500);

  // Position the spectacle lenses
  let bridgeWidth = 30;
  leftButtonX = width / 2 - buttonRadius - bridgeWidth / 2;
  rightButtonX = width / 2 + buttonRadius + bridgeWidth / 2;
  buttonY = height / 2;

  // Create the rain drop particles
  for (let i = 0; i < 50; i++) {
    rainDrops.push({
      x: random(width),
      y: random(-200, 0),
      w: 2,
      h: 15,
      speed: random(4, 8)
    });
  }

  // Create the flower particles
  for (let i = 0; i < 20; i++) {
    flowers.push({
      x: random(width),
      y: random(height),
      petalSize: random(15, 30), // Base size for the flower
      alpha: random(150, 255), // Random alpha for petals
      speed: random(0.5, 2)
    });
  }
}

function draw() {
  // --- Set Background ---
  let dLeft = dist(mouseX, mouseY, leftButtonX, buttonY);
  let isRaining = mouseIsPressed && dLeft < buttonRadius;
  background(isRaining ? color(20, 20, 30) : color(50, 50, 70));

  // --- Draw Static Elements ---
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);
  text("life lens", width / 2, height / 2 - 150);

  strokeWeight(4);
  noFill();
  stroke(255, 180);
  ellipse(leftButtonX, buttonY, buttonRadius * 2);
  ellipse(rightButtonX, buttonY, buttonRadius * 2);
  arc(width / 2, buttonY - 5, 60, 40, PI, TWO_PI);

  // --- Animate and Draw Rain ---
  if (isRaining) {
    for (let rd of rainDrops) {
      noStroke();
      fill(100, 100, 150, 200);
      rect(rd.x, rd.y, rd.w, rd.h);
      
      rd.y += rd.speed;
      if (rd.y > height) {
        rd.y = 0;
        rd.x = random(width);
      }
    }
  }

  // --- Animate and Draw Flowers ---
  let dRight = dist(mouseX, mouseY, rightButtonX, buttonY);
  if (mouseIsPressed && dRight < buttonRadius) {
    for (let f of flowers) {
      push();
      translate(f.x, f.y); // Move to the flower's location
      
      let petal = f.petalSize;
      noStroke();
      
      // Petals: yellow with alpha
      fill(255, 255, 0, f.alpha); // Yellow petals with varying alpha
      ellipse(0, -petal / 2, petal * 0.7, petal); // Taller oval petals
      ellipse(0, petal / 2, petal * 0.7, petal);
      ellipse(-petal / 2, 0, petal, petal * 0.7);
      ellipse(petal / 2, 0, petal, petal * 0.7);
      
      // Center of flower: yellow
      fill(255, 200, 0, f.alpha); // Slightly darker yellow for center for contrast
      ellipse(0, 0, petal * 0.6); // Center is a circle

      pop();

      // Move the flower downwards
      f.y += f.speed;

      // Reset the flower to the top when it goes off-screen
      if (f.y > height) {
        f.y = 0;
        f.x = random(width);
      }
    }
  }
}