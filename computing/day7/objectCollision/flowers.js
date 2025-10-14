class Flower {
    constructor(x, y, xSpeed, ySpeed) {
        this.x = x;
        this.y = y;
        this.xSpeed = xSpeed;
        this.ySpeed = ySpeed;
    }
    drawFlower() {
        if(this.selected==true){
            fill("yellow");
        } else {

         fill ("pink");
        }
        ellipse(this.x, this.y, 20, 50);
        ellipse(this.x, this.y, 50, 20);
        ellipse(this.x, this.y, 20);

        ellipse(this.x,this.y,this.size);
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
    // changeColour(mouseX, mouseY) {
    //     let distance = dist(mouseX, mouseY, this.x, this, y);
    //     if (distance < this.size / 2) {
    //         fill(227, 45, 62);
    //     } else {
    //         fill(238, 132, 142)
    //     }
    }

