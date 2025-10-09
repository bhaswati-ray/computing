function setup() {
  createCanvas(400, 400);
  background(220);
  x = 0;
  y = 0;
  size = 50;
}

function draw() {

  //pick random no bw 0 and 1
  choice = random(0, 1);

  //if less than 0.5, draw "/" , else draw "\"
  if (choice < 0.2) {
    line(x + size, y, x, y + size);
  } else {
    line(x, y, x + size, y + size);
  }

  //move the point to the right
  x = x + size

  //if  it walks off the screen, x=0, y=y+size
  if (x > width) {
    x = 0;
    y = y + size;


  }
}
