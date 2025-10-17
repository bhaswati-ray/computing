// --- GLOBAL VARIABLES ---
let gameState = 0; // 0: Start, 1: Play, 2: Dark Poem, 3: Light Poem
let redClicked = 0;
let blueClicked = 0;

const rectangles = [];
const totalRects = 60; 

// --- P5.JS SETUP FUNCTION ---
function setup() {
    createCanvas(innerWidth, innerHeight);
    
    for (let i = 0; i < totalRects / 2; i++) {
        rectangles.push(new RectBlue());
        rectangles.push(new RectRed());
    }
}

// --- P5.JS DRAW FUNCTION ---
function draw() {
    if (gameState === 0) {
        drawStartScreen();
    } else if (gameState === 1) {
        drawGamePlay();
    } else if (gameState === 2) {
        drawPoemScreen(true); 
    } else if (gameState === 3) {
        drawPoemScreen(false);
    }
}

// --- DRAWING FUNCTIONS ---

function drawStartScreen() {
    background(245);
    textAlign(CENTER, CENTER);
    fill(0);
    textSize(64);
    textStyle(BOLD);
    text("LIFE LENS", width / 2, height / 4);
    stroke(0);
    strokeWeight(4);
    noFill();
    ellipse(width / 2 - 80, height / 2, 120, 120);
    ellipse(width / 2 + 80, height / 2, 120, 120);
    arc(width / 2, height / 2 - 10, 80, 40, 0, PI);
    noStroke();
    fill(50);
    textSize(24);
    textStyle(NORMAL);
    text("Press any key to start", width / 2, height * 0.75);
}

function drawGamePlay() {
    background(230, 240, 255);

    // Update and display all rectangles
    for (let i = 0; i < rectangles.length; i++) {
        if (rectangles[i].active) {
            // Changed function calls to move() and show()
            rectangles[i].move();
            rectangles[i].show();
        }
    }
}

function drawPoemScreen(isDarkFlag) {
    let bgColor, textColor, poemText;
    if (isDarkFlag === true) {
        bgColor = color(0);
        textColor = color(255, 0, 0);
        poemText = "In shadows cast by falling fears,\nA world of red, a lens of tears.\nEach click a choice, a truth so stark,\nA perception built within the dark.";
    } else {
        bgColor = color(240, 240, 255);
        textColor = color(0, 100, 200);
        poemText = "Through skies of doubt, a flash of blue,\nA hopeful glimmer, fresh and new.\nEach click a choice, a brighter view,\nA silver lining breaking through.";
    }
    background(bgColor);
    textAlign(CENTER, CENTER);
    fill(textColor);
    textSize(48);
    textStyle(BOLD);
    text("Perception Shaped", width / 2, height / 3);
    textSize(28);
    textStyle(NORMAL);
    text(poemText, width / 2, height / 2 + 20);
}

// --- EVENT HANDLERS ---

function keyPressed() {
    if (gameState === 0) {
        gameState = 1;
    }
}

function mousePressed() {
    if (gameState === 1) {
        let clickedThisTurn = false;
        for (let i = rectangles.length - 1; i >= 0; i--) {
            if (clickedThisTurn === false && rectangles[i].active === true && rectangles[i].isClicked(mouseX, mouseY)) {
                rectangles[i].handleClick();
                clickedThisTurn = true;
            }
        }
    }
}
