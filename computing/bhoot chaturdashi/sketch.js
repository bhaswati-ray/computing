// BHOOT CHATURDASHI — Updated to final concept
// 7 rooms; each room has 1 lamp, 2 diyas; ghost respects room lighting rules;
// ghost blow-out affects adjacent rooms; K-spam minigame; 3 endings.

// -------- CONFIG --------
const ROOMS = 7;
const DIYAS_PER_ROOM = 2;

const ROOM_W = 120;
const ROOM_H = 300;
const ROOM_MARGIN = 14;
const START_X = 40;
const START_Y = 100;

const PLAYER_SIZE = 18;
const PLAYER_SPEED = 220; // px/sec

const SPAM_TARGET = 10;
const SPAM_WINDOW = 5000; // ms

const GHOST_BLOW_MIN = 6000; // ms
const GHOST_BLOW_MAX = 12000; // ms

// -------- STATE & ARRAYS --------
let rooms = [];
let player;
let ghost;
let pulses = []; // visual pulses when blow happens

let gameState = 0; // 0 intro, 1 gameplay, 2 ending
let endingType = null; // 'memory' | 'knowledge' | 'balanced'

let isSpamming = false;
let spamCount = 0;
let spamStart = 0;

let lastEvalTime = 0;

// -------- CLASSES --------
class Diya {
  constructor(x,y,id){
    this.x = x; this.y = y; this.r = 7;
    this.isLit = false;
    this.memId = id; // index for memory fragments if needed
  }
  draw(){
    noStroke();
    if (this.isLit){
      fill(255,160,80);
      ellipse(this.x,this.y,this.r*2+2);
      fill(255,230,140);
      ellipse(this.x,this.y-6,6,10);
    } else {
      fill(50);
      ellipse(this.x,this.y,this.r*2);
    }
  }
}

class Lamp {
  constructor(x,y){
    this.x = x; this.y = y; this.w = 20; this.h = 36;
    this.isOn = false;
  }
  draw(){
    rectMode(CENTER);
    fill(this.isOn ? color(255,240,200) : color(60));
    rect(this.x,this.y,this.w,this.h,3);
    fill(this.isOn ? color(255,220,120) : color(30));
    ellipse(this.x,this.y - this.h/2 - 6,8,8);
  }
}

class Room {
  constructor(i, x, y, w, h){
    this.id = i; this.x = x; this.y = y; this.w = w; this.h = h;
    this.lamp = new Lamp(this.x + this.w - 30, this.y + 36);
    this.diyas = [];
    for (let d=0; d<DIYAS_PER_ROOM; d++){
      this.diyas.push(new Diya(this.x + 18 + d*24, this.y + this.h - 40, i*DIYAS_PER_ROOM + d));
    }
    this.visited = false;
  }
  lightLevel(){
    // per your rules:
    // 2 -> lamp on OR 2 diyas lit
    // 1 -> exactly one diya lit
    // 0 -> none
    if (this.lamp.isOn) return 2;
    const lit = this.diyas.filter(d=>d.isLit).length;
    return lit; // 0,1,2
  }
  draw(){
    // room background
    push();
    stroke(90);
    fill(20);
    rect(this.x,this.y,this.w,this.h,8);
    pop();
    // draw lamp and diyas
    this.lamp.draw();
    for (let d of this.diyas) d.draw();
  }
}

class Player {
  constructor(x,y){
    this.x = x; this.y = y; this.size = PLAYER_SIZE;
    this.roomIndex = 0;
  }
  draw(){
    rectMode(CENTER);
    fill(120,200,255);
    rect(this.x,this.y,this.size,this.size);
  }
  update(dt){
    let vx=0, vy=0;
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) vx -= 1;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) vx += 1;
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) vy -= 1;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) vy += 1;
    if (vx!==0 || vy!==0){
      const mag = sqrt(vx*vx + vy*vy);
      vx/=mag; vy/=mag;
      this.x += vx * PLAYER_SPEED * dt;
      this.y += vy * PLAYER_SPEED * dt;
      // clamp
      this.x = constrain(this.x, 0, width);
      this.y = constrain(this.y, 0, height);
    }
    // update room index
    for (let i=0;i<rooms.length;i++){
      const r = rooms[i];
      if (this.x >= r.x && this.x <= r.x + r.w) {
        this.roomIndex = i; r.visited = true; break;
      }
    }
  }
  distTo(obj){
    return dist(this.x,this.y,obj.x,obj.y);
  }
}

class Ghost {
  constructor(x,y){
    this.x = x; this.y = y; this.r = 16;
    this.speed = 40;
    this.blowTimer = millis() + random(GHOST_BLOW_MIN, GHOST_BLOW_MAX);
    this.active = true;
  }
  update(dt){
    // choose target: nearest room with lightLevel 0 (dark). If none, then nearest room with level 1.
    let darkRooms = rooms.filter(r => r.lightLevel() === 0);
    let weakRooms = rooms.filter(r => r.lightLevel() === 1);
    let targetRoom = null;
    if (darkRooms.length > 0){
      // pick nearest dark room center
      let bestD = 1e9;
      for (let r of darkRooms){
        const cx = r.x + r.w/2, cy = r.y + r.h/2;
        const d = dist(this.x,this.y,cx,cy);
        if (d < bestD){ bestD = d; targetRoom = r; bestD = d; }
      }
    } else if (weakRooms.length > 0){
      let bestD = 1e9;
      for (let r of weakRooms){
        const cx = r.x + r.w/2, cy = r.y + r.h/2;
        const d = dist(this.x,this.y,cx,cy);
        if (d < bestD){ bestD = d; targetRoom = r; bestD = d; }
      }
    } else {
      // nowhere to be; fade near boundary, drift slowly
      this.x += random(-0.2,0.2) * dt * 60;
      this.y += random(-0.2,0.2) * dt * 60;
      targetRoom = null;
    }

    if (targetRoom){
      // ensure we do not enter rooms with lightLevel >=2
      // if targetRoom has level >=2, instead drift around edge (shouldn't happen since filter above)
      // move toward center but stop if room is strongly lit
      const cx = targetRoom.x + targetRoom.w/2, cy = targetRoom.y + targetRoom.h/2;
      const dx = cx - this.x, dy = cy - this.y;
      const d = sqrt(dx*dx + dy*dy);
      if (d > 1){
        // speed scales: stronger when more dark rooms exist
        const darkCount = rooms.filter(r=>r.lightLevel()===0).length;
        const sp = this.speed * (1 + 0.08 * darkCount);
        this.x += (dx/d) * sp * dt;
        this.y += (dy/d) * sp * dt;
      }
    }

    // clamp inside play area
    this.x = constrain(this.x, 10, width - 10);
    this.y = constrain(this.y, 10, height - 10);

    // blow-out timer
    if (millis() > this.blowTimer){
      this.blowTimer = millis() + random(GHOST_BLOW_MIN, GHOST_BLOW_MAX);
      this.blowOutAdjacent();
    }
  }

  blowOutAdjacent(){
    // find nearest room index to ghost
    let idx = 0; let bestD = 1e9;
    for (let i=0;i<rooms.length;i++){
      const r = rooms[i];
      const cx = r.x + r.w/2, cy = r.y + r.h/2;
      const d = dist(this.x,this.y,cx,cy);
      if (d < bestD){ bestD = d; idx = i; }
    }
    // pick one adjacent index (left or right) if exists
    let choices = [];
    if (idx > 0) choices.push(idx-1);
    if (idx < rooms.length - 1) choices.push(idx+1);
    if (choices.length === 0) return;
    const targetIdx = random(choices);
    const targetRoom = rooms[targetIdx];

    // blow out one random lit diya in that target room (if any)
    const litDiyas = targetRoom.diyas.filter(d=>d.isLit);
    if (litDiyas.length > 0){
      const choice = random(litDiyas);
      // blow out with high probability
      if (random() < 0.9){
        choice.isLit = false;
        pulses.push(new Pulse(choice.x, choice.y));
      }
    } else {
      // if no diya to blow, do nothing (ghost can't blow lamp)
      // slight visual pulse at center of room anyway
      pulses.push(new Pulse(targetRoom.x + targetRoom.w/2, targetRoom.y + targetRoom.h/2));
    }
  }

  draw(){
    // ghost fades in lit areas (if ghost sits in a room where lightLevel >=2, it should not exist there)
    // we clip visibility when overlapping fully lit rooms when rendering world; caller will compute
    push();
    noStroke();
    fill(220,90,160, 200);
    ellipse(this.x, this.y, this.r*2);
    pop();
  }
}

class Pulse {
  constructor(x,y){
    this.x = x; this.y = y; this.t = 0; this.duration = 600;
  }
  update(dt){
    this.t += dt*1000;
  }
  draw(){
    push();
    noFill();
    stroke(210,180,150, map(1 - this.t/this.duration, 0, 1, 0, 220));
    strokeWeight(2);
    const s = map(this.t, 0, this.duration, 0, 160);
    ellipse(this.x, this.y, s);
    pop();
  }
  done(){ return this.t > this.duration; }
}

// -------- SETUP & RESET --------
function setup(){
  createCanvas(1000, 480);
  resetGame();
  textFont('Georgia');
}

function resetGame(){
  rooms = [];
  pulses = [];
  // create 7 rooms in a row
  for (let i=0;i<ROOMS;i++){
    const rx = START_X + i * (ROOM_W + ROOM_MARGIN);
    rooms.push(new Room(i, rx, START_Y, ROOM_W, ROOM_H));
  }
  // player starts in first room center
  player = new Player(rooms[0].x + rooms[0].w/2, rooms[0].y + rooms[0].h/2);
  // ghost starts at last room center
  ghost = new Ghost(rooms[ROOMS-1].x + rooms[ROOMS-1].w/2, rooms[ROOMS-1].y + rooms[ROOMS-1].h/2);
  isSpamming = false; spamCount = 0; spamStart = 0; endingType = null;
  gameState = 0;
  lastEvalTime = millis();
}

// -------- DRAW LOOP --------
let last = 0;
function draw(){
  const now = millis();
  const dt = (last === 0) ? 0.016 : (now - last) / 1000;
  last = now;

  background(12);

  if (gameState === 0){
    drawIntro();
    return;
  }

  // update
  player.update(dt);
  ghost.update(dt);

  // enforce ghost cannot exist inside fully lit rooms (if it enters, nudge it out)
  enforceGhostPresence();

  // update pulses
  for (let p of pulses) p.update(dt);
  pulses = pulses.filter(p=>!p.done());

  // K-SPAM check: if ghost close and player's room lightLevel <=1 and not already spamming
  const distPG = dist(player.x, player.y, ghost.x, ghost.y);
  const playerRoom = rooms[player.roomIndex];
  const playerLight = playerRoom.lightLevel();
  if (!isSpamming && distPG < 48 && playerLight <= 1 && gameState === 1){
    startSpam();
  }

  // draw rooms and their contents
  for (let r of rooms) r.draw();

  // draw lighting overlays (lamps and diyas)
  for (let r of rooms){
    if (r.lamp.isOn) drawLight(r.lamp.x, r.lamp.y - 12, 160, 200);
    for (let d of r.diyas) if (d.isLit) drawLight(d.x, d.y - 2, 70, 140);
  }

  // draw pulses
  for (let p of pulses) p.draw();

  // draw ghost but fade/avoid rendering inside fully lit rooms: if ghost is currently inside region of lightLevel>=2, fade
  let ghostRoomIdx = ghostRoomIndex();
  let ghostVisible = true;
  if (ghostRoomIdx !== null){
    let lv = rooms[ghostRoomIdx].lightLevel();
    if (lv >= 2) ghostVisible = false; // ghost cannot exist there
  }
  // If player's choice allows ghost to linger at edges when lightLevel==1, ghost can be near edges
  if (ghostVisible) ghost.draw();

  // draw player
  player.draw();

  // draw UI
  drawUI();

  // check completion: when all rooms visited and some time passed OR when all diyas/lamp configuration done
  // We'll evaluate after a short buffer so the player sees final state
  if (millis() - lastEvalTime > 300 && gameState === 1){
    const allVisited = rooms.every(r => r.visited);
    if (allVisited) {
      evaluateEnding();
    }
  }
}

// -------- HELPERS & INTERACTIONS --------
function drawIntro(){
  push();
  fill(255);
  textAlign(CENTER);
  textSize(26);
  text("BHOOT CHATURDASHI", width/2, height/2 - 50);
  textSize(14);
  text("Press any key to begin — sip your tea, watch Diwali outside, then the call: 'Light your rooms.'", width/2, height/2 - 20);
  pop();
}

// toggle lamp when pressing SPACE near lamp; light nearest diya with 'A'
function keyPressed(){
  if (gameState === 0){
    gameState = 1; lastEvalTime = millis();
    return;
  }
  if (isSpamming){
    if (key.toLowerCase() === 'k'){
      spamCount++;
      if (spamCount >= SPAM_TARGET) resolveSpamSuccess();
    }
    return;
  }
  if (gameState === 1){
    if (key === ' '){
      // toggle lamp if close
      const r = rooms[player.roomIndex];
      const L = r.lamp;
      if (dist(player.x, player.y, L.x, L.y) < 36){
        L.isOn = !L.isOn;
        // immediate effect: if lamp turned on, ghost cannot exist in that room
        // small hint
      }
    } else if (key.toLowerCase() === 'a'){
      // light nearest diya if in range
      let nearest = null; let md = 1e9;
      for (let d of rooms[player.roomIndex].diyas){
        const dd = dist(player.x, player.y, d.x, d.y);
        if (dd < md){ md = dd; nearest = d; }
      }
      if (nearest && md < 36 && !nearest.isLit){
        nearest.isLit = true;
        // memory reveal could be queued here
      }
    } else if (key.toLowerCase() === 'r'){
      resetGame();
    }
  } else if (gameState === 2){
    if (key.toLowerCase() === 'r') resetGame();
  }
}

// small radial light drawing
function drawLight(cx, cy, radius, alpha){
  push();
  const g = drawingContext;
  const grad = g.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, `rgba(255,220,150,${alpha/255})`);
  grad.addColorStop(0.6, `rgba(90,50,20,${alpha/600})`);
  grad.addColorStop(1, `rgba(0,0,0,0)`);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, radius, 0, TWO_PI);
  g.fill();
  pop();
}

// determine which room index ghost is currently inside (null if none)
function ghostRoomIndex(){
  for (let i=0;i<rooms.length;i++){
    const r = rooms[i];
    if (ghost.x >= r.x && ghost.x <= r.x + r.w && ghost.y >= r.y && ghost.y <= r.y + r.h) return i;
  }
  return null;
}

// ensure ghost doesn't stay inside fully lit rooms
function enforceGhostPresence(){
  const idx = ghostRoomIndex();
  if (idx !== null){
    const lv = rooms[idx].lightLevel();
    if (lv >= 2){
      // nudge ghost away: move to nearest allowed room (left or right)
      // find nearest room with level < 2
      let targetIdx = null; let bestD = 1e9;
      for (let i=0;i<rooms.length;i++){
        if (rooms[i].lightLevel() < 2){
          const cx = rooms[i].x + rooms[i].w/2;
          const d = abs(i - idx);
          if (d < bestD){ bestD = d; targetIdx = i; }
        }
      }
      if (targetIdx !== null){
        // teleport gently to target room edge
        const rt = rooms[targetIdx];
        // place ghost near center of target room
        ghost.x = rt.x + rt.w/2 + random(-20,20);
        ghost.y = rt.y + rt.h/2 + random(-20,20);
      } else {
        // nowhere allowed -> fade position out to outside
        ghost.x = constrain(ghost.x + random(-10,10), 10, width-10);
        ghost.y = constrain(ghost.y + random(-10,10), 10, height-10);
      }
    } else if (lv === 1){
      // linger near edge: gently push ghost to nearest room edge
      const r = rooms[idx];
      const cx = r.x + r.w/2;
      const leftEdge = r.x - 10, rightEdge = r.x + r.w + 10;
      const edgeX = (ghost.x < cx) ? leftEdge : rightEdge;
      ghost.x = lerp(ghost.x, edgeX, 0.06);
    }
  }
}

// K-SPAM handling
function startSpam(){
  isSpamming = true;
  spamCount = 0;
  spamStart = millis();
}

function resolveSpamSuccess(){
  isSpamming = false;
  // reward: reduce ghost speed and light-up a small nearby diya sometimes
  ghost.speed = max(20, ghost.speed * 0.85);
  // light nearest unlit diya in player's room if any
  const r = rooms[player.roomIndex];
  const candidates = r.diyas.filter(d => !d.isLit);
  if (candidates.length > 0 && random() < 0.6){
    random(candidates).isLit = true;
  }
}

function resolveSpamFail(){
  isSpamming = false;
  // penalty: increase ghost speed and maybe blow out a random lit diya globally
  ghost.speed *= 1.12;
  const lit = [];
  for (let rr of rooms) for (let d of rr.diyas) if (d.isLit) lit.push(d);
  if (lit.length > 0) {
    random(lit).isLit = false;
  }
}

// evaluate ending logic
function evaluateEnding(){
  lastEvalTime = millis();
  // count lamps vs diyas
  const lampCount = rooms.filter(r=>r.lamp.isOn).length;
  const diyaCount = rooms.reduce((sum, r)=> sum + r.diyas.filter(d=>d.isLit).length, 0);
  // determine thresholds
  if (diyaCount > lampCount * 1.2) endingType = 'memory';
  else if (lampCount > diyaCount * 1.2) endingType = 'knowledge';
  else endingType = 'balanced';
  gameState = 2; // move to ending state
}

// draw UI
function drawUI(){
  push();
  fill(255);
  textAlign(LEFT);
  textSize(13);
  const lampCount = rooms.filter(r=>r.lamp.isOn).length;
  const diyaCount = rooms.reduce((sum, r)=> sum + r.diyas.filter(d=>d.isLit).length, 0);
  text(`Room ${player.roomIndex + 1}/${ROOMS}`, 10, 18);
  text(`Lamps: ${lampCount}`, 10, 36);
  text(`Diyas: ${diyaCount}`, 10, 54);
  if (isSpamming){
    // show spam UI
    textAlign(CENTER);
    textSize(16);
    text(`K-SPAM! Press K rapidly: ${spamCount}/${SPAM_TARGET}`, width/2, 24);
    // check timeout
    if (millis() - spamStart > SPAM_WINDOW) {
      resolveSpamFail();
    }
  } else {
    textAlign(RIGHT);
    text("Space: lamp | A: light diya | K: spam | R: restart", width - 10, 18);
  }
  pop();
}

// draw ending overlay
function drawEnding(){
  push();
  fill(0,200);
  rect(0,0,width,height);
  textAlign(CENTER);
  fill(255);
  textSize(26);
  if (endingType === 'memory'){
    text("Memory Ending", width/2, 120);
    textSize(14);
    text("You revived the memories — the mother's warmth lives in the lamps.", width/2, 160);
  } else if (endingType === 'knowledge'){
    text("Knowledge Ending", width/2, 120);
    textSize(14);
    text("You turned on the lights of reason — rituals are understood now.", width/2, 160);
  } else {
    text("Balanced Ending", width/2, 120);
    textSize(14);
    text("You held memory and knowledge together — tradition with clarity.", width/2, 160);
  }
  textSize(12);
  const lampCount = rooms.filter(r=>r.lamp.isOn).length;
  const diyaCount = rooms.reduce((sum, r)=> sum + r.diyas.filter(d=>d.isLit).length, 0);
  text(`Lamps: ${lampCount}  •  Diyas: ${diyaCount}`, width/2, 210);
  text("Press R to restart", width/2, height - 60);
  pop();
}

// pulses draw handled in draw loop; update pulses each frame
// additional draw() adjustments to show pulses and maybe end screen

// --------- finalize draw to include pulses & ending ----------
// we replace the base draw above to include final overlay and pulses drawing
// adjust final draw by wrapping into main draw loop after updates

// (Note: we used a simplified approach: draw() above already draws world and UI. Now
// we need to ensure pulses are drawn and ending overlay is shown when gameState == 2.)

// We will override draw() to include pulses rendering and ending overlay:
function draw() {
  const now = millis();
  const dt = (last === 0) ? 0.016 : (now - last) / 1000;
  last = now;

  background(12);

  if (gameState === 0){
    drawIntro();
    return;
  }

  // update logic
  player.update(dt);
  ghost.update(dt);
  enforceGhostPresence();

  // update pulses
  for (let p of pulses) p.update(dt);
  pulses = pulses.filter(p => !p.done());

  // draw world: rooms -> lights -> ghost -> player -> pulses -> UI
  for (let r of rooms) r.draw();
  for (let r of rooms){
    if (r.lamp.isOn) drawLight(r.lamp.x, r.lamp.y - 12, 160, 200);
    for (let d of r.diyas) if (d.isLit) drawLight(d.x, d.y - 2, 70, 140);
  }

  // ghost visibility
  let ghostIdx = ghostRoomIndex();
  let ghostVisible = true;
  if (ghostIdx !== null && rooms[ghostIdx].lightLevel() >= 2) ghostVisible = false;
  if (ghostVisible) ghost.draw();

  // pulses draw (on top of ghost to show blow)
  for (let p of pulses) p.draw();

  player.draw();
  drawUI();

  // check spam start (already in earlier code)
  const distPG = dist(player.x, player.y, ghost.x, ghost.y);
  const playerLight = rooms[player.roomIndex].lightLevel();
  if (!isSpamming && distPG < 48 && playerLight <= 1 && gameState === 1){
    startSpam();
  }

  // evaluate progression: all rooms visited -> evaluate ending
  const allVisited = rooms.every(r => r.visited);
  if (allVisited && gameState === 1 && millis() - lastEvalTime > 400){
    evaluateEnding();
  }

  // if ending state, show overlay
  if (gameState === 2){
    drawEnding();
  }
}

// restart key
function keyTyped(){
  if (key.toLowerCase() === 'r') resetGame();
}

// EOF
