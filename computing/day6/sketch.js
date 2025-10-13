let myCar;
let cars = [];
let yourCar;
let noCars = 20;


function setup() {
  createCanvas(innerWidth, innerHeight);
  for (let i=0; i<noCars; i+=1); {
    let tempCar = new Car(random(0, width), random(0, height), 50, 3)
    cars.push(tempCar);
  }

}
function draw() {
  background(220);

  for (let i=0; i<cars.length; i++) {

    cars[i].move();
    cars[i].show();
  }

}
