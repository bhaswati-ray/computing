// --- CLASS FOR RED RECTANGLES ---
class RectRed {
    constructor() {
        // Position and size attributes
        this.x = random(innerWidth);
        this.y = random(-500, -50);
        this.w = 40; // width
        this.h = 60; // height
        
        // Slower falling speed
        this.speed = random(1, 3.5);
        
        // Flag to check if the rectangle is active
        this.active = true;
    }

    // Method to move the rectangle down
    update() {
        this.y += this.speed;
        // If it goes off screen, reset its position to the top
        if (this.y > innerHeight) {
            this.y = random(-200, -100);
            this.x = random(innerWidth);
        }
    }

    // Method to draw the rectangle
    display() {
        noStroke();
        fill(255, 50, 50); // Red color
        rect(this.x, this.y, this.w, this.h, 5); // Rounded corners
    }

    // Method to check if the mouse click is inside this rectangle
    isClicked(mouseX, mouseY) {
        // Returns true or false
        return mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h;
    }
    
    // Method to handle all logic when this object is clicked
    handleClick() {
        // Deactivate this rectangle
        this.active = false;

        // Increment the specific counter for red rectangles
        redClicked++;

        // Check if the win condition is met
        if (redClicked >= 4) {
            // Change the main game state
            gameState = 2; // Go to dark poem
        }
    }
}