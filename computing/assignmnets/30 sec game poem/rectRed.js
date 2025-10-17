// --- CLASS FOR RED RECTANGLES ---
class RectRed {
    constructor() {
        this.x = random(innerWidth);
        this.y = random(-500, -50);
        this.w = 40; // width
        this.h = 60; // height
        this.speed = random(1, 3.5);
        this.active = true;
    }

    // This function is for LOGIC (moving the rectangle)
    move() {
        this.y += this.speed;
        if (this.y > innerHeight) {
            this.y = random(-200, -100);
            this.x = random(innerWidth);
        }
    }

    // This function is for DRAWING (showing the rectangle)
    show() {
        noStroke();
        fill(255, 50, 50);
        rect(this.x, this.y, this.w, this.h, 5);
    }

    isClicked(mouseX, mouseY) {
        return mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h;
    }
    
    handleClick() {
        this.active = false;
        redClicked++;
        if (redClicked >= 4) {
            gameState = 2;
        }
    }
}