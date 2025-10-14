let 

function setup() {
  createCanvas(innerWidth, innerHeight);
}

function draw() {
  let outputValue = 0
  outputValue = map(mouseX,0,innerWidth,0,255);
  background(outputValue);
}
