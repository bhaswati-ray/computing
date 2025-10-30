// --- Global Game Variables ---

let person;
let ghost1, ghost2;
let item;
let walls = [];
let diyas = [];

let gameState = 1; // 1: Narration, 2: Level 1, 3: Level 2, 4: Win, 5: Lose
let narrationScene = 0; // 0: Ghost appears, 1: Call screen, 2: Mom's story, 3: Lore
let scene0Timer = 0; // Timer for narration scene 0

// Narration text
const story = [
    "Mom: 'Listen... something's wrong. The power is out everywhere.'",
    "'It's Bhoot Chaturdashi. You know the ritual. You have to do it.'",
    "'Light the Choddo Deep, the 14 diyas. For the ancestors. For protection.'",
    "'Please, be brave. I'm on my way.' [Call Ends]"
];
let storyIndex = 0;

const lore = [
    "On Bhoot Chaturdashi, the veil between worlds thins. 14 ancestors return, drawn to the homes of their descendants.",
    "But with them, other spirits, restless and dark, can also find a way in.",
    "The 14 diyas (Choddo Deep) are lit to honor the ancestors and create a circle of protection, a sacred light to keep the darkness out until dawn.",
    "[Click to Begin the Ritual]"
];
let loreIndex = 0;

// --- p5.js Core Functions ---

function setup() {
    let canvas = createCanvas(640, 480); // Canvas size
    canvas.parent('canvas-container'); // Attach canvas to the div
    scene0Timer = frameCount; // Start the timer for scene 0
    
    // Create Player
    person = new Person(width / 2, height / 2);

    // Create Ghosts (initially inactive)
    ghost1 = new Ghost1(100, 100);
    ghost2 = new Ghost2(width - 100, height - 100);

    // Create Item (initially inactive)
    item = new Item(width / 2, 50);

    // Create Walls for the room
    let wallThickness = 20;
    walls.push(new Wall(0, 0, width, wallThickness)); // Top
    walls.push(new Wall(0, height - wallThickness, width, wallThickness)); // Bottom
    walls.push(new Wall(0, 0, wallThickness, height)); // Left
    walls.push(new Wall(width - wallThickness, 0, wallThickness, height)); // Right
    // Inner walls
    walls.push(new Wall(100, 100, 250, wallThickness)); 
    walls.push(new Wall(width - 350, 100, 250, wallThickness));
    walls.push(new Wall(400, 200, wallThickness, 150));
    walls.push(new Wall(100, 450, 500, wallThickness));

    // Create 14 Diyas at random valid positions
    let diyaCount = 0;
    while(diyaCount < 14) {
        let x = random(50, width - 50);
        let y = random(50, height - 50);
        let validPos = true;
        
        // Ensure diya doesn't spawn inside a wall
        for (let wall of walls) {
            if (x > wall.x && x < wall.x + wall.w && y > wall.y && y < wall.y + wall.h) {
                validPos = false;
                break;
            }
        }

        if (validPos) {
            diyas.push(new Diya(x, y));
            diyaCount++;
        }
    }
}

function draw() {
    background(100); // Grey background (as requested)
    
    // Use a switch to manage game states
    // All draw...() functions are in states.js
    switch (gameState) {
        case 1:
            drawNarration();
            break;
        case 2:
            drawLevel1();
            break;
        case 3:
            drawLevel2();
            break;
        case 4:
            drawEndScreen(true); // Win
            break;
        case 5:
            drawEndScreen(false); // Lose
            break;
    }
}

function mousePressed() {
    if (gameState === 1) { // Narration state
        if (narrationScene === 0) {
            // Only advance if timer is up (ghost has appeared)
            if (frameCount > scene0Timer + 60) {
                narrationScene = 1;
            }
        } else if (narrationScene === 1) { // On the call screen
            let callButton = { x: width / 2 - 60, y: height / 2 + 50, w: 120, h: 40 };
            if (mouseX > callButton.x && mouseX < callButton.x + callButton.w && mouseY > callButton.y && mouseY < callButton.y + callButton.h) {
                narrationScene = 2; // Move to mom's story
            }
        } else if (narrationScene === 2) {
            storyIndex++;
            if (storyIndex >= story.length) {
                narrationScene = 3; // Move to lore
            }
        } else if (narrationScene === 3) {
            loreIndex++;
            if (loreIndex >= lore.length) {
                gameState = 2; // Start the game
            }
        }
    } else if (gameState === 2 || gameState === 3) {
        // Logic for relighting diyas by clicking
        for (let diya of diyas) {
            diya.handleClick(person);
        }
        // Logic for clicking the item in Level 2
        if (gameState === 3) {
            item.handleClick(person);
        }
    }
}
