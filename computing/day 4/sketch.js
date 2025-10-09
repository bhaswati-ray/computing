let noPetals = 9;
function setup() {
  createCanvas(400, 400);
  background(50);
  angleMode(DEGREES)
}

function draw() {
  translate(width / 2, height / 2);
  push();



  for (let i = 0; i < noPetals; i++) {

    rotate(360 / noPetals);
    fill("yellow");
    ellipse(80, 0, 100, 50,);
  }
  fill("red");
  ellipse(0, 0, 75);
  pop()


}
