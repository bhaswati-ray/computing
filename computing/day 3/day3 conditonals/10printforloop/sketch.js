function setup() {
  createCanvas(400, 400);
  background(220);
}

function draw() {

for (let i=0; i<width; i=i + size)
  for (let j=0; i<height; i=i + size)
  {
  ellipse(i,50,30,30);
  ellipse(50,i,30,30);
}
}
