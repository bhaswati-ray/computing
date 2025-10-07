let a,b,a1,b1;
function setup() {
  createCanvas(400, 400);
  a = color("#f8870fff");
  b = color("#212121ff");
}

function draw() {
  let fade = constrain(frameCount/450, 0, 1);
  a1=(lerpColor(a, color("#494d6dff"), fade));
  b1=(lerpColor(b, color("#a40404ff"), fade));
  background(a1);
  noStroke();
  fill(b1);

  ellipse(30, 40, 320);
  ellipse(345, 43, 310);
  ellipse(345, 350, 310);
  ellipse(30, 360, 320);

}