let gBall;
let rPaddle, lPaddle;
function setup() {
  createCanvas(800, 400);
  gBall = new Ball(width / 2, height / 2, 5, 5);


  //create the paddles
  let pWidth = 10, pHeight = 40;
  lPaddle = new Paddle(0, height / 2 - pHeight / 2, pWidth, pHeight, 5);
  rPaddle = new Paddle(width - pHeight, height / 2 - pWidth / 2, pWidth, pHeight, 5);
}
function draw() {
  background(220);
  gBall.show();
  rPaddle.show();
  lPaddle.show();

  // /if keys UP and DOWN are pressed, move the right paddle
  if (keyIsDown(UP_ARROW)) {
    rPaddle.moveUp();
  } else if (keyIsDown(DOWN_ARROW)) {
    rPaddle.moveDown();
  }
  //if keys W and S are pressed, move the left paddle
  if (keyIsDown(87)) {
    lPaddle.moveUp();
  } else if (keyIsDown(83)) {
    lPaddle.moveDown();
  }

  reset() {
    this.x = width/2;
    this.y = height/2;
  }

  checkCollisionWall() {
    if(this.y <this.size/2 || this.y>height-this.size/2) {
      this.ySpeed = -this.ySpeed;
    }
  } 
  checkWinner() {
    if(this.x<0) {
      return 2;
    } else if(this.x>width) {
      return 1;
    } else {
      return 0;
    }
  }

  checkCollisionPaddle(paddle) {
     if(this.x<paddle.x+paddle.width &&
      this.x > paddle.x &&
      this.y<paddle.y + paddle.height &&
      this.y > paddle.y
    ) {
      console.log("BAM!!");
      this.xSpeed = -this.xSpeed*1.2;
    }
  }
}



