/**
 * Diya Class: The 14 protective lights
 */
class Diya {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.name = "Diya";
        this.isLit = false;
        this.wasUnlitByGhost = false;
        this.clickCount = 0;
    }

    display() {
        rectMode(CENTER);
        noStroke();
        
        // Draw light radius if lit
        if (this.isLit) {
            // Pulsing light effect
            let lightSize = 150 + sin(frameCount * 0.05) * 10;
            fill(255, 220, 0, 50); // Soft yellow alpha
            ellipse(this.x, this.y, lightSize, lightSize);
        }
        
        // Draw Diya square
        fill(139, 69, 19); // Brown
        rect(this.x, this.y, this.size, this.size, 2);
        
        // Draw flame
        if (this.isLit) {
            fill(255, 150, 0);
            ellipse(this.x, this.y - this.size/2 + 2, 5, 10);
        }

        // Draw name
        fill(255, 255, 255, 150);
        textAlign(CENTER);
        textSize(10);
        text(this.name, this.x, this.y - this.size / 2 - 8);
    }

    // Handle clicking on a diya to relight it
    handleClick(person) {
        // Only handle clicks for diyas unlit by ghosts
        if (!this.isLit && this.wasUnlitByGhost) {
            let d = dist(mouseX, mouseY, this.x, this.y);
            let personDist = dist(person.x, person.y, this.x, this.y);

            // Check if player clicked the diya AND is close enough
            if (d < this.size / 2 && personDist < 60) {
                
                if (gameState === 2) { // Level 1 logic: 2 clicks
                    this.clickCount++;
                    if (this.clickCount >= 2) {
                        this.isLit = true;
                        this.clickCount = 0;
                    }
                } else if (gameState === 3) { // Level 2 logic: requires item
                    if (person.hasItemPower) {
                        this.isLit = true;
                        person.hasItemPower = false; // Use up the power
                    }
                }
            }
        }
    }
}
