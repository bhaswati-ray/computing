// --- CLASS FOR RED ROCKS (SPRITE 1.png) ---
class RectRed {
    constructor() {
        this.x = random(innerWidth);
        this.y = random(-500, -50);
        let baseSizeW = 60;
        let baseSizeH = 80;
        this.w = random(baseSizeW * 0.8, baseSizeW * 1.2);
        this.h = random(baseSizeH * 0.8, baseSizeH * 1.2);
        
        this.speed = random(1, 3.5);
        this.active = false;
    }

    move() {
        this.y += this.speed;

        if (this.y > innerHeight) {
            this.active = false;
            for (let i = 0; i < rectangles.length; i++) {
                if (!rectangles[i].active) {
                    rectangles[i].active = true;
                    rectangles[i].y = random(-200, -100);
                    rectangles[i].x = random(innerWidth);
                    break;
                }
            }
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
        // Activate a new rock to replace this one
        for (let i = 0; i < rectangles.length; i++) {
            if (!rectangles[i].active) {
                rectangles[i].active = true;
                rectangles[i].y = random(-200, -100);
                rectangles[i].x = random(innerWidth);
                break;
            }
        }
    }
}