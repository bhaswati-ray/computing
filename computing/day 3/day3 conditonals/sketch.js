function setup() {
  createCanvas(400, 400);
  background(220);
}

function draw() {
}

function mouseClicked() {
  //get xposition of mouse --> mouseX
  //if  mouseX is on the left --> mouseX <width/2 ->draw yellow ellipse
  //else draw red elipse

  if (mouseX < height/ 2) {
    fill("yellow");
    ellipse(mouseX, mouseY, 20);

  } else {
    fill("red")
    rect(mouseX, mouseY, 20,10);

  }}