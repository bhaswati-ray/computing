/**
 * Person Class: The player character
 */
class Person {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 20;
        this.h = 30;
        this.speed = 3;
        this.name = "Person";
        this.hasItemPower = false; // For Game State 3
        
        // Collision mechanics
        this.MAX_COLLISIONS = 7;
        this.collisionCount = 0;
        this.isVulnerable = true;
        this.vulnerabilityTimer = 0; // Frames to wait until vulnerable again
    }

    display() {
        // Draw name
        fill(255);
        textAlign(CENTER);
        textSize(12);
        text(this.name, this.x, this.y - this.h / 2 - 10);
        
        // Draw body
        // Blink when not vulnerable (invincible)
        if (!this.isVulnerable && frameCount % 10 < 5) {
            // Don't draw (blink)
        } else {
            fill(0, 100, 255); // Blue
            noStroke();
            rectMode(CENTER);
            rect(this.x, this.y, this.w, this.h, 4); // Added rounded corners
        }
    }
    
    updateVulnerability() {
        if (!this.isVulnerable) {
            this.vulnerabilityTimer--;
            if (this.vulnerabilityTimer <= 0) {
                this.isVulnerable = true;
            }
        }
    }

    registerHit() {
        if (this.isVulnerable) {
            this.collisionCount++;
            this.isVulnerable = false;
            this.vulnerabilityTimer = 60; // 1 second invulnerability
        }
    }

    update(walls) {
        // Handle invulnerability timer
        this.updateVulnerability();
        
        let nextX = this.x;
        let nextY = this.y;

        // Keyboard input
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) nextX -= this.speed; // A
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) nextX += this.speed; // D
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) nextY -= this.speed; // W
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) nextY += this.speed; // S

        // Wall collision detection
        let isColliding = false;
        for (let wall of walls) {
            // Check for collision with the next position
            if (
                nextX + this.w / 2 > wall.x &&
                nextX - this.w / 2 < wall.x + wall.w &&
                nextY + this.h / 2 > wall.y &&
                nextY - this.h / 2 < wall.y + wall.h
            ) {
                isColliding = true;
                break;
            }
        }

        // Only update position if not colliding
        if (!isColliding) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    // Check collision with other game objects (diyas, ghosts)
    collidesWith(other) {
        let d = dist(this.x, this.y, other.x, other.y);
        // Simple rectangle-to-circle collision check
        return d < this.w / 2 + other.size / 2;
    }
}
