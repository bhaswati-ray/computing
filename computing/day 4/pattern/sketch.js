let size = 50
function setup() {
  createCanvas(400, 400);
  frameRate(2)
  background(220);
}

function draw() {
  for (i = 0; i < width; i = i + size); {
    for (j = 0; j < height; j = j + size){

    //select one of 4
    let choice = floor(random(0, 4));

    if (choice == 0) {
      fill("blue");
      rect(i, j, size, size);
    }
    else if (choice == 1) {
      fill("red");
      rect(i, j, size, size);

    } else if (choice == 2) {
      fill("yellow");
      rect(i, j, size, size);

    } else if (choice == 3) {
      fill("cyan");
      rect(i, j, size, size);

    } else {
      fill("pink");
      rect(i, j, size, size);

    }
  }
}
}