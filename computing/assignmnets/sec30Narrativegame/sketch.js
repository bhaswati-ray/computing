let on = false;

function setup() {
  createCanvas(400, 400);
  background(255);
}

function draw() {
  if (on) {
    background(0, 255, 0);
  } else {
    background(0);
  }

  Stroke(255);
  strokeWeight(4);
  noFill();
  ellipse(230, 200, 80);


  function mousePressed() {
    on = true;

  }













}
