/**
 * Wall Class: Environment boundaries
 */
class Wall {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    display() {
        rectMode(CORNER);
        noStroke();
        fill(50, 50, 60); // Dark blue-grey
        rect(this.x, this.y, this.w, this.h);
    }
}

/**
 * Item Class: The object needed for Game State 3
 */
class Item {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 25;
        this.name = "Item";
    }

    display() {
        if (gameState !== 3) return; // Only show in level 2

        fill(255, 255, 0); // Yellow
        noStroke();
        ellipse(this.x, this.y, this.size, this.size);

        fill(255);
        textAlign(CENTER);
        textSize(12);
        text(this.name, this.x, this.y - this.size / 2 - 5);
    }

    handleClick(person) {
        if (gameState !== 3) return;

        let d = dist(mouseX, mouseY, this.x, this.y);
        // Check if player clicked the item
        if (d < this.size/2) {
            person.hasItemPower = true;
        }
    }
}
