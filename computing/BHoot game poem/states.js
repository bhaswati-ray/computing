// --- Game State & Helper Functions ---

function drawNarration() {
    background(50, 50, 60); // Dark room color
    
    if (narrationScene === 0) {
        // Scene 1: Person is alone, then ghost appears
        textAlign(CENTER, CENTER);
        textSize(20);
        fill(200);
        text("The power is out. You are alone.", width / 2, height / 2 - 100);

        // Person (blue rect)
        let p = { x: width/2, y: height/2, w: 20, h: 30 };
        
        // After 1 second (60 frames), ghost appears
        if (frameCount > scene0Timer + 60) {
            // Shiver effect
            p.x += random(-1, 1);
            
            // Ghost appears
            fill(255, 50);
            ellipse(width / 2 + 150, height / 2, 80);

            // Instruction text "below"
            fill(255);
            textAlign(CENTER, BOTTOM);
            textSize(16);
            text("[Click to Continue]", width / 2, height - 30);
        }
        
        // Draw person
        fill(0, 100, 255); // Blue rect
        rectMode(CENTER);
        rect(p.x, p.y, p.w, p.h, 4);

    } else if (narrationScene === 1) {
        // Scene 2: Dial call screen
        background(20, 20, 50); // Dark blue for phone screen
        textAlign(CENTER, CENTER);
        textSize(32);
        fill(255);
        text("Phone", width/2, height/2 - 50);
        textSize(24);
        text("Call Mom", width/2, height/2);

        // Draw 'Call' button (green)
        fill(0, 180, 0);
        rectMode(CORNER);
        rect(width / 2 - 60, height / 2 + 50, 120, 40, 20);
        fill(255);
        textSize(18);
        text("Call", width / 2, height / 2 + 70);

    } else if (narrationScene === 2) {
        // Scene 3: Mom's story
        background(50, 50, 60);
        textAlign(CENTER, CENTER);
        textSize(22);
        fill(220);
        // Draw story text with wrapping
        text(story[storyIndex], 30, 50, width - 60, height - 150);
        
        // Instruction text "below"
        fill(255);
        textAlign(CENTER, BOTTOM);
        textSize(16);
        let promptText = (storyIndex >= story.length - 1) ? "[Click to learn about the ritual]" : "[Click to Continue]";
        text(promptText, width / 2, height - 30);

    } else if (narrationScene === 3) {
        // Scene 4: Bhoot Chaturdashi Lore
        background(30, 30, 40); // Even darker for lore
        textAlign(CENTER, CENTER);
        textSize(22);
        fill(220);
        // Draw story text with wrapping
        text(lore[loreIndex], 30, 50, width - 60, height - 150);
        
        // Instruction text "below"
        fill(255, 220, 0); // Golden text for final prompt
        textAlign(CENTER, BOTTOM);
        textSize(18);
        let promptText = (loreIndex >= lore.length - 1) ? lore[lore.length - 1] : "[Click to Continue]";
        text(promptText, width / 2, height - 30);
    }
}

function drawLevel1() {
    background(100); // Main game grey
    
    // Draw all static elements
    walls.forEach(wall => wall.display());
    diyas.forEach(diya => diya.display());
    
    // Update and display person
    person.update(walls);
    person.display();

    // Phase 1: Light all diyas for the first time
    if (!ghost1.isActive) {
        diyas.forEach(diya => {
            if (!diya.isLit && person.collidesWith(diya)) {
                diya.isLit = true;
            }
        });
        // Check if all are lit to activate the ghost
        if (checkAllDiyasLit()) {
            ghost1.activate();
        }
    } else { // Phase 2: Ghost is active
        ghost1.update(diyas);
        ghost1.display();

        // Check for collision
        if (ghost1.isVisible && person.collidesWith(ghost1)) {
            person.registerHit();
        }
        // Check for game over
        if (person.collisionCount >= person.MAX_COLLISIONS) {
            gameState = 5;
        }

        // Check for win condition for level 1
        if (checkAllDiyasRelit()) {
            // Small delay before next level
            fill(255, 200);
            textAlign(CENTER, CENTER);
            textSize(30);
            text("The presence changes...", width/2, height/2);
            if(frameCount % 180 == 0) { // 3 second delay
                gameState = 3; // Move to level 2
            }
        }
    }
    
    // --- Draw UI Text INSIDE canvas ---
    // Display collision count
    fill(255, 100, 100); // Red
    textAlign(LEFT, TOP);
    textSize(16);
    text(`Collisions: ${person.collisionCount} / ${person.MAX_COLLISIONS}`, 30, 30);
    
    // Display controls
    fill(200);
    textAlign(CENTER, BOTTOM);
    textSize(14);
    text("Controls: Arrow Keys to Move. Action: Mouse to Click.", width / 2, height - 10);
}

function drawLevel2() {
    background(100);
    
    // Draw all static elements
    walls.forEach(wall => wall.display());
    diyas.forEach(diya => diya.display());
    item.display(); // Display the item
    
    person.update(walls);
    person.display();

    // Activate ghost 2 if it's not already
    if (!ghost2.isActive) {
        ghost2.activate();
        // Reset the "wasUnlit" status for the new level
        diyas.forEach(d => d.wasUnlitByGhost = false);
    }

    ghost2.update(diyas);
    ghost2.display();
    
    // Check for collision
    if (ghost2.isVisible && person.collidesWith(ghost2)) {
        person.registerHit();
    }
    // Check for game over
    if (person.collisionCount >= person.MAX_COLLISIONS) {
        gameState = 5;
    }
    
    // Check for win condition
    if (checkAllDiyasRelit()) {
        gameState = 4; // Win the game
    }
    
    // --- Draw UI Text INSIDE canvas ---
    // Display collision count
    fill(255, 100, 100); // Red
    textAlign(LEFT, TOP);
    textSize(16);
    text(`Collisions: ${person.collisionCount} / ${person.MAX_COLLISIONS}`, 30, 30);

    // Show item power status
    if (person.hasItemPower) {
        fill(255, 255, 0);
        textAlign(LEFT, TOP);
        textSize(16);
        text("Item Power: READY", 30, 50); // Positioned below collision count
    }
    
    // Display controls
    fill(200);
    textAlign(CENTER, BOTTOM);
    textSize(14);
    text("Controls: Arrow Keys to Move. Action: Mouse to Click.", width / 2, height - 10);
}

function drawEndScreen(isWin) {
    // Fading effect
    background(isWin ? 20 : 0, 10);
    textAlign(CENTER, CENTER);
    
    if (isWin) {
        fill(255, 223, 0); // Gold
        textSize(40);
        text("You have survived the night.", width / 2, height / 2 - 60);
        textSize(20);
        fill(200);
        text("The first light breaks, a silent promise kept,\nYour ancestors' blessings, while the darkness slept.", width/2, height/2 + 30);
    } else {
        fill(150, 0, 0); // Dark red
        textSize(40);
        text("The Darkness Claims You.", width / 2, height / 2 - 60);
        // Show final collision count
        textSize(24);
        fill(200);
        text(`You endured ${person.collisionCount} encounters.`, width / 2, height / 2 - 20);
        
        textSize(20);
        fill(180);
        text("The whispers never leave, a shadow in the room,\nA ghost now lives with you, sealed within your gloom.", width/2, height/2 + 50);
    }
}

// Helper function to check if all 14 diyas are lit (for phase 1)
function checkAllDiyasLit() {
    return diyas.every(diya => diya.isLit);
}

// Helper function to check if all *disturbed* diyas are relit
function checkAllDiyasRelit() {
    // Get all diyas that were unlit by a ghost
    let unlitByGhosts = diyas.filter(d => d.wasUnlitByGhost);
    if (unlitByGhosts.length === 0) return false; // Don't win if no ghost has acted
    
    // Check if all of *those* are now lit
    return unlitByGhosts.every(d => d.isLit);
}
