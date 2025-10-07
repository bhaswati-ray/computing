let x;

function setup() {
  createCanvas(800, 400);
  x=0
}

function draw() {
  background('#4B6B7F');
  noStroke(100, 20, 255);
  fill('#FF8C00');

  // triangles flying across 
  triangle(120, 300, 130, 250, 70, 240);
  triangle(150, 200, 30, 150, 170, 180);
  triangle(250, 100, 30, 350, 270, 70);
  triangle(35, 95, 40, 200, 30, 20);
  triangle(40, 230, 3, 25, 47, 180);
  triangle(550, 200, 600, 10, 560, 180);
  triangle(60, 10, 70, 5, 670, 60);
  triangle();
  triangle(280, 10, 3, 30, 20, );
  circle(100, 40, 30)
  circle(160, 85, 9)
  circle(180, 215, 12)
  circle(200, 101, 30)
  circle(60, 85, 19)
  circle(200, 4, 100)
  triangle(115, 95, 10, 20, 30, 21)
  triangle(10, 10, 70, 5, 670, 60)
  ellipse(width/10,height/10,frameCount%30)
}
