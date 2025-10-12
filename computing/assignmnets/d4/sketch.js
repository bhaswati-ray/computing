let size = 100
let i0, i1, i2, i3

function preload() {
  i0 = loadImage("img/1.png");
  i1 = loadImage("img/2.png");
  i2 = loadImage("img/3.png");
  i3 = loadImage("img/0.png");
}

function setup() {
  createCanvas(innerWidth, innerHeight);

  frameRate(5)
}

function draw() {
    background(220);
  for (i = 0; i < width; i = i + size) {
    for (j = 0; j < height; j = j + size) {

      //select one of 4
      let choice = floor(random(0, 4));

      if (choice == 0) {
        image(i0, i, j);

      }
      else if (choice == 1) {
        image(i1, i, j);

      } else if (choice == 2) {
        image(i2, i, j);

      } else {
        image(i3, i, j);

      }
    }
  }
}