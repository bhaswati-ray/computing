// sketch.js — Away From Home (updated: Start & Replay clickable buttons)

// ---------------- CONFIG ----------------
const ROOMS = 7;
const DIYAS_PER_ROOM = 2;
const PLAYER_LIVES_START = 3;

const ROOM_W = 120;
const ROOM_H = 280;
const ROOM_MARGIN = 18;
const START_X = 36;
const START_Y = 100;

const PLAYER_SPEED = 220; // px/sec
const PULL_RANGE = 48;

const SPAM_TARGET = 10;
const SPAM_WINDOW = 5000; // ms

const GHOST_COUNT = 5;
const GHOST_PULSE_MIN = 40000; // ms (40s)
const GHOST_PULSE_MAX = 50000; // ms (50s)

// Tint levels
const TINT_FULL = 0.15; // 15% black
const TINT_NEAR = 0.05; // 5% black

// ---------------- GLOBALS ----------------
let rooms = [];
let player;
let ghosts = [];
let pulses = []; // pulse visuals when ghost blows
let gameState = 0; // 0: start, 1: intro frames, 2: map, 3: result
let introIndex = 0;
let introTimer = 0;
let frameDuration = 1800; // ms per intro frame
let lives = PLAYER_LIVES_START;
let pulling = false;
let pullGhost = null;
let spamCount = 0;
let spamStart = 0;
let endingType = null; // 'memory'|'knowledge'|'balanced'|'dead'
let memoryFrames = []; // for diyas memory sequence
let lastEval = 0;

// Button bounds (centered)
const BTN_W = 180;
const BTN_H = 56;
let btnX, btnY;

// ---------------- CLASSES ----------------
class Diya {
  constructor(x,y,id){ this.x=x; this.y=y; this.r=7; this.isLit=false; this.id=id; }
  draw(){
    noStroke();
    if(this.isLit){ fill(255,170,90); ellipse(this.x,this.y,this.r*2+2); fill(255,230,140); ellipse(this.x,this.y-6,6,10); }
    else { fill(40); ellipse(this.x,this.y,this.r*2); }
  }
}

class Lamp {
  constructor(x,y){ this.x=x; this.y=y; this.w=20; this.h=36; this.isOn=false; }
  draw(){
    rectMode(CENTER);
    fill(this.isOn ? color(255,240,200) : color(60));
    rect(this.x,this.y,this.w,this.h,3);
    fill(this.isOn ? color(255,220,120) : color(30));
    ellipse(this.x,this.y - this.h/2 - 6,8,8);
  }
}

class Room {
  constructor(i,x,y,w,h){
    this.id=i; this.x=x; this.y=y; this.w=w; this.h=h;
    this.lamp = new Lamp(this.x + this.w - 28, this.y + 36);
    this.diyas = [];
    for(let d=0; d<DIYAS_PER_ROOM; d++){
      this.diyas.push(new Diya(this.x + 18 + d*26, this.y + this.h - 46, i*DIYAS_PER_ROOM + d));
    }
    this.visited = false;
  }
  lightLevel(){
    if(this.lamp.isOn) return 2;
    const lit = this.diyas.filter(d=>d.isLit).length;
    return lit; // 0,1,2
  }
  draw(){
    // room base
    push();
    stroke(90); fill(18); rect(this.x, this.y, this.w, this.h, 8);
    pop();
    // draw lamp & diyas
    this.lamp.draw();
    for(let d of this.diyas) d.draw();
    // draw tint overlay according to rules
    let lvl = this.lightLevel();
    if(lvl === 0){ fill(0, 255 * TINT_FULL); rect(this.x, this.y, this.w, this.h, 8); }
    else if(lvl === 1){ fill(0, 255 * TINT_NEAR); rect(this.x, this.y, this.w, this.h, 8); }
    // if lvl >=2 no tint
  }
}

class Player {
  constructor(x,y){ this.x=x; this.y=y; this.w=18; this.h=18; this.roomIndex=0; }
  draw(){ rectMode(CENTER); fill(140,210,255); rect(this.x,this.y,this.w,this.h); }
  update(dt){
    let vx=0,vy=0;
    if(keyIsDown(65) || keyIsDown(LEFT_ARROW)) vx -= 1;
    if(keyIsDown(68) || keyIsDown(RIGHT_ARROW)) vx += 1;
    if(keyIsDown(87) || keyIsDown(UP_ARROW)) vy -= 1;
    if(keyIsDown(83) || keyIsDown(DOWN_ARROW)) vy += 1;
    if(vx!==0 || vy!==0){
      let mag = sqrt(vx*vx + vy*vy); vx/=mag; vy/=mag;
      this.x += vx * PLAYER_SPEED * dt; this.y += vy * PLAYER_SPEED * dt;
      this.x = constrain(this.x, 0, width); this.y = constrain(this.y, 0, height);
    }
    for(let i=0;i<rooms.length;i++){
      let r=rooms[i];
      if(this.x >= r.x && this.x <= r.x + r.w) { this.roomIndex = i; r.visited = true; break; }
    }
  }
}

class Ghost {
  constructor(x,y){
    this.x=x; this.y=y; this.r=14; this.speed = random(32,48);
    this.nextPulse = millis() + random(GHOST_PULSE_MIN, GHOST_PULSE_MAX);
    this.attached = false;
  }
  update(dt){
    let darkRooms = rooms.filter(r=>r.lightLevel()===0);
    let weakRooms = rooms.filter(r=>r.lightLevel()===1);
    let target = null;
    if(darkRooms.length > 0){
      let best=1e9;
      for(let r of darkRooms){ let cx=r.x+r.w/2, cy=r.y+r.h/2; let d=dist(this.x,this.y,cx,cy); if(d<best){best=d;target=r;} }
    } else if(weakRooms.length > 0){
      let best=1e9;
      for(let r of weakRooms){ let cx=r.x+r.w/2, cy=r.y+r.h/2; let d=dist(this.x,this.y,cx,cy); if(d<best){best=d;target=r;} }
    } else {
      this.x += random(-0.3,0.3)*dt*60; this.y += random(-0.3,0.3)*dt*60;
    }
    if(target){
      let cx=target.x+target.w/2, cy=target.y+target.h/2;
      let dx=cx-this.x, dy=cy-this.y; let d = sqrt(dx*dx + dy*dy);
      if(d>1){ let adj = this.speed*(1 + 0.06*rooms.filter(r=>r.lightLevel()===0).length); this.x += (dx/d)*adj*dt; this.y += (dy/d)*adj*dt; }
    }
    this.x = constrain(this.x, 10, width-10); this.y = constrain(this.y, 10, height-10);
    if(millis() > this.nextPulse){ this.nextPulse = millis() + random(GHOST_PULSE_MIN, GHOST_PULSE_MAX); this.pulseAdjacent(); }
  }
  pulseAdjacent(){
    let idx=0, best=1e9;
    for(let i=0;i<rooms.length;i++){ let r=rooms[i]; let cx=r.x+r.w/2, cy=r.y+r.h/2; let d=dist(this.x,this.y,cx,cy); if(d<best){best=d;idx=i;} }
    let choices = []; if(idx>0) choices.push(idx-1); if(idx<rooms.length-1) choices.push(idx+1);
    if(choices.length===0) return;
    let targetIdx = random(choices);
    let room = rooms[targetIdx];
    let lit = room.diyas.filter(d=>d.isLit);
    let toBlow = min(2, lit.length);
    for(let i=0;i<toBlow;i++){
      let pick = random(lit);
      pick.isLit = false;
      pulses.push(new Pulse(pick.x, pick.y));
      lit = lit.filter(ld => ld !== pick);
    }
    if(toBlow===0) pulses.push(new Pulse(room.x + room.w/2, room.y + room.h/2));
  }
  draw(){ push(); noStroke(); fill(220,80,160, 200); ellipse(this.x, this.y, this.r*2); pop(); }
}

class Pulse { constructor(x,y){ this.x=x; this.y=y; this.t=0; this.dur=600; } update(dt){ this.t += dt*1000; } draw(){ push(); noFill(); stroke(220,180,140, map(1 - this.t/this.dur,0,1,0,220)); strokeWeight(2); ellipse(this.x,this.y, map(this.t,0,this.dur,0,160)); pop(); } done(){ return this.t > this.dur; } }

// ---------------- SETUP ----------------
function setup(){
  createCanvas(1000, 520);
  textFont('Georgia');
  btnX = width/2; btnY = height/2 + 20;
  resetAll();
}

function resetAll(){
  rooms = []; ghosts = []; pulses = [];
  for(let i=0;i<ROOMS;i++){
    let rx = START_X + i*(ROOM_W + ROOM_MARGIN);
    rooms.push(new Room(i, rx, START_Y, ROOM_W, ROOM_H));
  }
  player = new Player(rooms[0].x + rooms[0].w/2, rooms[0].y + rooms[0].h/2);
  for(let i=0;i<GHOST_COUNT;i++){
    let gx = rooms[ROOMS-1].x + rooms[ROOMS-1].w/2 + random(-20,20);
    let gy = rooms[ROOMS-1].y + rooms[ROOMS-1].h/2 + random(-20,20);
    ghosts.push(new Ghost(gx, gy));
  }
  lives = PLAYER_LIVES_START; pulling = false; pullGhost = null; spamCount = 0; spamStart = 0;
  gameState = 0; introIndex = 0; introTimer = millis();
  lastEval = millis();
  memoryFrames = [
    { type:'mom',  draw: ()=>{ push(); translate(-40,0); fill(255,200,100); ellipse(width/2 - 40, 220, 80); fill(140,210,255); rect(width/2 + 40, 220, 70,44); pop(); } },
    { type:'lighting', draw: ()=>{ fill(255,200,80); ellipse(width/2 - 40, 220, 64); fill(255,170,80); ellipse(width/2 + 40, 220, 12); } },
    { type:'happy', draw: ()=>{ fill(140,210,255); rect(width/2 - 40, 220, 70,44); fill(255,200,100); ellipse(width/2 + 40, 220, 64); } },
    { type:'poem', draw: ()=>{ fill(255); textAlign(CENTER); textSize(16); text('"Even silly lights tie us — they keep hands together at night."', width/2, 260); } }
  ];
}

// ---------------- DRAW ----------------
let lastMillis = 0;
function draw(){
  let now = millis(); let dt = (lastMillis === 0) ? 0.016 : (now - lastMillis)/1000; lastMillis = now;
  background(12);

  if(gameState === 0){ drawStartScreen(); return; }
  if(gameState === 1){ drawIntro(dt); return; }

  // gameplay state 2
  player.update(dt);
  for(let g of ghosts) g.update(dt);
  for(let p of pulses) p.update(dt);
  pulses = pulses.filter(p=>!p.done());
  enforceGhostRules();

  // check pull
  let nearest=null, nd=1e9;
  for(let g of ghosts){ let d = dist(player.x, player.y, g.x, g.y); if(d<nd){ nd=d; nearest=g; } }
  let pr = rooms[player.roomIndex];
  if(!pulling && nearest && nd < PULL_RANGE && pr.lightLevel() <= 1){ pulling = true; pullGhost = nearest; spamCount = 0; spamStart = millis(); }

  if(pulling){
    if(spamCount >= SPAM_TARGET){ pulling=false; pullGhost.x += random(-120,120); pullGhost.y += random(-120,120); spamCount=0; spamStart=0; if(random()<0.5){ let cand=pr.diyas.filter(d=>!d.isLit); if(cand.length>0) random(cand).isLit = true; } }
    else if(millis() - spamStart > SPAM_WINDOW){ pulling=false; pullGhost.x += random(-80,80); pullGhost.y += random(-80,80); lives -= 1; spamCount=0; spamStart=0; if(lives <= 0){ endingType = 'dead'; gameState = 3; } }
  }

  for(let r of rooms) r.draw();
  for(let r of rooms){ if(r.lamp.isOn) drawLight(r.lamp.x, r.lamp.y - 12, 170, 200); for(let d of r.diyas) if(d.isLit) drawLight(d.x, d.y - 2, 70, 140); }
  for(let p of pulses) p.draw();
  for(let g of ghosts){ let gi = ghostRoomIndex(g); if(gi !== null && rooms[gi].lightLevel() >= 2){} else g.draw(); }
  player.draw();
  drawUI();

  const allVisited = rooms.every(r => r.visited);
  const allDiyas = rooms.reduce((s,r)=> s + r.diyas.filter(d=>d.isLit).length, 0) === ROOMS * DIYAS_PER_ROOM;
  const allLamps = rooms.filter(r=>r.lamp.isOn).length === ROOMS;
  if((allVisited || allDiyas || allLamps) && millis() - lastEval > 600){ let lampCount = rooms.filter(r=>r.lamp.isOn).length; let diyaCount = rooms.reduce((s,r)=> s + r.diyas.filter(d=>d.isLit).length, 0); if(diyaCount > lampCount * 1.2) endingType = 'memory'; else if(lampCount > diyaCount * 1.2) endingType = 'knowledge'; else endingType = 'balanced'; gameState = 3; }
  if(gameState === 3) drawEndingScreen();
}

// ---------------- INPUT & BUTTONS ----------------
function keyPressed(){
  if(gameState === 0){ /* also allow key to start */ gameState = 1; introIndex=0; introTimer=millis(); return; }
  if(gameState === 1){ introIndex++; introTimer = millis(); if(introIndex > 3){ gameState = 2; lastEval = millis(); } return; }
  if(gameState === 2){
    if(key.toLowerCase() === 'e'){ let r = rooms[player.roomIndex]; let nearest=null; let md=1e9; for(let d of r.diyas){ let dd = dist(player.x, player.y, d.x, d.y); if(dd<md){md=dd;nearest=d;} } if(nearest && md < 36 && !nearest.isLit) nearest.isLit = true; }
    if(key.toLowerCase() === 's'){ let r = rooms[player.roomIndex]; if(dist(player.x, player.y, r.lamp.x, r.lamp.y) < 40) r.lamp.isOn = !r.lamp.isOn; }
    if(key.toLowerCase() === 'q' && pulling) spamCount++;
    if(key.toLowerCase() === 'r') resetAll();
  }
  if(gameState === 3){ if(key.toLowerCase() === 'r') resetAll(); }
}

// Button click handling
function mousePressed(){
  // Start button when gameState == 0
  if(gameState === 0){
    if(mouseX > btnX - BTN_W/2 && mouseX < btnX + BTN_W/2 && mouseY > btnY - BTN_H/2 && mouseY < btnY + BTN_H/2){
      gameState = 1; introIndex = 0; introTimer = millis();
      return;
    }
  }
  // Replay button on ending screen
  if(gameState === 3){
    // same position for button
    if(mouseX > btnX - BTN_W/2 && mouseX < btnX + BTN_W/2 && mouseY > btnY - BTN_H/2 && mouseY < btnY + BTN_H/2){
      resetAll();
      return;
    }
  }
}

// ---------------- UTILITIES & DRAW UI ----------------
function drawStartScreen(){
  push();
  fill(255); textAlign(CENTER); textSize(44); text("AWAY FROM HOME", width/2, height/2 - 80);
  // button
  push();
  rectMode(CENTER);
  fill(40); stroke(255); rect(btnX, btnY, BTN_W, BTN_H, 8);
  fill(255); noStroke(); textSize(20); text("Start", btnX, btnY + 6);
  pop();
  fill(150); textSize(12); text("Click Start or press any key to begin", width/2, height/2 + 60);
  pop();
}

function drawIntro(dt){
  push(); fill(20); rect(80,80,width-160,height-160,8); pop();
  push(); textAlign(CENTER); fill(255); textSize(18);
  if(introIndex === 0){
    fill(140,210,255); rect(width/2 - 120, height/2, 70, 40);
    fill(255,200,80);
    for(let i=0;i<8;i++) ellipse(width/2 + 60 + i*8, height/2 - 40 + sin(millis()*0.002 + i)*8, 6);
    fill(255); text("my first Diwali away from home. I miss home.", width/2, height/2 + 80);
  } else if(introIndex === 1){
    fill(255,200,80); rect(width/2 - 120, height/2, 70, 40);
    fill(220,90,160, map(sin(millis()*0.02), -1,1,80,220)); ellipse(width/2 + 60, height/2, 60 + sin(millis()*0.03)*6);
    text("A shadow flickers in the room...", width/2, height/2 + 80);
  } else if(introIndex === 2){
    fill(255,200,80); rect(width/2 - 120, height/2, 70, 40);
    fill(220,90,160); ellipse(width/2 + 60, height/2, 60);
    push(); translate(random(-2,2), random(-2,2)); fill(140,210,255); rect(width/2 - 120, height/2, 70, 40); pop();
    text("...you feel a cold fear.", width/2, height/2 + 80);
  } else if(introIndex === 3){
    fill(80); rect(width/2, height/2 - 10, 220, 120, 8);
    fill(255); textSize(20); text("MOM", width/2, height/2 - 40);
    fill(200); textSize(14); text("Pick up the call", width/2, height/2 + 10);
    if(floor(millis()/200) % 2 === 0) fill(255,200,80); else fill(240);
    ellipse(width/2 + 70, height/2 - 40, 20);
    // show clickable button hint
    push(); rectMode(CENTER); fill(40); stroke(255); rect(btnX, btnY, BTN_W, BTN_H, 8); fill(255); noStroke(); textSize(20); text("Pick up", btnX, btnY + 6); pop();
    text("Click 'Pick up' or press any key to continue", width/2, height/2 + 60);
  }
  pop();
}

function drawUI(){
  push(); textSize(13); fill(255); textAlign(LEFT); text("Lives:", 12, 18);
  for(let i=0;i<PLAYER_LIVES_START;i++){ if(i < lives) fill(255,80,100); else fill(80); rect(66 + i*22, 8, 16, 12, 3); }
  textAlign(RIGHT); fill(200); text("E: light diya | S: toggle lamp | Q: chant (when pulled) | R: restart", width - 10, 18);
  if(pulling){ textAlign(CENTER); fill(255,200,120); text("Ghost pulled! Press Q rapidly (chant)", width/2, 44); text(`Progress: ${spamCount}/${SPAM_TARGET}`, width/2, 62); }
  pop();
}

function ghostRoomIndex(g){ for(let i=0;i<rooms.length;i++){ let r=rooms[i]; if(g.x >= r.x && g.x <= r.x + r.w && g.y >= r.y && g.y <= r.y + r.h) return i; } return null; }

function enforceGhostRules(){ for(let g of ghosts){ let gi = ghostRoomIndex(g); if(gi !== null){ let lvl = rooms[gi].lightLevel(); if(lvl >= 2){ let targetIdx = null; let bestD = 1e9; for(let i=0;i<rooms.length;i++){ if(rooms[i].lightLevel() < 2){ let d = abs(i-gi); if(d < bestD){ bestD = d; targetIdx = i; } } } if(targetIdx !== null){ let rt = rooms[targetIdx]; g.x = rt.x + rt.w/2 + random(-20,20); g.y = rt.y + rt.h/2 + random(-20,20); } else { g.x = constrain(g.x + random(-10,10), 10, width-10); g.y = constrain(g.y + random(-10,10), 10, height-10); } } else if(lvl === 1){ let r = rooms[gi]; let cx = r.x + r.w/2; let leftEdge = r.x - 10, rightEdge = r.x + r.w + 10; let edgeX = (g.x < cx) ? leftEdge : rightEdge; g.x = lerp(g.x, edgeX, 0.05); } } } }

function drawLight(cx, cy, radius, alpha){ push(); const g = drawingContext; const grad = g.createRadialGradient(cx, cy, 0, cx, cy, radius); grad.addColorStop(0, `rgba(255,220,150,${alpha/255})`); grad.addColorStop(0.6, `rgba(90,50,20,${alpha/600})`); grad.addColorStop(1, `rgba(0,0,0,0)`); g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, radius, 0, TWO_PI); g.fill(); pop(); }

function drawEndingScreen(){
  push(); fill(0,200); rect(0,0,width,height); textAlign(CENTER); fill(255); textSize(28);
  if(endingType === 'dead'){ text("Game Over — You followed the ritual too far.", width/2, 120); textSize(16); text("You let blind devotion drown the light of reason. The ghost was the ritual you never questioned.", width/2, 160); }
  else if(endingType === 'memory'){ text("Memory Ending", width/2, 120); for(let i=0;i<memoryFrames.length;i++){ push(); translate((width/2 - 210) + i*140, 220); fill(30); rect(0,0,120,120,6); memoryFrames[i].draw(); pop(); } textSize(14); text('Poem: "Even silly lights tie us — they keep hands together at night. Memory is small, but together we are brighter."', width/2, 420); }
  else if(endingType === 'knowledge'){ text("Knowledge Ending", width/2, 120); textSize(16); text("You turned on the lamps of reason. Rituals become questions and answers.", width/2, 160); }
  else if(endingType === 'balanced'){ text("Balanced Ending", width/2, 120); textSize(16); text("You held memory and knowledge together. Your mother smiles — both her light and your clarity remain.", width/2, 160); }
  // Replay button (same place as Start)
  push(); rectMode(CENTER); fill(40); stroke(255); rect(btnX, btnY, BTN_W, BTN_H, 8); fill(255); noStroke(); textSize(20); text("Replay", btnX, btnY + 6); pop();
  textSize(12); text("Or press R to restart", width/2, height - 40);
  pop();
}

// restart support
function keyTyped(){ if(key.toLowerCase() === 'r') resetAll(); }
