// CLASS FOR RED ROCKS (SPRITE 1.png) ---
class RectRed {
    constructor() {
        this.x = random(innerWidth);
        this.y = random(-500, -50);
        // Size sprites
        this.w = 60;
        this.h = 80;
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

    // rains the loaded red rock sprite
    show() {
        image(rockRedSprite, this.x, this.y, this.w, this.h);
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