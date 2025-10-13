let myFlower; // A single variable to hold our flower object

// The setup function runs once when the sketch starts
function setup() {
  createCanvas(400, 400);
  // Create one new flower object and place it at the bottom center
  myFlower = new Flower(width / 2, height); 
}

// The draw function runs continuously
function draw() {
  background(135, 206, 250); // A nice sky blue
  myFlower.grow();    // Call the grow method
  myFlower.display(); // Call the display method
}

// ============== Flower Class ==============
class Flower {
  // The constructor sets up the object's properties
  constructor(x, y) {
    this.x = x; // The base x-position of the flower
    this.y = y; // The base y-position of the flower
    this.size = 0; // The flower starts with a size of 0
    this.growthRate = 0.2; // How fast it grows each frame
  }

  // A method to increase the flower's size
  grow() {
    if (this.size < 80) { // Add a max size so it stops growing
      this.size += this.growthRate;
    }
  }

  // A method to draw the flower on the canvas
  display() {
    // push() saves the current drawing state and coordinate system.
    push(); 
    
    // --- Draw the Stem ---
    // Move the origin (0,0) to the base of the flower.
    translate(this.x, this.y); 
    stroke(0, 150, 0); // Green color
    strokeWeight(4);
    // Draw the stem straight up. The flower head's Y position is now just a negative number.
    let stemHeight = -this.size * 1.5;
    line(0, 0, 0, stemHeight); 
    
    // --- Draw the Flower Head ---
    // Move the origin again to the top of the stem.
    translate(0, stemHeight); 
    
    noStroke();

    // --- Draw the Petals ---
    fill(255, 99, 71, 200); // A translucent tomato red for the petals
    const numPetals = 6;
    for (let i = 0; i < numPetals; i++) {
      // Rotate the entire canvas for each petal. This is easier than trigonometry.
      rotate(TWO_PI / numPetals);
      // Draw each petal at the same spot; the rotation moves it into place.
      ellipse(this.size * 0.5, 0, this.size, this.size * 0.5);
    }
    
    // --- Draw the Flower Center ---
    fill(255, 204, 0); // A yellow center
    // The center is drawn at the new origin (0,0), which is the top of the stem.
    ellipse(0, 0, this.size * 0.6);

    // pop() restores the original drawing state and coordinate system.
    pop(); 
  }
}