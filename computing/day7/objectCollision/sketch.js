let flowers= [];
function setup() {
  createCanvas(innerWidth, innerHeight);
}

function draw() {
  background(45);
  for (let i = 0; i < flowers.length; i++) {
    flowers[i].moveFlower();
    flowers[i].drawFlower();
  }
}

function mousePressed() {
  let tempFlower = new Flower(mouseX, mouseY, random( -5, 5), random(-5,5));
  flowers.push(tempFlower);

  //   myFlower.drawFlower();
}

//draw a flower at the point where i Click on the canvas
//STEPS
//Cliack somewhere ->mousePressed
//Click a flower at mouse Postion ->
// let VARIABLE = new flower (mouse X ,mouse Y)
