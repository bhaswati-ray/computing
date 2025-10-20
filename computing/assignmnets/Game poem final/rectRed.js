// --- CLASS FOR RED ROCKS (SPRITE 1.png) ---
class RectRed {
    constructor() {
        this.x = random(innerWidth);
        this.y = random(-500, -50);
        // Random size 
        let baseSizeW = 60;
        let baseSizeH = 80;
        this.w = random(baseSizeW * 0.8, baseSizeW * 1.2);
        this.h = random(baseSizeH * 0.8, baseSizeH * 1.2);

        this.speed = random(1, 3.5);
        this.active = true;
    }

    move() {
        this.y += this.speed;
        if (this.y > innerHeight) {
            this.y = random(-200, -100);
            this.x = random(innerWidth);
        }
    }

    show() {
        image(rockRedSprite, this.x, this.y, this.w, this.h);
    }

    isClicked(mouseX, mouseY) {
        return mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h;
    }
    
    handleClick() {
        this.active = false;
        redClicked++;
    }
}