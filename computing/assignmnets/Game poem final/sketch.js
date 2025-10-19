// --global variables / game ---
let gameState = 0; // 0: Start, 1: Tutorial, 2: Play, 3: Poem
let redClicked = 0;
let blueClicked = 0;

const rectangles = [];
const totalRects = 60; 
const startingRocks = 30; 

// --- Variables gameplay ---
let finalOutcomeIsDark = false;
let transitionAlpha = 255; // fade effects

// --- Asset variables
let specsSprite, rockRedSprite, rockBlueSprite;
let headingFont;

// --- assets ---
function preload() {
    specsSprite = loadImage('art_n_sound/0.png');
    rockRedSprite = loadImage('art_n_sound/1.png');
    rockBlueSprite = loadImage('art_n_sound/2.png');
    headingFont = loadFont('art_n_sound/Horizon-nMeM.ttf');
}

// --- Initial setup, runs once ---
function setup() {
    createCanvas(innerWidth, innerHeight);
    // Create all the rock objects for the game
    for (let i = 0; i < totalRects / 2; i++) {
        rectangles.push(new RectBlue());
        rectangles.push(new RectRed());
    }
    shuffle(rectangles, true); // Shuffle , random falling order
    resetRocks();
}

// --- Main game loop, 
function draw() {
    // Check game state = which  screen
    if (gameState === 0) { drawStartScreen(); } 
    else if (gameState === 1) { drawTutorialScreen(); } 
    else if (gameState === 2) { drawGamePlay(); } 
    else if (gameState === 3) { drawPoemScreen(finalOutcomeIsDark); }
}

// --- different screens ---

// start screen
function drawStartScreen() {
    background('#F5EFE6');
    if (transitionAlpha > 0) {
        background(245, 239, 230, transitionAlpha);
        transitionAlpha -= 5;
    }
    textAlign(CENTER, CENTER);
    imageMode(CENTER);

    // Specs image
    let specWidth = innerWidth * 0.4; 
    let specHeight = specWidth / 2;
    image(specsSprite, width / 2, height / 2, specWidth, specHeight); 
    imageMode(CORNER);

    // Title text
    textFont(headingFont);
    textSize(72 * 1.11); 
    let lifeLensY = height * 0.09 + (height * 0.03);

    fill(139, 0, 0); 
    text("LIFE", width / 2 - textWidth(" LENS") / 2, lifeLensY);

    fill(0, 100, 0); 
    text("LENS", width / 2 + textWidth("LIFE ") / 2, lifeLensY);

    // Blinking "Press Any Key" text
    textFont('sans-serif');
    textStyle(NORMAL);
    let blinkColor = color(0);
    if (frameCount % 60 < 30) {
        blinkColor = color(200);
    }
    fill(blinkColor);
    textSize(28); 
    text("Press Any Key To Start", width / 2, height * 0.75 + (height * 0.10));
}

// tutorial screen
function drawTutorialScreen() {
    background('#F5EFE6');
    textAlign(CENTER, CENTER);
    textFont('sans-serif');
    
    // Rock images and text
    let rockSize = 100;
    let spacing = 150; 
    let rockY = height / 2 - 50; 
    
    image(rockRedSprite, width/2 - spacing, rockY, rockSize, rockSize * 1.33);
    image(rockBlueSprite, width/2 + spacing - rockSize, rockY, rockSize, rockSize * 1.33);

    textStyle(ITALIC);
    fill(0);
    textSize(28);
    text("\"Click which rock describes\nyour life problems the most?\"", width/2, height * 0.25);
    
    // Blinking instructional text
    textStyle(NORMAL);
    let blinkColor = color(50);
    if (frameCount % 60 < 30) {
        blinkColor = color(180);
    }
    fill(blinkColor);
    textSize(24);
    text("Press Any Key To Play", width / 2, height * 0.75);
}
// main gameplay screen
function drawGamePlay() {
    // gradual bg change that respons to choice of rocks 
    let totalClicks = redClicked + blueClicked;
    let redRatio = totalClicks > 0 ? redClicked / totalClicks : 0.5;
    let beigeColor = color('#F5EFE6');
    let warmRedColor = color(40, 0, 0); 
    let coolBlueColor = color('#87CEEB'); 
    let bgColor = lerpColor(coolBlueColor, warmRedColor, redRatio);
    let finalBg = lerpColor(beigeColor, bgColor, totalClicks / 15);
    background(finalBg);
    
    // Draw all the active rocks
    for (let i = 0; i < rectangles.length; i++) {
        if (rectangles[i].active === true) {
            rectangles[i].move();
            rectangles[i].show();
        }
    }

    // Top UI bar
    let topBarHeight = 60;
    fill(100);
    noStroke();
    rect(0, 0, width, topBarHeight);
    
    // Score display
    textFont('sans-serif');
    textStyle(NORMAL);
    fill(255);
    textSize(24);
    textAlign(LEFT, CENTER);
    let margin = 20;
    image(rockRedSprite, margin, topBarHeight / 2 - 20, 30, 40);
    text(nf(redClicked, 2), margin + 40, topBarHeight / 2);
    let blueStartX = margin + 100;
    image(rockBlueSprite, blueStartX, topBarHeight / 2 - 20, 30, 40);
    text(nf(blueClicked, 2), blueStartX + 40, topBarHeight / 2);
    
    // Title in the top bar
    textFont(headingFont);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("LIFE LENS", width/2, topBarHeight/2);

    // Check if the game should end
    if (totalClicks >= 11) {
        finalOutcomeIsDark = redClicked > blueClicked;
        gameState = 3;
        transitionAlpha = 0;
    }
}

// Draws the final poem screen
function drawPoemScreen(isDarkFlag) {
    let targetColor, textColor, poemLines, restartBlinkColor, restartText;
    if (isDarkFlag) {
        targetColor = color('#4D0000'); 
        textColor = color(255, 0, 0); 
        restartBlinkColor = color(255);
        poemLines = ['"In shadows cast by falling fears,','A world of red, a lens of tears.','Each click a choice, a truth so stark,','A Perception built within the dark."'];
        restartText = "Restart Your Life Lens";
    } else {
        targetColor = color('#001F3F'); 
        textColor = color(150, 200, 255);
        restartBlinkColor = color(0);
        poemLines = ['"Through skies of doubt, a flash of blue,','A hopeful glimmer, fresh and new.','Each click a choice, a brighter view,','A silver lining breaking through."'];
        restartText = "Keep this Life Lens";
    }
    
    // Gradual background fade-in
    let currentColor = lerpColor(color(0, 0), targetColor, transitionAlpha / 255);
    background(currentColor);
    if (transitionAlpha < 255) {
        transitionAlpha += 1.5;
    }
    
    // Heading and poem text
    textAlign(CENTER, CENTER);
    textFont(headingFont);
    fill(textColor);
    textSize(48);
    text("YOUR LIFE PERCEPTION", width / 2, height * 0.25);
    
    textFont('sans-serif');
    textStyle(ITALIC); 
    textSize(22); 
    let fullPoem = poemLines.join('\n');
    text(fullPoem, width / 2, height * 0.45);
    
    // Restart instructions
    textStyle(NORMAL);
    textSize(24);
    fill(textColor);
    text(restartText, width / 2, height * 0.85);

    if (frameCount % 60 < 40) {
        fill(textColor);
    } else {
        fill(restartBlinkColor);
    }
    text("Press Any Key", width / 2, height * 0.9);
}

// ---reset rocks for a new game ---
function resetRocks() {
    for (let i = 0; i < rectangles.length; i++) {
        if (i < startingRocks) {
            rectangles[i].active = true;
            rectangles[i].y = random(-500, -50);
            rectangles[i].x = random(innerWidth);
        } else {
            rectangles[i].active = false;
        }
    }
}

// --- interactions for player ---

//  keyboard func
function keyPressed() {
    if (gameState === 0) {
        gameState = 1;
        transitionAlpha = 255;
    } else if (gameState === 1) {
        gameState = 2;
    } else if (gameState === 3) {
        // If it was the dark poem, restart gameplay
        if (finalOutcomeIsDark) {
            gameState = 2;
        } else { // If it was the light poem, go to the start screen
            gameState = 0;
        }
        
        // Reset all game variables for start
        redClicked = 0;
        blueClicked = 0;
        transitionAlpha = 255;
        shuffle(rectangles, true);
        resetRocks();
    }
}

//  mouse clicks
function mousePressed() {
    if (gameState === 2) {
        for (let i = rectangles.length - 1; i >= 0; i--) {
            if (rectangles[i].active === true && rectangles[i].isClicked(mouseX, mouseY)) {
                rectangles[i].handleClick();
                break; 
            }
        }
    }
}

