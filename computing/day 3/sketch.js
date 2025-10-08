function setup() {
  createCanvas(500, 500);
  background (50)
}

function draw() {

  function mousePressed()
  let randomNo;
  randomNo = random (20,50)
  drawflower(mouseX,mouseY); {
  }
  
  //create flower
  fill(random(100,250)0,0);
  noStroke();
  ellipse(x,y-petal/2,petal);
  ellipse(x,y+petal/2,petal);
  ellipse(x-petal/2,y,petal);
  ellipse(x+petal/2,y,petal);
  
  //centre of flower
  fill("yellow");
  ellipse (x,y,petal);




}
