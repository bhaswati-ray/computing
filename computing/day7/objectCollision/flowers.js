class Flower {
    constructor(x, y, xSpeed, ySpeed) {
        this.x = x;
        this.y = y;
        this.xSpeed = xSpeed;
        this.ySpeed = ySpeed;
    }
    drawFlower() {
        noStroke()
        fill(227, 45, 62);
        ellipse(this.x, this.y, 20, 50);
        ellipse(this.x, this.y, 50, 20);
         fill(238,132,142);
        ellipse(this.x, this.y, 20);
    }
    moveFlower() {
        this.x += this.xSpeed;
        this.y += this.ySpeed;

        if (this.y > height || this.y < 0) {
            this.ySpeed = -this.ySpeed;

        }
        if (this.x > width || this.x < 0) {
            this.xSpeed = -this.xSpeed;

        
        }

    }

}
