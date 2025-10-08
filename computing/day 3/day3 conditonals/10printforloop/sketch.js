function setup() {
  createCanvas(400, 400);
  background(220);
}

function draw() {

for (let i=15; i<400; i=i + 20) {
  ellipse(i,50,30,30);
  ellipse(50,i,30,30);
}
}
