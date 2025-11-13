// --- Global Game Variables ---
let person;
let ghosts = [];
let phone;
let walls = [];
let diyas = [];
let lightSwitches = [];

// Game State Management
let gameState = 0; // 0: Intro, 1: Maze, 2: Ritual, 3: Win, 4: Lose
let introScene = 0; // 0: Start, 1: Black, 2: Ghost
let introTimer = 0;
let introOpacity = 0;

let lives = 3;
let hintCount = 0;
let hintText = "";
let diyasLit = 0;
let switchesActivated = 0;

// Spam Mini-Game Variables
let isSpamming = false;
const SPAM_KEY = 'k';
const SPAM_TARGET = 10;
const SPAM_DURATION = 7; // 7 seconds
let spamCount = 0;
let spamTimer = 0;


// --- p5.js Core Functions ---
function setup() {
    let canvas = createCanvas(640, 480);
    canvas.parent('canvas-container');
    
    person = new Person(50, 50);

    // Create Maze (4-room maze with doors)
    let wallThickness = 20;
    walls.push(new Wall(0, 0, width, wallThickness)); // Top
    walls.push(new Wall(0, height - wallThickness, width, wallThickness)); // Bottom
    walls.push(new Wall(0, 0, wallThickness, height)); // Left
    walls.push(new Wall(width - wallThickness, 0, wallThickness, height)); // Right
    walls.push(new Wall(width/2 - wallThickness/2, wallThickness, wallThickness, height/2 - 70));
    walls.push(new Wall(width/2 - wallThickness/2, height/2 + 50, wallThickness, height/2 - wallThickness - 50));
    walls.push(new Wall(wallThickness, height/2 - wallThickness/2, width/2 - 70, wallThickness));
    walls.push(new Wall(width/2 + 50, height/2 - wallThickness/2, width/2 - wallThickness - 50, wallThickness));
    walls.push(new Wall(150, wallThickness, wallThickness, 150));
    walls.push(new Wall(80, 150, 70 + wallThickness, wallThickness));
    walls.push(new Wall(wallThickness, 350, 150, wallThickness));
    walls.push(new Wall(150, 300, wallThickness, 50));
    walls.push(new Wall(150, 410, wallThickness, 50));
    walls.push(new Wall(width - 150, wallThickness, wallThickness, 150));
    walls.push(new Wall(width - 220, 150, 140, wallThickness));
    walls.push(new Wall(width - 150, 300, wallThickness, 160));
    walls.push(new Wall(width - 220, 300, 70 + wallThickness, wallThickness));

    phone = new Phone(width / 2, height / 2);
    
    // Create 2 Light Switches
    lightSwitches.push(new LightSwitch(wallThickness, height / 2 - 12)); // Left wall
    lightSwitches.push(new LightSwitch(width - wallThickness - 10, height / 2 - 12)); // Right wall
    
    // Create 7 Ghosts
    for(let i = 0; i < 7; i++) {
         ghosts.push(new WanderingGhost(random(50, width-50), random(50, height-50), `Ghost ${i+1}`));
    }

    // Create 14 Diyas NOT in the hallways
    let diyaCount = 0;
    while(diyaCount < 14) {
        let x = random(50, width - 50);
        let y = random(50, height - 50);
        let validPos = true;
        
        // Check for wall collision
        for (let wall of walls) {
            if (x > wall.x && x < wall.x + wall.w && y > wall.y && y < wall.y + wall.h) {
                validPos = false;
                break;
            }
        }
        if (!validPos) continue;
        
        // Check for hallway collision
        let inVerticalHall = (x > width/2 - wallThickness/2 - 20 && x < width/2 + wallThickness/2 + 20);
        let inHorizontalHall = (y > height/2 - wallThickness/2 - 20 && y < height/2 + wallThickness/2 + 20);
        if (inVerticalHall || inHorizontalHall) {
            validPos = false;
        }
        
        // Check for phone collision
        if (dist(x, y, phone.x, phone.y) < 40) {
            validPos = false;
        }

        if (validPos) {
            diyas.push(new Diya(x, y));
            diyaCount++;
        }
    }
}

function draw() {
    if (isSpamming) {
        drawSpamMinigame();
    } else {
        switch (gameState) {
            case 0: drawIntroSequence(); break;
            case 1: drawLevel1(); break;
            case 2: drawLevel2(); break;
            case 3: drawEndScreen(true); break; // Win
            case 4: drawEndScreen(false); break; // Lose
        }
    }
}

function mousePressed() {
    // No mouse actions in this version
}

function keyPressed() {
    if (gameState === 0) {
        if (introScene === 0) {
            introScene = 1;
            introTimer = frameCount; // Start timer for black screen
        }
    } else if (isSpamming) {
        if (key.toLowerCase() === SPAM_KEY) {
            spamCount++;
        }
    } else if (gameState === 2) {
         // Light nearest diya with 'A'
        if (key.toLowerCase() === 'a') {
            lightNearestDiya();
        }
    }
}