// sketch.js — full updated file (narration + click-to-advance dialogues, fitted images)
// Assumes assets: START.JPG, END STATE 1.jpg, END STATE 2.jpg, END STATE.jpg, F1.jpg ... F11.jpg
// Also assumes detection image path '/mnt/data/places.png' (used only if provided).

/* ---------------- CONFIG ---------------- */
const DETECTION_PATH = '/mnt/data/places.png';
const DET_IMG_W = 1751, DET_IMG_H = 910;

const lampPositions = [
  { x: 3,   y: 76,  w: 24, h: 76 },
  { x: 1120, y: 167, w: 59, h: 88 },
  { x: 414, y: 202, w: 59, h: 88 },
  { x: 54,  y: 632, w: 59, h: 88 },
  { x: 1026, y: 696, w: 59, h: 88 }
];

const diyaPositions = [
  { x: 572,  y: 84,  w: 26, h: 41 },
  { x: 771,  y: 92,  w: 26, h: 41 },
  { x: 1658, y: 170, w: 26, h: 41 },
  { x: 1512, y: 304, w: 29, h: 43 },
  { x: 0,    y: 309, w: 26, h: 41 },
  { x: 918,  y: 394, w: 26, h: 41 },
  { x: 577,  y: 446, w: 26, h: 41 },
  { x: 1516, y: 467, w: 26, h: 41 },
  { x: 16,   y: 549, w: 26, h: 41 },
  { x: 100,  y: 549, w: 26, h: 41 },
  { x: 401,  y: 551, w: 26, h: 41 },
  { x: 721,  y: 618, w: 26, h: 41 },
  { x: 1514, y: 618, w: 26, h: 41 },
  { x: 393,  y: 669, w: 26, h: 41 },
  { x: 1653, y: 699, w: 26, h: 41 },
  { x: 61,   y: 810, w: 26, h: 41 }
];

const DIYA_COUNT = 14;
const LAMP_COUNT = 5;

const GHOST_START = 5;
const GHOST_MAX = 7;
const GHOST_SPAWN_INTERVAL = 9000;
const GLOBAL_PULSE_INTERVAL = 40000;
const SABOTAGE_INTERVAL = 20000;
const SPAM_TARGET = 10;
const SPAM_WINDOW = 5000;
const START_TINT = 0.7;
const ATTACHED_PULL_STRENGTH = 0.28;
const GHOST_FREEZE_SPEED_FACTOR = 0.08;
const LIGHT_RANGE = 96;

/* narration timing: 0.5s (500ms) per frame */
const narrationFrameDuration = 500;

/* ------------- ASSETS & STATE ------------- */
let bgImg = null, detImg = null;
let startArt = null, endArt1 = null, endArt2 = null, endArtGeneric = null;
let narrationImgs = []; // F1..F11

let diyaImg = null, lampImg = null;
let playerIdle = null, playerWalk = null, playerAttack = null;
let ghostWalkImg = null, ghostAttackImg = null, ghostDeadImg = null;

let IDLE_FRAMES=1, WALK_FRAMES=1, ATTACK_FRAMES=1;
let GHOST_WALK_FRAMES=1, GHOST_ATTACK_FRAMES=1, GHOST_DEAD_FRAMES=1;

let imgScale=1, imgDrawX=0, imgDrawY=0;
let bgW = DET_IMG_W, bgH = DET_IMG_H;

let gameState = 0; // 0=start, 10=narration,11=phone-dialogue,12=dialogue sequence, 2=play, 3=endArt1,4=endArt2,5=endGeneric,6=gameover
let lastTime = 0;

/* player */
let player = { x:0, y:0, speed:160, size:56, lives:3, facing:1 };
let anim = { mode:'idle', frame:0, fps:8, attackQueue:0, attackPlaying:false };

/* world */
let lights = [];
let ghosts = [];
let pulses = [];
let nextGlobalPulse=0, lastGhostAdd=0, nextSabotageTime=0;
let attachedGhost = null;
let spamCount=0, spamStart=0, spamSuccess=false;

/* narration/dialogue state */
let narrationIndex = 0;
let narrationStart = 0;
let narrationPlaying = false;
let dialogueIndex = 0;
let dialogues = []; // filled in setup
let clickBlinkTimer = 0;

/* misc UI text */
let dialogueTextBar = "Use WASD to move • E to toggle light • Q to attack/spam when pulled";
let showDebug = false;

/* ------------ helpers to load many options ------------- */
function tryLoadMany(cands, onLoaded, onFail){
  let loaded=false, remaining=cands.length;
  for (let p of cands){
    loadImage(p, img=>{ if(!loaded){ loaded=true; onLoaded(img,p); } }, ()=>{ remaining--; if(remaining===0 && !loaded) onFail(); });
  }
}

/* ---------------- PRELOAD ---------------- */
function preload(){
  // optional background
  bgImg = loadImage('assets/BG PNG.png', ()=>{}, ()=>{ bgImg = null; });

  // detection image (optional)
  detImg = loadImage(DETECTION_PATH, ()=>{}, ()=>{ detImg = null; });

  // start and end art
  startArt = loadImage('assets/START.JPG', ()=>{}, ()=>{ startArt = null; });
  endArt1 = loadImage('assets/END STATE 1.jpg', ()=>{}, ()=>{ endArt1 = null; });
  endArt2 = loadImage('assets/END STATE 2.jpg', ()=>{}, ()=>{ endArt2 = null; });
  endArtGeneric = loadImage('assets/END STATE.jpg', ()=>{}, ()=>{ endArtGeneric = null; });

  // load narration frames F1..F11 from assets/F1.jpg ... assets/F11.jpg
  for (let i=1;i<=11;i++){
    const path = `assets/F${i}.jpg`;
    // create closure to push in same order
    ((idx,p)=>{
      loadImage(p,
        img => { narrationImgs[idx] = img; },
        () => { narrationImgs[idx] = null; }
      );
    })(i-1, path);
  }

  // sprites and lights
  tryLoadMany(['assets/diya.png','assets/Diya.png','assets/diya.PNG'], img=>{ diyaImg = img; }, ()=>{ diyaImg = null; });
  tryLoadMany(['assets/lamp.png','assets/Lamp.png','assets/lamp.PNG'], img=>{ lampImg = img; }, ()=>{ lampImg = null; });

  tryLoadMany(['assets/Idle.png','assets/idle.png','assets/player_idle.png'], img=>{ playerIdle = img; }, ()=>{ playerIdle = null; });
  tryLoadMany(['assets/Walk.png','assets/walk.png','assets/player_walk.png'], img=>{ playerWalk = img; }, ()=>{ playerWalk = null; });
  tryLoadMany(['assets/Attack.png','assets/attack.png','assets/player_attack.png'], img=>{ playerAttack = img; }, ()=>{ playerAttack = null; });

  tryLoadMany(['assets/ghost_walk.png','assets/ghostwalk.png','assets/ghost walk.png'], img=>{ ghostWalkImg = img; }, ()=>{ ghostWalkImg = null; });
  tryLoadMany(['assets/ghost_attack.png','assets/ghostattack.png'], img=>{ ghostAttackImg = img; }, ()=>{ ghostAttackImg = null; });
  tryLoadMany(['assets/ghost_dead.png','assets/ghostdead.png'], img=>{ ghostDeadImg = img; }, ()=>{ ghostDeadImg = null; });
}

/* ---------------- SETUP ---------------- */
function setup(){
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER); rectMode(CENTER);
  textFont('monospace');

  if (bgImg){ bgW = bgImg.width; bgH = bgImg.height; } else { bgW = DET_IMG_W; bgH = DET_IMG_H; }
  computeImagePlacement();

  player.x = imgDrawX + (bgW*imgScale)/2;
  player.y = imgDrawY + (bgH*imgScale)/2;
  player.lives = 3;

  detectFrames();

  populateLightsFromManual();

  spawnGhostPool(GHOST_START);
  lastGhostAdd = millis() + GHOST_SPAWN_INTERVAL;
  nextGlobalPulse = millis() + GLOBAL_PULSE_INTERVAL;
  nextSabotageTime = millis() + SABOTAGE_INTERVAL;

  // dialogues after phone call (improvised)
  dialogues = [
    "Mom: 'Beta, The lights have gone out everywhere. It's Bhootchaturdashi. Remember?'",
    "You: 'I... I don't know what to do.'",
    "Mom: 'Light something to keep your place bright.'",
    "Mom: 'The Ancestors are with you remember'",
    "You: 'Okay. I'll try. I'll light them and call you after.'"
  ];

  gameState = 0; // start screen
  narrationIndex = 0;
  narrationPlaying = false;
}

/* ---------------- HELPERS ---------------- */
function computeImagePlacement(){
  const rw = bgW, rh = bgH;
  imgScale = min(width/rw, height/rh);
  imgDrawX = (width - rw*imgScale)/2;
  imgDrawY = (height - rh*imgScale)/2;
}

function detectSheetFrames(img){
  if (!img || !img.width || !img.height) return 1;
  return max(1, floor(img.width / img.height));
}
function detectFrames(){
  IDLE_FRAMES = detectSheetFrames(playerIdle);
  WALK_FRAMES = detectSheetFrames(playerWalk);
  ATTACK_FRAMES = detectSheetFrames(playerAttack);
  GHOST_WALK_FRAMES = detectSheetFrames(ghostWalkImg);
  GHOST_ATTACK_FRAMES = detectSheetFrames(ghostAttackImg);
  GHOST_DEAD_FRAMES = detectSheetFrames(ghostDeadImg);
}

/* manual to lights mapping */
function populateLightsFromManual(){
  lights = [];
  function mapItem(it, type){
    const cx_img = it.x + (it.w||0)/2;
    const cy_img = it.y + (it.h||0)/2;
    const mappedX = imgDrawX + cx_img * imgScale;
    const mappedY = imgDrawY + cy_img * imgScale;
    return { x: mappedX, y: mappedY, type:type, isLit:false, pulsePhase:random(0,TWO_PI), area:(it.w||0)*(it.h||0) };
  }
  if (lampPositions) for (let lp of lampPositions) lights.push(mapItem(lp,'lamp'));
  if (diyaPositions) for (let dp of diyaPositions) lights.push(mapItem(dp,'diya'));
}

/* ---------- Ghost class & Pulse (same as before but included) ---------- */
class Ghost {
  constructor(x,y){
    this.x=x; this.y=y;
    this.r = max(20, 0.06 * min(width,height));
    this.baseSpeed = random(28,56);
    this.speed = this.baseSpeed;
    this.alive = true;
    this.state = 'walk';
    this.wanderTarget = this.randomTarget();
    this.pulseRadius = 0.30 * min(width,height);
    this.respawnAt = 0;
    this.walkAnimFrame = random(0, GHOST_WALK_FRAMES);
    this.attackAnimFrame = 0;
    this.attached = false;
    this.nextPulseDue = millis() + random(15000, 30000);
    this.facing = 1;
  }
  randomTarget(){
    const left = imgDrawX + this.r, right = imgDrawX + bgW*imgScale - this.r;
    const top = imgDrawY + this.r, bottom = imgDrawY + bgH*imgScale - this.r;
    return { x: random(left, right), y: random(top, bottom) };
  }
  clampToBounds(){ this.x = constrain(this.x, imgDrawX+this.r, imgDrawX+bgW*imgScale-this.r); this.y = constrain(this.y, imgDrawY+this.r, imgDrawY+bgH*imgScale-this.r); }
  isWithinAnyLightGlow(){
    for (let L of lights){ if (!L.isLit) continue;
      let glowR = (L.type==='lamp') ? 0.32*min(width,height) : 0.22*min(width,height);
      if (dist(this.x,this.y,L.x,L.y) <= glowR) return true;
    }
    return false;
  }
  isInDarkArea(){ return !this.isWithinAnyLightGlow(); }
  avoidLitVector(){ let ax=0,ay=0;
    for (let L of lights){ if (!L.isLit) continue; let d = dist(this.x,this.y,L.x,L.y); if (d < this.pulseRadius){ let vx = this.x - L.x, vy = this.y - L.y; let inv = 1/max(d,1); ax += vx*inv; ay += vy*inv; } }
    let mag = sqrt(ax*ax + ay*ay) || 1; return { x: ax/mag, y: ay/mag };
  }
  extinguishNearby(n=2, radiusMult=1.2){
    let candidates = lights.filter(L=>L.type==='diya' && L.isLit && dist(this.x,this.y,L.x,L.y) <= this.pulseRadius*radiusMult);
    candidates.sort((a,b)=>dist(this.x,this.y,a.x,a.y)-dist(this.x,this.y,b.x,b.y));
    for (let i=0;i<min(n,candidates.length);i++){ candidates[i].isLit = false; pulses.push(new Pulse(candidates[i].x, candidates[i].y, 0.06*min(width,height), true)); }
    return candidates.length;
  }
  update(dt){
    if (!this.alive && this.respawnAt>0 && millis()>=this.respawnAt){ this.alive=true; this.state='walk'; this.respawnAt=0; this.wanderTarget=this.randomTarget(); this.attached=false; }
    if (!this.alive) return;
    if (this.state==='dead'){ if (this.respawnAt===0) this.respawnAt = millis() + 10000; return; }
    if (this.attached) return;

    const someLit = lights.some(l=>l.isLit);
    let speedFactor = someLit ? GHOST_FREEZE_SPEED_FACTOR : 1;
    let curSpeed = this.baseSpeed * speedFactor;

    let dx = this.wanderTarget.x - this.x, dy = this.wanderTarget.y - this.y;
    let d = sqrt(dx*dx + dy*dy);
    if (d < 12) this.wanderTarget = this.randomTarget();
    else {
      dx /= d; dy /= d;
      let avoid = this.avoidLitVector();
      dx += avoid.x * 1.6; dy += avoid.y * 1.6;
      let mag = sqrt(dx*dx + dy*dy) || 1;
      let moveX = dx/mag;
      if (abs(moveX) > 0.05) this.facing = moveX < 0 ? -1 : 1;
      this.x += (dx/mag) * curSpeed * dt;
      this.y += (dy/mag) * curSpeed * dt;
      this.clampToBounds();
    }

    for (let L of lights){ if (!L.isLit) continue; let deathR = player.size * 1.0; if (dist(this.x,this.y,L.x,L.y) <= deathR){ this.kill('light'); return; } }

    for (let L of lights){
      if (!L.isLit) continue;
      let glowR = (L.type==='lamp') ? 0.32*min(width,height) : 0.22*min(width,height);
      let dd = dist(this.x,this.y,L.x,L.y);
      if (dd < glowR * 0.95){ let vx = this.x - L.x, vy = this.y - L.y; let inv = 1 / max(dd,1); this.x += vx*inv*6; this.y += vy*inv*6; this.clampToBounds(); }
    }

    if (millis() > this.nextPulseDue){
      this.nextPulseDue = millis() + random(35000, 50000);
      if (this.isInDarkArea()) this.emitPulse();
    }
  }
  emitPulse(){ pulses.push(new Pulse(this.x,this.y,this.pulseRadius)); let litCandidates = lights.filter(l=>l.isLit && dist(this.x,this.y,l.x,l.y) <= this.pulseRadius*1.05); litCandidates.sort((a,b)=>dist(this.x,this.y,a.x,a.y)-dist(this.x,this.y,b.x,b.y)); let toBlow = min(2, litCandidates.length); for (let i=0;i<toBlow;i++){ litCandidates[i].isLit=false; pulses.push(new Pulse(litCandidates[i].x, litCandidates[i].y, 0.06*min(width,height), true)); } }
  kill(by='player'){ this.state='dead'; this.alive=false; this.attached=false; this.respawnAt = millis() + 10000; pulses.push(new Pulse(this.x,this.y,0.12*min(width,height), true)); if (attachedGhost===this){ attachedGhost=null; resetSpam(); } }
  draw(){
    if (!this.alive) return;
    const flip = (this.facing === -1);
    if (this.state === 'dead'){ if (ghostDeadImg) drawSheetFrame(ghostDeadImg, 0, GHOST_DEAD_FRAMES, this.x, this.y, flip, this.r*1.6); else { push(); noStroke(); fill(140,40,160,160); ellipse(this.x,this.y,this.r*2); pop(); } return; }
    if (this.attached && ghostAttackImg){ this.attackAnimFrame = (this.attackAnimFrame + 0.28) % max(1, GHOST_ATTACK_FRAMES); drawSheetFrame(ghostAttackImg, floor(this.attackAnimFrame), GHOST_ATTACK_FRAMES, this.x, this.y, flip, this.r*1.6); return; }
    if (ghostWalkImg){ this.walkAnimFrame = (this.walkAnimFrame + 0.12) % max(1, GHOST_WALK_FRAMES); drawSheetFrame(ghostWalkImg, floor(this.walkAnimFrame), GHOST_WALK_FRAMES, this.x, this.y, flip, this.r*1.6); } else { push(); translate(this.x,this.y); if (flip) scale(-1,1); noStroke(); fill(220,90,160,200); ellipse(0,0,this.r*2); fill(255); ellipse(-this.r*0.32, -this.r*0.22, this.r*0.36); ellipse(this.r*0.12, -this.r*0.22, this.r*0.28); pop(); }
  }
}

class Pulse { constructor(x,y,maxR, quick=false){ this.x=x; this.y=y; this.maxR=maxR; this.t=0; this.dur = quick?600:1200; } update(dt){ this.t += dt*1000; } draw(){ let prog = constrain(this.t/this.dur,0,1); let r = this.maxR * prog; push(); noFill(); stroke(255,200,100, map(1-prog,0,1,20,160)); strokeWeight(2); ellipse(this.x,this.y,r*2); pop(); } done(){ return this.t > this.dur; } }

function spawnGhostPool(n){ ghosts = []; for (let i=0;i<n;i++) spawnOneGhost(); }
function spawnOneGhost(){
  let attempts=0;
  while (attempts<40){
    const gx = random(imgDrawX + 60, imgDrawX + bgW*imgScale - 60);
    const gy = random(imgDrawY + 60, imgDrawY + bgH*imgScale - 60);
    if (dist(gx, gy, player.x, player.y) > 120){ let g = new Ghost(gx, gy); g.r = player.size*1.0; ghosts.push(g); return g; }
    attempts++;
  }
  let g = new Ghost(imgDrawX+80, imgDrawY+80); g.r = player.size*1.0; ghosts.push(g); return g;
}

/* ---------------- DRAW LOOP ---------------- */
function draw(){
  const now = millis();
  const dt = lastTime === 0 ? (1/60) : (now - lastTime)/1000;
  lastTime = now;

  background(0);

  // States: 0=start screen, 10=narration auto, 11=phone-call prompt, 12=dialogue clicks, 2=gameplay, 3/4/5=end arts, 6=gameover
  if (gameState === 0){ drawStart(); return; }
  if (gameState === 10){ updateNarration(dt); drawNarration(); return; }
  if (gameState === 11){ drawPhonePrompt(); return; }
  if (gameState === 12){ drawDialogue(); return; }
  if (gameState === 3){ drawEnd(1); return; }
  if (gameState === 4){ drawEnd(2); return; }
  if (gameState === 5){ drawEnd(3); return; }
  if (gameState === 6){ drawEndGeneric(); return; }

  // --- gameplay drawing ---
  if (bgImg){ let drawX = imgDrawX + (bgW*imgScale)/2; let drawY = imgDrawY + (bgH*imgScale)/2; imageMode(CENTER); image(bgImg, drawX, drawY, bgW*imgScale, bgH*imgScale); } else { push(); noStroke(); fill(10); rectMode(CORNER); rect(imgDrawX, imgDrawY, bgW*imgScale, bgH*imgScale); pop(); }

  if (millis() > lastGhostAdd && ghosts.length < GHOST_MAX){ lastGhostAdd = millis() + GHOST_SPAWN_INTERVAL; spawnOneGhost(); }

  if (millis() > nextGlobalPulse){ nextGlobalPulse = millis() + GLOBAL_PULSE_INTERVAL; let pool = ghosts.filter(g=>g.alive && g.state!=='dead' && g.isInDarkArea()); if (pool.length>0){ let picks = min(pool.length, random()<0.35 ? 2 : 1); shuffle(pool, true); for (let i=0;i<picks;i++) pool[i].emitPulse(); } }

  if (millis() > nextSabotageTime){ nextSabotageTime = millis() + SABOTAGE_INTERVAL; const pool = ghosts.filter(g=>g.alive && g.state!=='dead' && g.isInDarkArea()); if (pool.length>0){ const pick = random(pool); pick.extinguishNearby(2, 1.4); pulses.push(new Pulse(pick.x, pick.y, pick.pulseRadius)); } }

  // player movement
  let mvx=0, mvy=0;
  if (!attachedGhost){
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) mvx -= 1;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) mvx += 1;
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) mvy -= 1;
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) mvy += 1;
    if (mvx !== 0 && mvy !== 0){ mvx *= 0.7071; mvy *= 0.7071; }
    let nx = player.x + mvx * player.speed * dt;
    let ny = player.y + mvy * player.speed * dt;
    const left = imgDrawX + player.size/2;
    const right = imgDrawX + bgW*imgScale - player.size/2;
    const top = imgDrawY + player.size/2;
    const bottom = imgDrawY + bgH*imgScale - player.size/2;
    player.x = constrain(nx, left, right);
    player.y = constrain(ny, top, bottom);
    if (mvx > 0) player.facing = 1;
    else if (mvx < 0) player.facing = -1;
  } else {
    if (attachedGhost){
      player.facing = (attachedGhost.x > player.x) ? 1 : -1;
      attachedGhost.facing = -player.facing;
      player.x = lerp(player.x, attachedGhost.x, ATTACHED_PULL_STRENGTH);
      player.y = lerp(player.y, attachedGhost.y, ATTACHED_PULL_STRENGTH);
    }
  }

  for (let g of ghosts) g.update(dt);

  for (let p of pulses) p.update(dt);
  pulses = pulses.filter(p => !p.done());

  // draw lights below characters
  for (let L of lights) drawLightSprite(L);

  for (let p of pulses) p.draw();

  // reduced glow
  for (let L of lights){
    if (L.isLit){
      if (L.type === 'lamp') drawBigYellowGlow(L.x, L.y - 8, 0.24 * min(width,height), 120);
      else { const t = millis() * 0.0012 + L.pulsePhase; const pulse = (sin(t)*0.5 + 0.5) * 0.5 + 0.5; drawBigYellowGlow(L.x, L.y - 8, 0.20 * pulse * min(width,height), 90 * pulse); }
    }
  }

  // black tint (below characters)
  const litCount = lights.filter(l=>l.isLit).length;
  const fractionLit = litCount / max(1, lights.length);
  const tintAlpha = START_TINT * (1 - fractionLit);
  push(); noStroke(); fill(0, 255 * tintAlpha); rectMode(CORNER); rect(0,0,width,height); pop();

  // ghosts + characters above tint
  for (let g of ghosts) g.draw();

  processPlayerAttackCollision();

  if (attachedGhost){
    let elapsed = millis() - spamStart;
    if (!spamSuccess && spamCount >= SPAM_TARGET && spamStart > 0 && elapsed <= SPAM_WINDOW){
      spamSuccess = true;
      if (!anim.attackPlaying && anim.attackQueue > 0){ anim.attackPlaying = true; anim.mode = 'attack'; anim.frame = 0; anim.fps = 20; }
    }
    if (!spamSuccess && spamStart > 0 && elapsed > SPAM_WINDOW){
      player.lives = max(0, player.lives - 1);
      detachGhostAndPushAway(attachedGhost, true);
      resetSpam();
      if (player.lives <= 0){ gameState = 6; return; }
    }
  }

  updatePlayerAnim(dt);
  drawPlayerSprite();

  drawUI();

  checkWinConditions();

  // attachment detection
  if (!attachedGhost){
    const attachDistance = 48;
    for (let g of ghosts){
      if (!g.alive || g.state === 'dead') continue;
      if (!g.isInDarkArea()) continue;
      if (!isPlayerInDarkArea()) continue;
      if (dist(g.x,g.y,player.x,player.y) <= attachDistance){
        attachedGhost = g; g.attached = true; g.state = 'attack'; spamCount=0; spamStart=millis(); spamSuccess=false;
        player.facing = (g.x > player.x) ? 1 : -1; g.facing = -player.facing;
        g.extinguishNearby(2,1.2);
        break;
      }
    }
  }

  if (showDebug){
    push(); fill(255,240); textSize(12); textAlign(LEFT,TOP); text(`FPS:${(1/dt).toFixed(1)} dt:${(dt*1000).toFixed(1)}ms`, 10, height-80); text(`Player: ${player.x.toFixed(0)}, ${player.y.toFixed(0)}`, 10, height-64); text(`Ghosts: ${ghosts.length}  Attached:${attachedGhost ? 'YES' : 'NO'}`, 10, height-48); text(`Lit: ${lights.filter(l=>l.isLit).length}/${lights.length}`, 10, height-32); pop();
  }
}

/* ---------------- Player anim / draw ---------------- */
function updatePlayerAnim(dt){
  if (anim.attackPlaying || anim.attackQueue > 0){
    if (!anim.attackPlaying && anim.attackQueue > 0){ anim.attackPlaying = true; anim.mode='attack'; anim.frame=0; anim.fps=18; }
    if (anim.attackPlaying){ anim.frame += anim.fps*dt; if (ATTACK_FRAMES>0 && anim.frame >= ATTACK_FRAMES){ anim.frame = 0; if (anim.attackQueue>0){ anim.attackQueue--; if (anim.attackQueue<=0){ anim.attackPlaying=false; anim.mode = (!attachedGhost && (keyIsDown(65)||keyIsDown(68)||keyIsDown(87)||keyIsDown(83))) ? 'walk' : 'idle'; anim.fps = anim.mode==='walk'?10:6; } } else { anim.attackPlaying=false; anim.mode = (!attachedGhost && (keyIsDown(65)||keyIsDown(68)||keyIsDown(87)||keyIsDown(83))) ? 'walk' : 'idle'; anim.fps = anim.mode==='walk'?10:6; } } }
    return;
  }
  const moving = (keyIsDown(65)||keyIsDown(68)||keyIsDown(87)||keyIsDown(83));
  if (moving && !attachedGhost){ if (anim.mode !== 'walk'){ anim.mode='walk'; anim.frame=0; anim.fps=10; } anim.frame += anim.fps*dt; if (WALK_FRAMES>0) anim.frame = anim.frame % WALK_FRAMES; }
  else { if (anim.mode !== 'idle'){ anim.mode='idle'; anim.frame=0; anim.fps=6; } anim.frame += anim.fps*dt; if (IDLE_FRAMES>0) anim.frame = anim.frame % IDLE_FRAMES; }
}

function drawPlayerSprite(){
  if (!player.size || player.size < 8) player.size = 48;
  let frameIdx = 0;
  let flip = (player.facing === -1);
  if (anim.mode === 'attack' && playerAttack){ frameIdx = ATTACK_FRAMES ? floor(anim.frame % ATTACK_FRAMES) : 0; drawSheetFrame(playerAttack, frameIdx, ATTACK_FRAMES, player.x, player.y, flip, player.size*1.4); return; }
  if (anim.mode === 'walk' && playerWalk){ frameIdx = WALK_FRAMES ? floor(anim.frame % WALK_FRAMES) : 0; drawSheetFrame(playerWalk, frameIdx, WALK_FRAMES, player.x, player.y, flip, player.size*1.4); return; }
  if (anim.mode === 'idle' && playerIdle){ frameIdx = IDLE_FRAMES ? floor(anim.frame % IDLE_FRAMES) : 0; drawSheetFrame(playerIdle, frameIdx, IDLE_FRAMES, player.x, player.y, flip, player.size*1.4); return; }
  push(); translate(player.x, player.y); if (flip) scale(-1,1); stroke(0); strokeWeight(2); fill(255,200,40); rectMode(CENTER); rect(0,0, player.size*1.1, player.size*1.1, 6); fill(30); ellipse((player.facing===1 ? player.size*0.18 : -player.size*0.18), -player.size*0.12, max(3, player.size*0.08), max(3, player.size*0.08)); pop();
}

/* ---------------- Input handlers ---------------- */
function keyPressed(){
  if (gameState === 10 || gameState === 11 || gameState === 12){
    // allow space or mouse clicks to advance during narration/dialogue, handled in mouseClicked
    return;
  }
  if (gameState !== 2) return;
  if (key && key.toLowerCase && key.toLowerCase() === 'e'){
    let nearest = null, md = 1e9;
    for (let L of lights){ let d = dist(player.x, player.y, L.x, L.y); if (d < md){ md = d; nearest = L; } }
    if (nearest && md <= LIGHT_RANGE){ nearest.isLit = !nearest.isLit; if (nearest.isLit){ let alive = ghosts.filter(g=>g.alive && g.state!=='dead'); if (alive.length){ alive.sort((a,b)=>dist(a.x,a.y,nearest.x,nearest.y)-dist(b.x,b.y,nearest.x,nearest.y)); if (dist(alive[0].x,alive[0].y,nearest.x,nearest.y) < player.size*1.5) alive[0].kill('light'); } } }
  } else if (key && key.toLowerCase && key.toLowerCase() === 'q'){
    if (attachedGhost){ if (spamStart === 0) spamStart = millis(); spamCount++; anim.attackQueue++; if (!anim.attackPlaying){ anim.attackPlaying=true; anim.mode='attack'; anim.frame=0; anim.fps=18; } } else { anim.attackQueue++; if (!anim.attackPlaying){ anim.attackPlaying=true; anim.mode='attack'; anim.frame=0; anim.fps=18; } }
  } else if (key === 'd'){ showDebug = !showDebug; }
}
function keyReleased(){
  if (gameState !== 2) return;
  if (key && key.toLowerCase && key.toLowerCase() === 'q'){
    if (spamSuccess && attachedGhost){ detachGhostAndPushAway(attachedGhost, false); resetSpam(); }
  }
}

function mouseClicked(){
  // narration and dialogue click handling
  if (gameState === 0){
    // start -> start narration
    narrationIndex = 0;
    narrationPlaying = true;
    narrationStart = millis();
    gameState = 10;
    clickBlinkTimer = millis();
    return;
  }
  if (gameState === 10){
    // clicking during narration: if on last frame, move to phone prompt; otherwise advance to last immediately
    if (narrationIndex >= narrationImgs.length - 1){
      gameState = 11; // phone prompt
      clickBlinkTimer = millis();
    } else {
      // jump to last frame
      narrationIndex = narrationImgs.length - 1;
      narrationStart = millis();
    }
    return;
  }
  if (gameState === 11){
    // phone prompt clicked -> go to dialogues (on black)
    gameState = 12;
    dialogueIndex = 0;
    clickBlinkTimer = millis();
    return;
  }
  if (gameState === 12){
    // advance dialogues by click; when finished -> start gameplay
    dialogueIndex++;
    clickBlinkTimer = millis();
    if (dialogueIndex >= dialogues.length){
      // start game for real
      restartGame();
      return;
    }
    return;
  }

  // replay / end screens
  if ([3,4,5,6].includes(gameState)){
    restartGame();
    return;
  }
}

/* ---------------- Game actions: attack/detach, etc (same) ---------------- */
function processPlayerAttackCollision(){
  const isAttacking = anim.attackPlaying || anim.attackQueue > 0;
  if (!isAttacking) return;
  const atkR = player.size * 1.2;
  for (let g of ghosts){ if (!g.alive) continue; if (g.state === 'dead') continue; if (dist(player.x, player.y, g.x, g.y) <= atkR){ g.kill('player'); } }
}

function detachGhostAndPushAway(g, penalty=false){
  if (!g) return;
  g.attached = false;
  if (attachedGhost === g) attachedGhost = null;
  g.state = 'walk';
  const corners = [
    {x: imgDrawX + 40, y: imgDrawY + 40},
    {x: imgDrawX + bgW*imgScale - 40, y: imgDrawY + 40},
    {x: imgDrawX + 40, y: imgDrawY + bgH*imgScale - 40},
    {x: imgDrawX + bgW*imgScale - 40, y: imgDrawY + bgH*imgScale - 40}
  ];
  corners.sort((a,b) => dist(player.x, player.y, b.x, b.y) - dist(player.x, player.y, a.x, a.y));
  const corner = corners[0];
  g.x = corner.x + random(-40,40);
  g.y = corner.y + random(-40,40);
  g.wanderTarget = g.randomTarget();
  g.nextPulseDue = millis() + random(15000, 30000);
  pulses.push(new Pulse(g.x, g.y, 0.12 * min(width,height), true));
  if (penalty) g.nextPulseDue += 5000;
}

function resetSpam(){ spamCount=0; spamStart=0; spamSuccess=false; anim.attackQueue=0; anim.attackPlaying=false; }

/* ---------------- UI drawing helpers ---------------- */
function drawHeart(cx, cy, size){
  push(); translate(cx, cy); noStroke(); fill(255,50,80);
  beginShape(); vertex(0, -size*0.1); bezierVertex(-size*0.5, -size*0.9, -size*1.1, -size*0.0, 0, size*0.75); bezierVertex(size*1.1, -size*0.0, size*0.5, -size*0.9, 0, -size*0.1); endShape(CLOSE);
  pop();
}

function drawUI(){
  push();
  textFont('monospace');
  const startX = 12, startY = 12;
  for (let i=0;i<3;i++){ if (i < player.lives) drawHeart(startX + i*28 + 10, startY + 12, 10); else { push(); noFill(); stroke(120); strokeWeight(2); rect(startX + i*28 + 10, startY + 12, 20, 14, 4); pop(); } }
  noStroke(); fill(255); textSize(12); textAlign(LEFT, TOP); text('Lit: ' + lights.filter(l=>l.isLit).length + '/' + lights.length, startX+100, startY);

  textAlign(CENTER, BOTTOM);
  fill(255, 230); textSize(14);
  const pad = 18;
  push(); rectMode(CENTER); fill(0,140); noStroke(); const txtW = min(900, Math.max(220, textWidth(dialogueTextBar) + 20)); rect(width/2, height - pad - 8, txtW + 20, 38, 8); pop();
  fill(255); text(dialogueTextBar, width/2, height - pad);
  pop();
}

/* ---------------- Start / Narration / Dialogue / End screens ---------------- */
function drawStart(){
  background(0);
  push();
  // show startArt fitted full width/height but preserving aspect and not cut
  if (startArt){
    drawImageFit(startArt, 0.82); // use 82% of width/height area
  } else {
    // fallback rectangle
    push(); noStroke(); fill(40,40,40); rect(width/2, height/2 - 40, width*0.78, height*0.6, 6); pop();
  }
  // Removed title text as requested (no AWAY FROM HOME text)
  // show instruction under image
  textAlign(CENTER, TOP); fill(240); textSize(16); text('Use WASD to move • E to toggle light • Q to attack/spam when pulled', width/2, height - 120);

  // blinking click prompt (no button graphic)
  const bx = width/2, by = height - 70;
  drawBlinkingText('CLICK TO START', bx, by, 20);
  pop();
}

function updateNarration(dt){
  // advance frames automatically
  if (!narrationPlaying) return;
  const elapsed = millis() - narrationStart;
  const targetIndex = floor(elapsed / narrationFrameDuration);
  if (targetIndex >= narrationImgs.length){
    // stop at last frame and move to phone prompt state
    narrationPlaying = false;
    narrationIndex = narrationImgs.length - 1;
    gameState = 11; // phone prompt
    clickBlinkTimer = millis();
    return;
  } else {
    narrationIndex = targetIndex;
  }
}

function drawNarration(){
  background(0);
  // show current narration frame fitted
  const img = narrationImgs[narrationIndex];
  if (img){
    drawImageFit(img, 0.88);
  } else {
    // fallback: grey panel
    push(); fill(30); rect(width/2, height/2 - 20, width*0.78, height*0.6, 6); pop();
  }

  // if last frame -> show "click to receive phone call" blinking
  if (narrationIndex >= narrationImgs.length - 1){
    drawBlinkingText('CLICK TO RECEIVE PHONE CALL', width/2, height - 80, 18);
  }
}

function drawPhonePrompt(){
  // show last narration frame as context if you want — user asked "On Image F11 jpg, you get instructional text on the jpg below" 
  // but then requested that dialogue goes to black; we show the F11 then prompt click (consented earlier). We'll show F11 fitted.
  background(0);
  const img = narrationImgs[narrationImgs.length - 1];
  if (img) drawImageFit(img, 0.88);
  drawBlinkingText('CLICK TO RECEIVE PHONE CALL', width/2, height - 80, 18);
}

function drawDialogue(){
  // pure black background (dialogues on black rectangle)
  background(0);

  // draw a centered semi-opaque dialogue rectangle near bottom
  const boxW = min(width*0.9, 1000);
  const boxH = 180;
  push();
  fill(0, 230);
  rectMode(CENTER);
  noStroke();
  rect(width/2, height*0.66, boxW, boxH, 12);

  // text
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  const t = dialogues[dialogueIndex] || "";
  text(t, width/2, height*0.66);

  // blinking "click to continue" prompt under the dialogue box
  drawBlinkingText('CLICK TO CONTINUE', width/2, height*0.86, 16);
  pop();
}

function drawEnd(kind){
  // chosen earlier mapping in checkWinConditions; draw the selected art fitted and show "click to replay" prompt
  background(0);
  let imgToUse = (kind===1 ? endArt1 : (kind===2 ? endArt2 : endArtGeneric));
  if (imgToUse){ drawImageFit(imgToUse, 0.9); }
  drawBlinkingText('CLICK TO REPLAY', width/2, height - 80, 18);
}

function drawEndGeneric(){
  background(0);
  if (endArtGeneric) drawImageFit(endArtGeneric, 0.9);
  drawBlinkingText('CLICK TO REPLAY', width/2, height - 80, 18);
}

/* ---------- small helpers: fit image into window without cropping ---------- */
function drawImageFit(img, areaFrac=0.9){
  if (!img) return;
  // Fit preserving aspect inside bounding region (areaFrac controls max area of screen to use)
  const maxW = width * areaFrac;
  const maxH = height * areaFrac;
  const w = img.width, h = img.height;
  const s = min(maxW / w, maxH / h);
  const dw = w * s, dh = h * s;
  imageMode(CENTER);
  image(img, width/2, height/2 - 20, dw, dh);
}

/* blinking text helper */
function drawBlinkingText(txt, cx, cy, size=18){
  const period = 800;
  const on = floor(millis() / period) % 2 === 0;
  push();
  textAlign(CENTER, CENTER);
  textSize(size);
  if (on) fill(255, 240); else fill(255, 80);
  noStroke();
  text(txt, cx, cy);
  pop();
}

/* ---------------- End / restart logic & win checks ---------------- */
function restartGame(){
  for (let L of lights) L.isLit = false;
  player.lives = 3; attachedGhost = null; resetSpam();
  if (detImg) detectAndPlaceLights(detImg); else populateLightsFromManual();
  spawnGhostPool(GHOST_START);
  lastGhostAdd = millis() + GHOST_SPAWN_INTERVAL;
  nextGlobalPulse = millis() + GLOBAL_PULSE_INTERVAL;
  nextSabotageTime = millis() + SABOTAGE_INTERVAL;
  gameState = 2;
}

function checkWinConditions(){
  const diyas = lights.filter(l=>l.type==='diya'), lamps = lights.filter(l=>l.type==='lamp');
  const diyasLit = diyas.filter(l=>l.isLit).length;
  const lampsLit = lamps.filter(l=>l.isLit).length;

  // If all diyas lit OR both all lamps+diya lit => END STATE 1.jpg
  if (diyasLit === diyas.length){
    ghosts.forEach(g=>{ g.alive=false; g.state='dead'; }); gameState = 3; return;
  }
  // If all lamps lit and diyas not all => show END STATE 2.jpg
  if (lampsLit === lamps.length && diyasLit < diyas.length){
    ghosts.forEach(g=>{ g.alive=false; g.state='dead'; }); gameState = 4; return;
  }
}

/* ---------- sprite sheet drawing ---------- */
function drawSheetFrame(img, frameIdx, framesTotal, x, y, flip=false, targetSize=null){
  if (!img || framesTotal <= 0) return;
  let fh = img.height, fw = img.width / framesTotal;
  let sx = Math.floor(frameIdx % framesTotal) * fw;
  push(); translate(x,y); if (flip) scale(-1,1); imageMode(CENTER);
  let sizeBase = targetSize || player.size;
  let targetScale = sizeBase / max(fw, fh) * 1.4;
  image(img, 0, 0, fw * targetScale, fh * targetScale, sx, 0, fw, fh);
  pop();
}

/* ---------- lights, glow helpers ---------- */
function drawLightSprite(L){
  push(); translate(L.x, L.y); noStroke();
  fill(0,24); ellipse(0, 6 * imgScale, 26 * imgScale, 8 * imgScale);
  if (L.type === 'lamp'){
    if (lampImg){ const fh = lampImg.height, fw = lampImg.width; const scaleFactor = (player.size / max(fw, fh)) * 1.0; image(lampImg, 0, -6 * imgScale, fw * scaleFactor, fh * scaleFactor); }
    else { fill(80); rect(0, -10 * imgScale, 28 * imgScale, 44 * imgScale, 6 * imgScale); fill(255,220,120); ellipse(0, -34 * imgScale, 12 * imgScale, 12 * imgScale); }
  } else {
    if (diyaImg){ const fh = diyaImg.height, fw = diyaImg.width; const scaleFactor = (player.size / max(fw, fh)) * 0.45; image(diyaImg, 0, -6 * imgScale, fw * scaleFactor, fh * scaleFactor); }
    else { fill(90,60,30); ellipse(0, -6 * imgScale, 14 * imgScale, 8 * imgScale); if (L.isLit){ fill(255,170,50); ellipse(0, -14 * imgScale, 6 * imgScale, 8 * imgScale); } }
  }
  pop();
}

function drawBigYellowGlow(cx, cy, radius, alpha){
  push(); const g = drawingContext;
  const grad = g.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, `rgba(255,240,160,${(alpha*0.8)/255})`);
  grad.addColorStop(0.25, `rgba(255,200,90,${(alpha*0.5)/255})`);
  grad.addColorStop(0.6, `rgba(200,120,60,${(alpha*0.25)/255})`);
  grad.addColorStop(1, `rgba(0,0,0,0)`);
  g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, radius, 0, TWO_PI); g.fill();
  pop();
}

/* ---------- detection fallback (if you want pixel-based) ---------- */
function detectAndPlaceLights(img){
  const g = createGraphics(img.width, img.height); g.imageMode(CORNER); g.clear(); g.image(img, 0, 0, img.width, img.height); g.loadPixels();
  const T = 60; const w = img.width, h = img.height;
  const mask = new Uint8Array(w*h);
  for (let y=0;y<h;y++){ for (let x=0;x<w;x++){ const i = (y*w + x)*4; const r=g.pixels[i], gr=g.pixels[i+1], b=g.pixels[i+2], a=g.pixels[i+3]; if (a>10 && r<=T && gr<=T && b<=T) mask[y*w+x]=1; else mask[y*w+x]=0; } }
  const visited = new Uint8Array(w*h); const components = []; const stack=[];
  for (let y=0;y<h;y++){ for (let x=0;x<w;x++){ const idx=y*w+x; if (mask[idx] && !visited[idx]){ let minX=x, maxX=x, minY=y, maxY=y, count=0, sx=0, sy=0; stack.push(idx); visited[idx]=1; while(stack.length){ const cur=stack.pop(); const cx = cur % w, cy = Math.floor(cur / w); count++; sx+=cx; sy+=cy; if (cx<minX) minX=cx; if (cx>maxX) maxX=cx; if (cy<minY) minY=cy; if (cy>maxY) maxY=cy; for (let ny=cy-1; ny<=cy+1; ny++){ for (let nx=cx-1; nx<=cx+1; nx++){ if (nx<0||ny<0||nx>=w||ny>=h) continue; const nidx = ny*w+nx; if (mask[nidx] && !visited[nidx]){ visited[nidx]=1; stack.push(nidx); } } } } if (count>=20) components.push({minX,minY,maxX,maxY,count,cx:sx/count,cy:sy/count}); } } }
  lights = []; const lampAreaThreshold = 700;
  for (let c of components){ const mappedX = imgDrawX + c.cx * imgScale; const mappedY = imgDrawY + c.cy * imgScale; const type = (c.count >= lampAreaThreshold) ? 'lamp' : 'diya'; lights.push({ x:mappedX, y:mappedY, type, isLit:false, pulsePhase:random(0,TWO_PI), area:c.count }); }
  console.log('Detection placement:', lights.length);
}

function placeLightsGrid(){
  lights = [];
  const cols = 7;
  const left = imgDrawX + (bgW*imgScale) * 0.08;
  const right = imgDrawX + (bgW*imgScale) * 0.92;
  const gap = (right - left) / (cols - 1);
  const topY = imgDrawY + (bgH*imgScale) * 0.30;
  const midY = imgDrawY + (bgH*imgScale) * 0.50;
  const bottomY = imgDrawY + (bgH*imgScale) * 0.70;
  for (let c=0;c<cols;c++) lights.push({ x:left + c*gap, y:topY, type:'diya', isLit:false, pulsePhase:random(0,TWO_PI) });
  for (let c=0;c<cols;c++) lights.push({ x:left + c*gap, y:bottomY, type:'diya', isLit:false, pulsePhase:random(0,TWO_PI) });
  const lampCols = [0,2,3,4,6];
  for (let i=0;i<lampCols.length;i++){ const c=lampCols[i]; lights.push({ x:left + c*gap, y:midY, type:'lamp', isLit:false, pulsePhase:0 }); }
}

function isPlayerInDarkArea(){ for (let L of lights) if (L.isLit && dist(player.x,player.y,L.x,L.y) <= 0.32*min(width,height)) return false; return true; }

function windowResized(){ resizeCanvas(windowWidth, windowHeight); if (bgImg){ bgW = bgImg.width; bgH = bgImg.height; } else { bgW = DET_IMG_W; bgH = DET_IMG_H; } computeImagePlacement(); if (detImg) detectAndPlaceLights(detImg); else populateLightsFromManual(); spawnGhostPool(GHOST_START); player.x = imgDrawX + (bgW * imgScale) / 2; player.y = imgDrawY + (bgH * imgScale) / 2; }

