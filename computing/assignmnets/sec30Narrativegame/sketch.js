// --- Global Variables ---
let rightButtonX, rightButtonY, leftButtonX, leftButtonY;
let buttonRadius = 70;

let flowers = [];   // Array to store flower particles (formerly yellow circles)
let rainDrops = []; // Array to store rain drop particles

// --- Setup Function (runs once) ---
function setup() {
  createCanvas(800, 500);

  // Calculate button positions to be close together
  let bridgeWidth = 30;
  leftButtonX = width / 2 - buttonRadius - bridgeWidth / 2;
  rightButtonX = width / 2 + buttonRadius + bridgeWidth / 2;
  leftButtonY = height / 2;
  rightButtonY = height / 2;

  // Initialize the particles for both animations
  for (let i = 0; i < 20; i++) {
    flowers.push(new Flower()); // Create Flower objects
  }
  for (let i = 0; i < 50; i++) {
    rainDrops.push(new RainDrop());
  }
}

// --- Draw Function (runs continuously) ---
function draw() {
  // First, check the condition for rain to set the background
  let dLeft = dist(mouseX, mouseY, leftButtonX, leftButtonY);
  let isRaining = mouseIsPressed && dLeft < buttonRadius;

  // Set the background color based on the rain condition
  if (isRaining) {
    background(20, 20, 30); // Darker background when it rains
  } else {
    background(50, 50, 70); // Normal background
  }

  // --- Display the main text ---
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);
  text("life lens", width / 2, height / 2 - 150);

  // --- Draw the spectacle outlines ---
  strokeWeight(4);
  noFill();
  stroke(255, 180);

  // Draw lenses and bridge
  ellipse(leftButtonX, leftButtonY, buttonRadius * 2);
  ellipse(rightButtonX, rightButtonY, buttonRadius * 2);
  arc(width / 2, leftButtonY - 5, 60, 40, PI, TWO_PI);

  // --- Animation Drawing ---
  // If mouse is pressed and over the left lens, draw rain
  if (isRaining) {
    for (let rd of rainDrops) {
      rd.display();
      rd.update();
    }
  }

  // If mouse is pressed and over the right lens, draw flowers
  let dRight = dist(mouseX, mouseY, rightButtonX, rightButtonY);
  if (mouseIsPressed && dRight < buttonRadius) {
    for (let f of flowers) {
      f.display();
      f.update();
    }
  }
}

// --- Flower Class (formerly YellowCircle) ---
class Flower {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(15, 40); // Base size for the flower
    this.alpha = random(100, 255); // Varying alpha for transparency
    this.speed = random(0.3, 1.5);
    this.petalColor = color(255, 200, 0, this.alpha); // Orange-yellow petals
    this.centerColor = color(255, 100, 0, this.alpha); // Darker orange center
  }

  display() {
    noStroke();
    push(); // Save current drawing style settings
    translate(this.x, this.y); // Move origin to flower's position

    // Draw petals
    fill(this.petalColor);
    let numPetals = 6;
    let petalLength = this.size * 0.4; // Length of each petal
    let petalWidth = this.size * 0.2;  // Width of each petal
    for (let i = 0; i < numPetals; i++) {
      ellipse(0, petalLength / 2, petalWidth, petalLength); // Draw an oval petal
      rotate(TWO_PI / numPetals); // Rotate for next petal
    }

    // Draw center
    fill(this.centerColor);
    ellipse(0, 0, this.size * 0.4); // Central circle

    pop(); // Restore original drawing style settings
  }

  update() {
    this.y += this.speed; // Move downwards
    // If flower goes off screen, reset it to the top
    if (this.y > height + this.size / 2) {
      this.reset();
      this.y = -this.size / 2; // Start from above the canvas
    }
  }
}

// --- RainDrop Class ---
// (This class remains unchanged)
class RainDrop {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = random(width);
    this.y = random(-200, 0);
    this.w = random(2, 5);
    this.h = random(10, 30);
    this.speed = random(3, 7);
    this.color = color(100, 100, 150, random(150, 220));
  }
  display() {
    noStroke();
    fill(this.color);
    rect(this.x, this.y, this.w, this.h);
  }
  update() {
    this.y += this.speed;
    if (this.y > height + this.h) {
      this.reset();
    }
  }
}