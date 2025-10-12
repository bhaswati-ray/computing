let spriteImage, sprites =[];
let spriteX = 8, spriteY = 4;
let count = 0;
let row = 0;
let x = 0, y = 0;
let xdir = 0, ydir = 0;

function preload() {
  //load the full sprite image
  spriteImage = loadImage('rpg_sprite_walk.png');
}

function setup() {
  createCanvas(400, 400);
  //break the sprite image into individual images and store it into a 2D array (Note - 2D array is basically where each element fo the arrat is another array)
  // w -> width of each individual image
  // h -> height of each individual image
  let w = spriteImage.width/spriteX;
  let h = spriteImage.height/spriteY;
  
  //loop through the 4 rows
  for(let i = 0; i<spriteY;i++) {
    //create an empty array for each row
    sprites[i] = [];
    
    //within each row, loop through the columns
     for(let j = 0;j<spriteX;j++) {
      // store the images in the 2D array
      sprites[i][j] = spriteImage.get(j*w, i*h, w, h ); 
    }
  }
  
}

function draw() {
  background(220);
  //draw the appropriate image from the array based on the row selected (check keyPressed) and the x and y position
  image(sprites[row][count],x,y);
  if(frameCount%5==0 && isKeyPressed) {
    count = (count+1)%spriteX;
    x = x+ xdir;
    y = y+ ydir;
  }
}

function keyPressed() {
  //read the appropriate row based on the key direction
  if(keyCode == UP_ARROW) {
    row = 3; // select the right row
    xdir = 0; //make sure the sprite doesnt move along x axis
    ydir = -8; //make sprite move up
  } else if(keyCode == DOWN_ARROW) {
    row = 0;
    xdir = 0; //make sure the sprite doesnt move along x axis
    ydir = 8; //make sprite move down
  } else if(keyCode == LEFT_ARROW) {
    row = 1;
    ydir = 0; //make sure the sprite doesnt move along y axis
    xdir = -8; //make sprite move left
  } else if(keyCode == RIGHT_ARROW) {
    row = 2;
    ydir = 0; //make sure the sprite doesnt move along y axis
    xdir = 8; //make sprite move left
  }
}