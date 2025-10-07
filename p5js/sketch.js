function setup() {background('#dacdcd');
  createCanvas(800, 500);
}

function draw() {
  circle(mouseX,mouseY,20,20);
    fill('#8282cd');
  circle(width-mouseX,height-mouseY,10,5,3);
  //mirror
  circle(width-mouseX,height-mouseY,10,5,3);

}

