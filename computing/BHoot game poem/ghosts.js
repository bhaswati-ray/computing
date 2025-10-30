/**
 * Ghost1 Class: The first ghost
 */
class Ghost1 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.name = "Ghost 1";
        this.isActive = false;
        this.isVisible = false;
        this.timer = 200; // Time between actions
        this.unlitDiyas = new Set(); // Track which diyas it has already unlit
    }

    activate() {
        this.isActive = true;
        this.isVisible = true;
    }

    update(diyas) {
        if (!this.isActive) return;

        this.timer--;
        if (this.timer <= 0) {
            this.isVisible = !this.isVisible; // Toggle visibility
            this.timer = random(100, 300); // Reset timer

            if (this.isVisible) {
                // Find a lit diya that hasn't been unlit before
                let availableDiyas = diyas.filter(d => d.isLit && !this.unlitDiyas.has(d));
                
                if (availableDiyas.length > 0) {
                    let targetDiya = random(availableDiyas);
                    this.x = targetDiya.x;
                    this.y = targetDiya.y;
                    targetDiya.isLit = false;
                    targetDiya.wasUnlitByGhost = true;
                    this.unlitDiyas.add(targetDiya); // Mark this diya as "used"
                }
            }
        }
    }

    display() {
        if (!this.isActive || !this.isVisible) return;
        
        fill(220, 220, 255, 100); // Translucent white
        noStroke();
        // Drifting effect
        let driftX = this.x + sin(frameCount * 0.02) * 10;
        let driftY = this.y + cos(frameCount * 0.02) * 10;
        ellipse(driftX, driftY, this.size, this.size);
        
        fill(255, 100, 100);
        textAlign(CENTER);
        textSize(12);
        text(this.name, driftX, driftY - this.size / 2 - 5);
    }
}

/**
 * Ghost2 Class: The second ghost (inherits from Ghost1)
 */
class Ghost2 extends Ghost1 {
    constructor(x,y) {
        super(x,y); // Inherits from Ghost1
        this.name = "Ghost 2";
    }
    // For this design, Ghost2 behaves identically to Ghost1.
    // The change in game logic is handled by the 'Item' class.
}
