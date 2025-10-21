// --- My global variables for the game ---
let gameState = 0; // 0: Start, 1: Tutorial, 2: Play, 3: Poem
let redClicked = 0;
let blueClicked = 0;

const rectangles = [];
const totalRects = 60; 
const startingRocks = 30; 

// --- Variables for controlling gameplay ---
let finalOutcomeIsDark = false;
let transitionAlpha = 255; // For fade effects

// --- Asset variables ---
let specsSprite, rockRedSprite, rockBlueSprite;
let headingFont;
let startMusic, gameBgMusic, darkPoemSound, goodEndSound;

// --- Sound control flags ---
let musicStarted = false; // Flag to check if audio is unlocked by the user
let startMusicPlaying = false;
let gameMusicPlaying = false;

// --- Load all my assets before the game starts ---
function preload() {
    let assetPath = 'art_n_sound/';
    specsSprite = loadImage(assetPath + '0.png');
    rockRedSprite = loadImage(assetPath + '1.png');
    rockBlueSprite = loadImage(assetPath + '2.png');
    headingFont = loadFont(assetPath + 'Horizon-nMeM.ttf');
    
    startMusic = loadSound(assetPath + 'StartMusic.mp3');
    gameBgMusic = loadSound(assetPath + 'gameBg.mp3');
    darkPoemSound = loadSound(assetPath + 'darkPoem.mp3');
    goodEndSound = loadSound(assetPath + 'GoodEnd.mp3');
}

// --- Initial setup, runs once ---
function setup() {
    createCanvas(innerWidth, innerHeight);
    for (let i = 0; i < totalRects / 2; i++) {
        rectangles.push(new RectBlue());
        rectangles.push(new RectRed());
    }
    shuffle(rectangles, true);
    resetRocks();
}

// --- Main game loop ---
function draw() {
    if (gameState === 0) { drawStartScreen(); } 
    else if (gameState === 1) { drawTutorialScreen(); } 
    else if (gameState === 2) { drawGamePlay(); } 
    else if (gameState === 3) { drawPoemScreen(finalOutcomeIsDark); }
}

// --- All my functions for drawing the different screens ---

function drawStartScreen() {
    // This tells the music manager that startMusic should be playing
    manageMusic(true, false); 

    background('#F5EFE6');
    if (transitionAlpha > 0) {
        background(245, 239, 230, transitionAlpha);
        transitionAlpha -= 5;
    }
    textAlign(CENTER, CENTER);
    imageMode(CENTER);
    let specWidth = innerWidth * 0.4; 
    let specHeight = specWidth / 2;
    image(specsSprite, width / 2, height / 2, specWidth, specHeight); 
    imageMode(CORNER);
    textFont(headingFont);
    textSize(72 * 1.11); 
    let lifeLensY = height * 0.09 + (height * 0.03);
    fill(139, 0, 0); 
    text("LIFE", width / 2 - textWidth(" LENS") / 2, lifeLensY);
    fill(0, 100, 0); 
    text("LENS", width / 2 + textWidth("LIFE ") / 2, lifeLensY);
    textFont('sans-serif');
    textStyle(NORMAL);
    let blinkColor = color(0);
    if (frameCount % 60 < 30) { blinkColor = color(200); }
    fill(blinkColor);
    textSize(28); 
    text("Press Any Key To Start", width / 2, height * 0.75 + (height * 0.10));
}

function drawTutorialScreen() {
    // Start music continues to play here
    manageMusic(true, false);

    background('#F5EFE6');
    textAlign(CENTER, CENTER);
    textFont('sans-serif');
    let rockSize = 100;
    let spacing = 150; 
    let rockY = height / 2 - 50; 
    image(rockRedSprite, width/2 - spacing, rockY, rockSize, rockSize * 1.33);
    image(rockBlueSprite, width/2 + spacing - rockSize, rockY, rockSize, rockSize * 1.33);
    textStyle(ITALIC);
    fill(0);
    textSize(28);
    text("\"Click which rock describes\nyour life problems the most?\"", width/2, height * 0.25);
    textStyle(NORMAL);
    let blinkColor = color(50);
    if (frameCount % 60 < 30) { blinkColor = color(180); }
    fill(blinkColor);
    textSize(24);
    text("Press Any Key To Play", width / 2, height * 0.75);
}

function drawGamePlay() {
    // This tells the music manager to switch to the game music
    manageMusic(false, true);

    let totalClicks = redClicked + blueClicked;
    let redRatio = totalClicks > 0 ? redClicked / totalClicks : 0.5;
    let beigeColor = color('#F5EFE6');
    let warmRedColor = color(40, 0, 0); 
    let coolBlueColor = color('#87CEEB'); 
    let bgColor = lerpColor(coolBlueColor, warmRedColor, redRatio);
    let finalBg = lerpColor(beigeColor, bgColor, totalClicks / 15);
    background(finalBg);
    for (let i = 0; i < rectangles.length; i++) {
        if (rectangles[i].active === true) {
            rectangles[i].move();
            rectangles[i].show();
        }
    }
    let topBarHeight = 60;
    fill(100);
    noStroke();
    rect(0, 0, width, topBarHeight);
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
    textFont(headingFont);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("LIFE LENS", width/2, topBarHeight/2);

    if (totalClicks >= 11) {
        manageMusic(false, false); // Turn off all looping music
        finalOutcomeIsDark = redClicked > blueClicked;
        if (finalOutcomeIsDark) {
            darkPoemSound.play();
        } else {
            goodEndSound.play();
        }
        gameState = 3;
        transitionAlpha = 0;
    }
}

function drawPoemScreen(isDarkFlag) {
    // Ensure all looping music is stopped
    manageMusic(false, false);

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
    let currentColor = lerpColor(color(0, 0), targetColor, transitionAlpha / 255);
    background(currentColor);
    if (transitionAlpha < 255) { transitionAlpha += 1.5; }
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
    textStyle(NORMAL);
    textSize(24);
    fill(textColor);
    text(restartText, width / 2, height * 0.85);

    if (frameCount % 60 < 40) { fill(textColor); } else { fill(restartBlinkColor); }
    text("Press Any Key", width / 2, height * 0.9);
}

// --- My new function to handle smooth sound transitions ---
function manageMusic(startShouldPlay, gameShouldPlay) {
    let fadeTime = 0.5; // half a second to fade

    // Only do any of this if the user has clicked/pressed a key at least once
    if (musicStarted) {
        // --- Handle Start Screen Music ---
        // If it should be playing but isn't, fade it in
        if (startShouldPlay && !startMusicPlaying) {
            startMusic.loop();
            startMusic.setVolume(1, fadeTime);
            startMusicPlaying = true; // Set flag to true
        } 
        // If it shouldn't be playing but is, fade it out
        else if (!startShouldPlay && startMusicPlaying) {
            startMusic.setVolume(0, fadeTime);
            startMusicPlaying = false; // Set flag to false
        }

        // --- Handle Gameplay Music ---
        // If it should be playing but isn't, fade it in
        if (gameShouldPlay && !gameMusicPlaying) {
            gameBgMusic.loop();
            gameBgMusic.setVolume(1, fadeTime);
            gameMusicPlaying = true; // Set flag to true
        } 
        // If it shouldn't be playing but is, fade it out
        else if (!gameShouldPlay && gameMusicPlaying) {
            gameBgMusic.setVolume(0, fadeTime);
            gameMusicPlaying = false; // Set flag to false
        }
    }
}

// --- My helper function to reset rocks for a new game ---
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

// --- Event Handlers for user input ---
function userInteracted() {
    // This runs only ONCE on the first click/press to unlock audio
    if (!musicStarted) {
        getAudioContext().resume();
        musicStarted = true;
    }
}

function keyPressed() {
    userInteracted(); 

    if (gameState === 0) {
        gameState = 1;
        transitionAlpha = 255;
    } else if (gameState === 1) {
        gameState = 2;
    } else if (gameState === 3) {
        // Stop the one-shot poem sounds
        darkPoemSound.stop();
        goodEndSound.stop();
        
        if (finalOutcomeIsDark) {
            gameState = 2; // Restart gameplay
        } else {
            gameState = 0; // Go to start screen
        }
        redClicked = 0;
        blueClicked = 0;
        transitionAlpha = 255;
        shuffle(rectangles, true);
        resetRocks();
    }
}

function mousePressed() {
    userInteracted(); 
    
    if (gameState === 2) {
        for (let i = rectangles.length - 1; i >= 0; i--) {
            if (rectangles[i].active === true && rectangles[i].isClicked(mouseX, mouseY)) {
                rectangles[i].handleClick();
                break; 
            }
        }
    }
}

