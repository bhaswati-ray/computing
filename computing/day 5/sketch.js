let spriteImg;
let sRows = 4, sCols = 8;
let count = 0
let xdir = 0 
let sprites = [];
function preload() {
  spriteImg = loadImage("images/explosionFull.png");
}
function setup() {
  createCanvas(innerWidth, innerHeight);
  let sWidth = spriteImg.width / sCols;
  let sHeight = spriteImg.height / sRows;
  

  //loop the sprite image and store it in a 1d array sprite
  for (let i = 0; i < sRows; i++) {
    for (let j = 0; j < sCols; j++) {
      //get that slice of the sprite
      //store it i the array sprites
      sprites[sprites.length] =
        spriteImg.get(j * sWidth, i * sHeight, sWidth, sHeight);
      //image.getneeds(x,y,w,h) of the part that you want from the sprite sheet
    }
  }

}

function draw() {
  background(220);

  if (isKeyPressed){
     count++;

  }
   
  image(sprites[frameCount%(sprites.length)],0, 0)

}

function keyPressed() {
  if (keycode ==37) {
     xDir==-1;

  }

}