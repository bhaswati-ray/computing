function setup() {
  createCanvas(innerWidth, innerHeight);
}

function draw() {
  background(0, 0, 0, 30);

  // noise in 2d
  for (let i = 0; i < width; i += 5) {
    for (let j = 0; j < height; j += 5) {


      let outputNoise = noise((i*0.01), (j*0.01));
      fill(outputNoise*255);
      noStroke();
      rect(i, j, 5, 5)

    }
  }
  // noise in 1d
  // let noiseValue = noise (0.01*frameCount + 1000);
  // let noiseMapped = map( noiseValue, 0, 1, 10, 200);
  // ellipse (mouseX,mouseY, noiseMapped)
  // // console.log(noise(4 * frameCount + 2000));
}
