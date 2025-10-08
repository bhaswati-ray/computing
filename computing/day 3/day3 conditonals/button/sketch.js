function setup() {
  createCanvas(400, 400);
  background(220);
}

function draw() {
  rect(200, 200, 50, 50);

}

function mouseClicked() {
  if (mouseX < 250 && mouseX > 200 && mouseY < 250 && mouseY < 250) {
    console.log("button clicked")
  }
}
