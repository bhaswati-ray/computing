// sketch.js - Single-file p5.js prototype (fixed per user requests)
// - full game loop
// - correct sprite looping for player (idle/walk/attack) and ghosts (walk/attack/dead)
// - ghosts grow to 7 gradually
// - ghosts emit pulse every GLOBAL_PULSE_INTERVAL (one chosen ghost) and blow out up to 2 lit lights
// - ghosts die in lit glow and respawn after 10s
// - magnet pull is strict: player must Q-spam SPAM_TARGET in SPAM_WINDOW to avoid losing a life
// - Q presses queue full attack animation loops; while spamming player plays attack anim(s)
// - ghosts cannot enter lit glow and are repelled; when any lights are lit ghosts slow/freeze (configurable)
// - full single-file, no external fragments

// ---------- CONFIG ----------
const DIYA_COUNT = 14;
const LAMP_COUNT = 5;
const TOTAL_LIGHTS = DIYA_COUNT + LAMP_COUNT;

const GHOST_START = 3;
const GHOST_MAX = 7;
const GHOST_SPAWN_INTERVAL = 9000; // spawn one ghost every 9s until max (tuned)
const GLOBAL_PULSE_INTERVAL = 40000; // 40s: pick 1 ghost to pulse/blow lights
const SPAM_TARGET = 10;
const SPAM_WINDOW = 5000; // ms to hit SPAM_TARGET
const START_TINT = 0.7; // 70% darkness
const ATTACHED_PULL_STRENGTH = 0.28; // lerp strength for pulling
const GHOST_FREEZE_SPEED_FACTOR = 0.08; // when any light lit, ghosts slow to this factor (almost freeze)

// ---------- ASSETS ----------
let roomImg, diyaImg, lampImg;
let playerIdle, playerWalk, playerAttack;
let ghostWalkImg, ghostAttackImg, ghostDeadImg;

// frames per sprite sheet
let IDLE_FRAMES = 1, WALK_FRAMES = 1, ATTACK_FRAMES = 1;
let GHOST_WALK_FRAMES = 1, GHOST_ATTACK_FRAMES = 1, GHOST_DEAD_FRAMES = 1;

// ---------- LAYOUT ----------
let imgScale = 1, imgDrawX = 0, imgDrawY = 0;
let roomW = 0, roomH = 0;

// ---------- GAME STATE ----------
let gameState = 2; // 0 start, 2 play, 3 diya-win, 4 full-win, 5 lamps-only (knowledge), 6 game over
let lastTime = 0;

// ---------- PLAYER ----------
let player = { x: 0, y: 0, speed: 160, size: 56, lives: 3 };
let anim = {
  mode: 'idle',    // 'idle' | 'walk' | 'attack'
  frame: 0,        // float frame index
  fps: 8,
  facing: 1,       // 1 = right, -1 = left
  attackQueue: 0,  // number of full attack loops queued
  attackPlaying: false
};

// ---------- LIGHTS ----------
let lights = []; // {x,y,type:'diya'|'lamp',isLit,pulsePhase}
const LIGHT_RANGE = 96; // interact radius

// ---------- GHOSTS ----------
let ghosts = [];
let pulses = [];
let nextGlobalPulse = 0;
let lastGhostAdd = 0;

// ---------- PULL / SPAM ----------
let attachedGhost = null;
let spamCount = 0;
let spamStart = 0;
let spamSuccess = false;

// ---------- robust loader util ----------
function tryLoadMany(candidates, onLoaded, onFail){
  let loaded = false;
  let remaining = candidates.length;
  for (let p of candidates){
    loadImage(p,
      (img) => { if (!loaded){ loaded = true; onLoaded(img,p); } },
      () => { remaining--; if (remaining === 0 && !loaded) onFail(); }
    );
  }
}

function preload(){
  // background room
  roomImg = loadImage('assets/room.png');

  // lights
  tryLoadMany(['assets/diya.png','assets/Diya.png','assets/diya.PNG'],
    (img,p)=>{ diyaImg = img; }, ()=>{ diyaImg = null; });
  tryLoadMany(['assets/lamp.png','assets/Lamp.png','assets/lamp.PNG'],
    (img,p)=>{ lampImg = img; }, ()=>{ lampImg = null; });

  // player
  tryLoadMany(['assets/Idle.png','assets/idle.png','assets/player_idle.png'],
    (img,p)=>{ playerIdle = img; }, ()=>{ playerIdle = null; });
  tryLoadMany(['assets/Walk.png','assets/walk.png','assets/player_walk.png'],
    (img,p)=>{ playerWalk = img; }, ()=>{ playerWalk = null; });
  tryLoadMany(['assets/Attack.png','assets/attack.png','assets/player_attack.png'],
    (img,p)=>{ playerAttack = img; }, ()=>{ playerAttack = null; });

  // ghost
  tryLoadMany(['assets/ghost walk.png','assets/ghost_walk.png','assets/ghost_walk.PNG','assets/ghostwalk.png'],
    (img,p)=>{ ghostWalkImg = img; }, ()=>{ ghostWalkImg = null; });
  tryLoadMany(['assets/ghost attack.png','assets/ghost_attack.png','assets/ghost_attack.PNG','assets/ghostattack.png'],
    (img,p)=>{ ghostAttackImg = img; }, ()=>{ ghostAttackImg = null; });
  tryLoadMany(['assets/ghost dead.png','assets/ghost_dead.png','assets/ghost_dead.PNG','assets/ghostdead.png'],
    (img,p)=>{ ghostDeadImg = img; }, ()=>{ ghostDeadImg = null; });
}

// ---------- setup ----------
function setup(){
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER); rectMode(CENTER);
  textFont('Georgia');

  roomW = roomImg.width; roomH = roomImg.height;
  computeImagePlacement();

  player.x = imgDrawX + roomW*imgScale/2;
  player.y = imgDrawY + roomH*imgScale/2;
  player.lives = 3;

  detectFrames();
  placeLightsGrid();
  spawnGhostPool(GHOST_START);

  lastGhostAdd = millis() + GHOST_SPAWN_INTERVAL;
  nextGlobalPulse = millis() + GLOBAL_PULSE_INTERVAL;
  lastTime = millis();
  gameState = 2;
}

function computeImagePlacement(){
  const rw = roomImg.width, rh = roomImg.height;
  imgScale = min(width / rw, height / rh);
  imgDrawX = (width - rw * imgScale) / 2;
  imgDrawY = (height - rh * imgScale) / 2;
}

function detectSheetFrames(img){
  if (!img || !img.width || !img.height) return 1;
  let frames = floor(img.width / img.height);
  return max(1, frames);
}
function detectFrames(){
  IDLE_FRAMES = detectSheetFrames(playerIdle);
  WALK_FRAMES = detectSheetFrames(playerWalk);
  ATTACK_FRAMES = detectSheetFrames(playerAttack);
  GHOST_WALK_FRAMES = detectSheetFrames(ghostWalkImg);
  GHOST_ATTACK_FRAMES = detectSheetFrames(ghostAttackImg);
  GHOST_DEAD_FRAMES = detectSheetFrames(ghostDeadImg);
}

// ---------- lights placement ----------
function placeLightsGrid(){
  lights = [];
  const cols = 7;
  const left = imgDrawX + (roomW*imgScale) * 0.08;
  const right = imgDrawX + (roomW*imgScale) * 0.92;
  const gap = (right - left) / (cols - 1);
  const topY = imgDrawY + (roomH*imgScale) * 0.30;
  const midY = imgDrawY + (roomH*imgScale) * 0.50;
  const bottomY = imgDrawY + (roomH*imgScale) * 0.70;

  for (let c=0;c<cols;c++) lights.push({ x:left + c*gap, y:topY, type:'diya', isLit:false, pulsePhase:random(0,TWO_PI) });
  for (let c=0;c<cols;c++) lights.push({ x:left + c*gap, y:bottomY, type:'diya', isLit:false, pulsePhase:random(0,TWO_PI) });

  const lampCols = [0,2,3,4,6];
  for (let i=0;i<lampCols.length;i++){
    const c = lampCols[i];
    lights.push({ x:left + c*gap, y:midY, type:'lamp', isLit:false, pulsePhase:0 });
  }
}

// ---------- Ghost class ----------
class Ghost {
  constructor(x,y){
    this.x = x; this.y = y;
    this.r = max(24, 0.08 * min(width, height));
    this.baseSpeed = random(28, 56);
    this.speed = this.baseSpeed;
    this.alive = true;
    this.state = 'walk'; // 'walk'|'attack'|'dead'
    this.wanderTarget = this.randomTarget();
    this.pulseRadius = 0.30 * min(width, height);
    this.respawnAt = 0;
    this.walkAnimFrame = random(0, GHOST_WALK_FRAMES);
    this.attackAnimFrame = 0;
    this.attached = false;
    this.nextPulseDue = millis() + random(15000, 30000);
  }

  randomTarget(){
    const left = imgDrawX + this.r; const right = imgDrawX + roomW*imgScale - this.r;
    const top = imgDrawY + this.r; const bottom = imgDrawY + roomH*imgScale - this.r;
    return { x: random(left, right), y: random(top, bottom) };
  }

  clampToBounds(){
    const left = imgDrawX + this.r; const right = imgDrawX + roomW*imgScale - this.r;
    const top = imgDrawY + this.r; const bottom = imgDrawY + roomH*imgScale - this.r;
    this.x = constrain(this.x, left, right);
    this.y = constrain(this.y, top, bottom);
  }

  // returns true if within any lit glow radius (i.e., lit area)
  isWithinAnyLightGlow(){
    for (let L of lights){
      if (!L.isLit) continue;
      let glowR = (L.type === 'lamp') ? 0.32 * min(width, height) : 0.28 * min(width, height);
      if (dist(this.x, this.y, L.x, L.y) <= glowR) return true;
    }
    return false;
  }

  // ghost is able to operate only in dark
  isInDarkArea(){
    return !this.isWithinAnyLightGlow();
  }

  avoidLitVector(){
    let ax = 0, ay = 0;
    for (let L of lights){
      if (!L.isLit) continue;
      let d = dist(this.x, this.y, L.x, L.y);
      if (d < this.pulseRadius){
        let vx = this.x - L.x, vy = this.y - L.y;
        let inv = 1 / max(d, 1);
        ax += vx * inv; ay += vy * inv;
      }
    }
    let mag = sqrt(ax*ax + ay*ay) || 1;
    return { x: ax/mag, y: ay/mag };
  }

  repelFromLightsCheck(){
    for (let L of lights){
      if (!L.isLit) continue;
      let glowR = (L.type === 'lamp') ? 0.32 * min(width, height) : 0.28 * min(width, height);
      let d = dist(this.x, this.y, L.x, L.y);
      if (d < glowR * 0.95){
        // push away instantly (strong)
        let vx = this.x - L.x, vy = this.y - L.y; let inv = 1 / max(d, 1);
        this.x += vx * inv * 6;
        this.y += vy * inv * 6;
        this.clampToBounds();
      }
    }
  }

  update(dt){
    if (!this.alive && this.respawnAt > 0 && millis() >= this.respawnAt){
      this.alive = true; this.state = 'walk'; this.respawnAt = 0; this.wanderTarget = this.randomTarget(); this.attached = false;
    }
    if (!this.alive) return;
    if (this.state === 'dead') {
      if (this.respawnAt === 0) this.respawnAt = millis() + 10000; // ensure timer set
      return;
    }

    // If attached, do not wander (pull behavior is handled externally)
    if (this.attached) return;

    // dynamic speed: freeze/slow if any lights lit (global freeze)
    const someLit = lights.some(l => l.isLit);
    let speedFactor = someLit ? GHOST_FREEZE_SPEED_FACTOR : 1;
    let curSpeed = this.baseSpeed * speedFactor;

    // wander with avoid influence
    let dx = this.wanderTarget.x - this.x, dy = this.wanderTarget.y - this.y;
    let d = sqrt(dx*dx + dy*dy);
    if (d < 12) this.wanderTarget = this.randomTarget();
    else {
      dx /= d; dy /= d;
      let avoid = this.avoidLitVector();
      dx += avoid.x * 1.6; dy += avoid.y * 1.6;
      let mag = sqrt(dx*dx + dy*dy) || 1;
      this.x += (dx/mag) * curSpeed * dt;
      this.y += (dy/mag) * curSpeed * dt;
      this.clampToBounds();
    }

    // if accidentally inside a very close lit area -> die
    for (let L of lights){
      if (!L.isLit) continue;
      let deathR = player.size * 1.0;
      if (dist(this.x, this.y, L.x, L.y) <= deathR){
        this.kill('light');
        return;
      }
    }

    // repel if too close to glow
    this.repelFromLightsCheck();

    // scheduled independent pulse (backup if global missed)
    if (millis() > this.nextPulseDue){
      this.nextPulseDue = millis() + random(35000, 50000);
      if (this.isInDarkArea()) this.emitPulse();
    }
  }

  emitPulse(){
    pulses.push(new Pulse(this.x, this.y, this.pulseRadius));
    let litCandidates = lights.filter(l => l.isLit && dist(this.x,this.y,l.x,l.y) <= this.pulseRadius*1.05);
    litCandidates.sort((a,b) => dist(this.x,this.y,a.x,a.y) - dist(this.x,this.y,b.x,b.y));
    let toBlow = min(2, litCandidates.length);
    for (let i=0;i<toBlow;i++){
      litCandidates[i].isLit = false;
      pulses.push(new Pulse(litCandidates[i].x, litCandidates[i].y, 0.08 * min(width,height), true));
    }
  }

  kill(by='player'){
    this.state = 'dead';
    this.alive = false;
    this.attached = false;
    this.respawnAt = millis() + 10000; // 10s respawn
    pulses.push(new Pulse(this.x, this.y, 0.12 * min(width,height), true));
    if (attachedGhost === this){ attachedGhost = null; resetSpam(); }
  }

  draw(){
    if (!this.alive) return;
    if (this.state === 'dead'){
      if (ghostDeadImg) drawSheetFrame(ghostDeadImg, 0, GHOST_DEAD_FRAMES, this.x, this.y, false, this.r*1.6);
      else { push(); noStroke(); fill(140,40,160,160); ellipse(this.x, this.y, this.r*2); pop(); }
      return;
    }

    if (this.attached && ghostAttackImg){
      this.attackAnimFrame = (this.attackAnimFrame + 0.28) % max(1, GHOST_ATTACK_FRAMES);
      drawSheetFrame(ghostAttackImg, floor(this.attackAnimFrame), GHOST_ATTACK_FRAMES, this.x, this.y, false, this.r*1.6);
      return;
    }

    if (ghostWalkImg){
      this.walkAnimFrame = (this.walkAnimFrame + 0.12) % max(1, GHOST_WALK_FRAMES);
      drawSheetFrame(ghostWalkImg, floor(this.walkAnimFrame), GHOST_WALK_FRAMES, this.x, this.y, false, this.r*1.6);
    } else {
      push(); noStroke(); fill(220,90,160,200); ellipse(this.x,this.y,this.r*2); fill(255); ellipse(this.x - this.r*0.32, this.y - this.r*0.22, this.r*0.36); ellipse(this.x + this.r*0.12, this.y - this.r*0.22, this.r*0.28); pop();
    }
  }
}

// Pulse visual
class Pulse {
  constructor(x,y,maxR, quick=false){ this.x=x; this.y=y; this.maxR=maxR; this.t=0; this.dur = quick?600:1200; }
  update(dt){ this.t += dt*1000; }
  draw(){ let prog = constrain(this.t/this.dur,0,1); let r = this.maxR * prog; push(); noFill(); stroke(255,200,100, map(1-prog,0,1,20,200)); strokeWeight(2); ellipse(this.x,this.y,r*2); pop(); }
  done(){ return this.t > this.dur; }
}

// ---------- spawn ----------
function spawnGhostPool(n){
  ghosts = [];
  for (let i=0;i<n;i++) spawnOneGhost();
}
function spawnOneGhost(){
  const gx = random(imgDrawX + 60, imgDrawX + roomW*imgScale - 60);
  const gy = random(imgDrawY + 60, imgDrawY + roomH*imgScale - 60);
  let g = new Ghost(gx, gy);
  g.r = player.size * 1.0;
  ghosts.push(g);
  return g;
}

// ---------- main draw ----------
function draw(){
  const now = millis();
  const dt = lastTime === 0 ? 1/60 : (now - lastTime)/1000;
  lastTime = now;

  background(12);

  // screens
  if (gameState === 0){ drawStart(); return; }
  if (gameState === 3){ drawWin('Diya memories unlocked — you honoured them'); return; }
  if (gameState === 4){ drawWin('Both memory & knowledge unlocked — special memory'); return; }
  if (gameState === 5){ drawWin('Light of knowledge — you questioned and learned'); return; }
  if (gameState === 6){ drawGameOver(); return; }

  // draw room centered & scaled
  push(); translate(imgDrawX, imgDrawY); scale(imgScale); image(roomImg, roomImg.width/2, roomImg.height/2, roomImg.width, roomImg.height); pop();

  // spawn ghosts gradually up to GHOST_MAX
  if (millis() > lastGhostAdd && ghosts.length < GHOST_MAX){
    lastGhostAdd = millis() + GHOST_SPAWN_INTERVAL;
    spawnOneGhost();
  }

  // global pulse: every GLOBAL_PULSE_INTERVAL pick 1-2 ghosts in dark and make them pulse
  if (millis() > nextGlobalPulse){
    nextGlobalPulse = millis() + GLOBAL_PULSE_INTERVAL;
    let pool = ghosts.filter(g => g.alive && g.state !== 'dead' && g.isInDarkArea());
    if (pool.length > 0){
      // pick 1 or 2 ghosts
      let picks = min(pool.length, random() < 0.35 ? 2 : 1);
      shuffle(pool, true);
      for (let i=0;i<picks;i++){
        pool[i].emitPulse();
      }
    }
  }

  // movement input (unless pulled)
  let mvx = 0, mvy = 0;
  if (!attachedGhost){
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) mvx -= 1;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) mvx += 1;
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) mvy -= 1;
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) mvy += 1;
    if (mvx !== 0 && mvy !== 0){ mvx *= 0.7071; mvy *= 0.7071; }
    let nx = player.x + mvx * player.speed * dt;
    let ny = player.y + mvy * player.speed * dt;
    const left = imgDrawX + player.size/2;
    const right = imgDrawX + roomW*imgScale - player.size/2;
    const top = imgDrawY + player.size/2;
    const bottom = imgDrawY + roomH*imgScale - player.size/2;
    player.x = constrain(nx, left, right);
    player.y = constrain(ny, top, bottom);
    if (mvx > 0) anim.facing = 1;
    else if (mvx < 0) anim.facing = -1;
  } else {
    // magnet pull behavior: player lerps strongly towards ghost; ghost stays (attached)
    if (attachedGhost){
      player.x = lerp(player.x, attachedGhost.x, ATTACHED_PULL_STRENGTH);
      player.y = lerp(player.y, attachedGhost.y, ATTACHED_PULL_STRENGTH);
    }
  }

  // update ghosts
  for (let g of ghosts) g.update(dt);

  // update pulses and cleanup
  for (let p of pulses) p.update(dt);
  pulses = pulses.filter(p => !p.done());

  // draw lights (below characters)
  for (let L of lights) drawLightSprite(L);

  // draw pulses (visual)
  for (let p of pulses) p.draw();

  // draw ghosts
  for (let g of ghosts) g.draw();

  // draw glows for lit lights
  for (let L of lights){
    if (L.isLit){
      if (L.type === 'lamp') drawBigYellowGlow(L.x, L.y - 8, 0.32 * min(width,height), 240);
      else {
        const t = millis() * 0.0015 + L.pulsePhase;
        const pulse = (sin(t) * 0.5 + 0.5) * 0.6 + 0.5;
        drawBigYellowGlow(L.x, L.y - 8, 0.28 * pulse * min(width,height), 160 * pulse);
      }
    }
  }

  // process player's queued attacks: if attackPlaying or attackQueue > 0 then check collisions
  processPlayerAttackCollision();

  // when attached: handle spam timer and success/failure
  if (attachedGhost){
    let elapsed = millis() - spamStart;
    if (!spamSuccess && spamCount >= SPAM_TARGET && spamStart > 0 && elapsed <= SPAM_WINDOW){
      spamSuccess = true;
      // keep playing queued attack loops
      if (!anim.attackPlaying && anim.attackQueue > 0){
        anim.attackPlaying = true;
        anim.mode = 'attack';
        anim.frame = 0;
        anim.fps = 20;
      }
    }
    if (!spamSuccess && spamStart > 0 && elapsed > SPAM_WINDOW){
      // failed: lose life and push ghost away
      player.lives = max(0, player.lives - 1);
      detachGhostAndPushAway(attachedGhost, true);
      resetSpam();
      if (player.lives <= 0){ gameState = 6; return; }
    }
  }

  // draw player (advance animations)
  updatePlayerAnim(dt);
  drawPlayerSprite();

  // apply global tint that fades as lights are lit
  const litCount = lights.filter(l => l.isLit).length;
  const fractionLit = litCount / lights.length;
  const tintAlpha = START_TINT * (1 - fractionLit);
  push(); noStroke(); fill(0, 255 * tintAlpha); rectMode(CORNER); rect(0, 0, width, height); pop();

  // UI
  drawUI();

  // check win conditions (diya-only, full, lamps-only)
  checkWinConditions();

  // attachment detection: only if both ghost and player are in dark and within attachDistance
  if (!attachedGhost){
    const attachDistance = 48; // tight magnet distance
    for (let g of ghosts){
      if (!g.alive || g.state === 'dead') continue;
      if (!g.isInDarkArea()) continue;                // ghost must be in dark
      if (!isPlayerInDarkArea()) continue;           // player must be in dark
      if (dist(g.x, g.y, player.x, player.y) <= attachDistance){
        // attach: ghost stops moving (handled by its attached flag)
        attachedGhost = g;
        g.attached = true;
        g.state = 'attack';
        spamCount = 0; spamStart = millis(); spamSuccess = false;
        // queue one attack anim so the player sees pushback animation when spamming
        anim.attackQueue = max(0, anim.attackQueue);
        break;
      }
    }
  }

  // ensure ghost population grows to GHOST_MAX (spawn handled above)
}

// ---------- helper: update player animation with precise dt-driven frames ----------
function updatePlayerAnim(dt){
  // when attack queue exists or attackPlaying, we must play full loops for each queued press
  if (anim.attackPlaying || anim.attackQueue > 0){
    if (!anim.attackPlaying && anim.attackQueue > 0){
      // start a loop
      anim.attackPlaying = true;
      anim.mode = 'attack';
      anim.frame = 0;
      anim.fps = 18;
    }
    if (anim.attackPlaying){
      anim.frame += anim.fps * dt;
      if (ATTACK_FRAMES > 0 && anim.frame >= ATTACK_FRAMES){
        // one full loop completed
        anim.frame = 0;
        if (anim.attackQueue > 0) {
          anim.attackQueue--; // consume one queued press (each press = a full loop)
          // continue playing next loop automatically if more queued
          if (anim.attackQueue <= 0){
            anim.attackPlaying = false;
            anim.mode = (!attachedGhost && (keyIsDown(65)||keyIsDown(68)||keyIsDown(87)||keyIsDown(83))) ? 'walk' : 'idle';
            anim.fps = anim.mode === 'walk' ? 10 : 6;
          }
        } else {
          // no queued loops left
          anim.attackPlaying = false;
          anim.mode = (!attachedGhost && (keyIsDown(65)||keyIsDown(68)||keyIsDown(87)||keyIsDown(83))) ? 'walk' : 'idle';
          anim.fps = anim.mode === 'walk' ? 10 : 6;
        }
      }
    }
    return;
  }

  // not attacking: set mode based on movement
  const moving = (keyIsDown(65)||keyIsDown(68)||keyIsDown(87)||keyIsDown(83));
  if (moving && !attachedGhost){
    if (anim.mode !== 'walk'){ anim.mode = 'walk'; anim.frame = 0; anim.fps = 10; }
    anim.frame += anim.fps * dt;
    if (WALK_FRAMES > 0) anim.frame = anim.frame % WALK_FRAMES;
  } else {
    if (anim.mode !== 'idle'){ anim.mode = 'idle'; anim.frame = 0; anim.fps = 6; }
    anim.frame += anim.fps * dt;
    if (IDLE_FRAMES > 0) anim.frame = anim.frame % IDLE_FRAMES;
  }
}

// ---------- input handlers ----------
function keyPressed(){
  if (gameState !== 2) return;
  if (key.toLowerCase() === 'e'){
    // toggle nearest light
    let nearest = null, md = 1e9;
    for (let L of lights){
      let d = dist(player.x, player.y, L.x, L.y);
      if (d < md){ md = d; nearest = L; }
    }
    if (nearest && md <= LIGHT_RANGE){
      nearest.isLit = !nearest.isLit;
      // when lighting, push away / kill nearest ghost if needed (small feedback)
      if (nearest.isLit){
        let alive = ghosts.filter(g => g.alive && g.state !== 'dead');
        if (alive.length){
          alive.sort((a,b) => dist(a.x,a.y,nearest.x,nearest.y) - dist(b.x,b.y,nearest.x,nearest.y));
          alive[0].kill('light'); // kill nearest ghost as they get into light
        }
      }
    }
  } else if (key.toLowerCase() === 'q'){
    // Q-spam mechanic and attack queue
    if (attachedGhost){
      if (spamStart === 0) spamStart = millis();
      spamCount++;
      anim.attackQueue++; // each press queues a full loop
      if (!anim.attackPlaying){ anim.attackPlaying = true; anim.mode = 'attack'; anim.frame = 0; anim.fps = 18; }
    } else {
      // if not attached, Q triggers attack animation loops (combo)
      anim.attackQueue++;
      if (!anim.attackPlaying){ anim.attackPlaying = true; anim.mode = 'attack'; anim.frame = 0; anim.fps = 18; }
    }
  }
}

function keyReleased(){
  if (gameState !== 2) return;
  if (key.toLowerCase() === 'q'){
    if (spamSuccess && attachedGhost){
      // when spam is successful, require player to release Q to push ghost away
      detachGhostAndPushAway(attachedGhost, false);
      resetSpam();
    }
  }
}

function mousePressed(){
  // used for menus / replay buttons via mouseClicked()
}

// ---------- attack collision ----------
function processPlayerAttackCollision(){
  const isAttacking = anim.attackPlaying || anim.attackQueue > 0;
  if (!isAttacking) return;
  const atkR = player.size * 1.2;
  for (let g of ghosts){
    if (!g.alive) continue;
    if (g.state === 'dead') continue;
    if (dist(player.x, player.y, g.x, g.y) <= atkR){
      g.kill('player');
    }
  }
}

// ---------- detach and push away ----------
function detachGhostAndPushAway(g, penalty=false){
  if (!g) return;
  g.attached = false;
  if (attachedGhost === g) attachedGhost = null;
  g.state = 'walk';
  // push to far corner away from player
  const corners = [
    {x: imgDrawX + 40, y: imgDrawY + 40},
    {x: imgDrawX + roomW*imgScale - 40, y: imgDrawY + 40},
    {x: imgDrawX + 40, y: imgDrawY + roomH*imgScale - 40},
    {x: imgDrawX + roomW*imgScale - 40, y: imgDrawY + roomH*imgScale - 40}
  ];
  corners.sort((a,b) => dist(player.x, player.y, b.x, b.y) - dist(player.x, player.y, a.x, a.y));
  const corner = corners[0];
  g.x = corner.x + random(-40,40); g.y = corner.y + random(-40,40);
  g.wanderTarget = g.randomTarget();
  g.nextPulseDue = millis() + random(15000, 30000);
  pulses.push(new Pulse(g.x, g.y, 0.12 * min(width,height), true));
  if (penalty) g.nextPulseDue += 5000;
}

// ---------- reset spam ----------
function resetSpam(){ spamCount = 0; spamStart = 0; spamSuccess = false; anim.attackQueue = 0; anim.attackPlaying = false; }

// ---------- win/game logic ----------
function checkWinConditions(){
  const diyasLit = lights.filter(l => l.type === 'diya' && l.isLit).length;
  const lampsLit = lights.filter(l => l.type === 'lamp' && l.isLit).length;

  if (diyasLit === DIYA_COUNT && lampsLit === LAMP_COUNT){
    ghosts.forEach(g => { g.alive = false; g.state = 'dead'; });
    gameState = 4;
    return;
  }
  if (diyasLit === DIYA_COUNT){
    ghosts.forEach(g => { g.alive = false; g.state = 'dead'; });
    gameState = 3;
    return;
  }
  if (lampsLit === LAMP_COUNT && diyasLit < DIYA_COUNT){
    gameState = 5;
    return;
  }
}

// ---------- draw helpers ----------
function drawLightSprite(L){
  push(); translate(L.x, L.y); noStroke();
  fill(20,20); ellipse(0, 6 * imgScale, 30 * imgScale, 10 * imgScale);
  if (L.type === 'lamp'){
    if (lampImg){
      const fh = lampImg.height, fw = lampImg.width;
      const scaleFactor = (player.size / max(fw, fh)) * 1.0;
      image(lampImg, 0, -6 * imgScale, fw * scaleFactor, fh * scaleFactor);
    } else {
      fill(80); rect(0, -10 * imgScale, 28 * imgScale, 44 * imgScale, 6 * imgScale);
      fill(255,220,120); ellipse(0, -34 * imgScale, 12 * imgScale, 12 * imgScale);
    }
  } else {
    if (diyaImg){
      const fh = diyaImg.height, fw = diyaImg.width;
      const scaleFactor = (player.size / max(fw, fh)) * 0.45;
      image(diyaImg, 0, -6 * imgScale, fw * scaleFactor, fh * scaleFactor);
    } else {
      fill(90,60,30); ellipse(0, -6 * imgScale, 14 * imgScale, 8 * imgScale);
      if (L.isLit){ fill(255,170,50); ellipse(0, -14 * imgScale, 6 * imgScale, 8 * imgScale); }
    }
  }
  pop();
}

function drawBigYellowGlow(cx, cy, radius, alpha){
  push(); const g = drawingContext;
  const grad = g.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, `rgba(255,240,160,${alpha/255})`);
  grad.addColorStop(0.2, `rgba(255,200,90,${(alpha*0.7)/255})`);
  grad.addColorStop(0.5, `rgba(200,120,60,${(alpha*0.35)/255})`);
  grad.addColorStop(1, `rgba(0,0,0,0)`);
  g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, radius, 0, TWO_PI); g.fill();
  pop();
}

function drawPlayerSprite(){
  if (!player.size || player.size < 8) player.size = 48;
  let frameIdx = 0;
  let flip = (anim.facing === -1);

  if (anim.mode === 'attack' && playerAttack){
    frameIdx = ATTACK_FRAMES ? floor(anim.frame % ATTACK_FRAMES) : 0;
    drawSheetFrame(playerAttack, frameIdx, ATTACK_FRAMES, player.x, player.y, flip, player.size*1.4);
    return;
  }
  if (anim.mode === 'walk' && playerWalk){
    frameIdx = WALK_FRAMES ? floor(anim.frame % WALK_FRAMES) : 0;
    drawSheetFrame(playerWalk, frameIdx, WALK_FRAMES, player.x, player.y, flip, player.size*1.4);
    return;
  }
  if (anim.mode === 'idle' && playerIdle){
    frameIdx = IDLE_FRAMES ? floor(anim.frame % IDLE_FRAMES) : 0;
    drawSheetFrame(playerIdle, frameIdx, IDLE_FRAMES, player.x, player.y, flip, player.size*1.4);
    return;
  }

  // fallback simple rect
  push(); translate(player.x, player.y); if (flip) scale(-1,1); stroke(0); strokeWeight(2); fill(255,200,40); rectMode(CENTER); rect(0,0, player.size*1.1, player.size*1.1, 6); fill(30); ellipse((anim.facing===1 ? player.size*0.18 : -player.size*0.18), -player.size*0.12, max(3, player.size*0.08), max(3, player.size*0.08)); pop();
}

function drawSheetFrame(img, frameIdx, framesTotal, x, y, flip=false, targetSize=null){
  if (!img || framesTotal <= 0) return;
  let fh = img.height, fw = img.width / framesTotal;
  let sx = Math.floor(frameIdx % framesTotal) * fw;
  push(); translate(x, y); if (flip) scale(-1,1); imageMode(CENTER);
  let sizeBase = targetSize || player.size;
  let targetScale = sizeBase / max(fw, fh) * 1.4;
  image(img, 0, 0, fw * targetScale, fh * targetScale, sx, 0, fw, fh);
  pop();
}

// ---------- utility: is player in dark ----------
function isPlayerInDarkArea(){
  for (let L of lights){
    if (!L.isLit) continue;
    let glowR = (L.type === 'lamp') ? 0.32*min(width,height) : 0.28*min(width,height);
    if (dist(player.x, player.y, L.x, L.y) <= glowR) return false;
  }
  return true;
}

// ---------- input events ----------
function keyPressed(){
  if (gameState !== 2) return;
  if (key.toLowerCase() === 'e'){
    // toggle nearest light within range
    let nearest = null, md = 1e9;
    for (let L of lights){
      let d = dist(player.x, player.y, L.x, L.y);
      if (d < md){ md = d; nearest = L; }
    }
    if (nearest && md <= LIGHT_RANGE){
      nearest.isLit = !nearest.isLit;
      // small reaction: lighting kills nearest ghosts that are too close to that light
      if (nearest.isLit){
        let alive = ghosts.filter(g => g.alive && g.state !== 'dead');
        if (alive.length){
          alive.sort((a,b) => dist(a.x,a.y,nearest.x,nearest.y) - dist(b.x,b.y,nearest.x,nearest.y));
          // small chance to only push away instead of kill—here we kill if too close
          if (dist(alive[0].x, alive[0].y, nearest.x, nearest.y) < player.size*1.5) alive[0].kill('light');
        }
      }
    }
  } else if (key.toLowerCase() === 'q'){
    if (attachedGhost){
      if (spamStart === 0) spamStart = millis();
      spamCount++;
      anim.attackQueue++;
      if (!anim.attackPlaying){
        anim.attackPlaying = true;
        anim.mode = 'attack';
        anim.frame = 0;
        anim.fps = 18;
      }
    } else {
      anim.attackQueue++;
      if (!anim.attackPlaying){
        anim.attackPlaying = true;
        anim.mode = 'attack';
        anim.frame = 0;
        anim.fps = 18;
      }
    }
  }
}
function keyReleased(){
  if (gameState !== 2) return;
  if (key.toLowerCase() === 'q'){
    if (spamSuccess && attachedGhost){
      // release only when Q released after success
      detachGhostAndPushAway(attachedGhost, false);
      resetSpam();
    }
  }
}

function mouseClicked(){
  // replay/menus handled elsewhere
}

// ---------- detach / respawn helpers ----------
function detachGhostAndPushAway(g, penalty=false){
  if (!g) return;
  g.attached = false;
  if (attachedGhost === g) attachedGhost = null;
  g.state = 'walk';
  const corners = [
    {x: imgDrawX + 40, y: imgDrawY + 40},
    {x: imgDrawX + roomW*imgScale - 40, y: imgDrawY + 40},
    {x: imgDrawX + 40, y: imgDrawY + roomH*imgScale - 40},
    {x: imgDrawX + roomW*imgScale - 40, y: imgDrawY + roomH*imgScale - 40}
  ];
  corners.sort((a,b) => dist(player.x, player.y, b.x, b.y) - dist(player.x, player.y, a.x, a.y));
  const corner = corners[0];
  g.x = corner.x + random(-40,40);
  g.y = corner.y + random(-40,40);
  g.wanderTarget = g.randomTarget();
  g.nextPulseDue = millis() + random(15000, 30000);
  pulses.push(new Pulse(g.x, g.y, 0.12 * min(width, height), true));
  if (penalty) g.nextPulseDue += 5000;
}

// ---------- reset spam ----------
function resetSpam(){ spamCount = 0; spamStart = 0; spamSuccess = false; anim.attackQueue = 0; anim.attackPlaying = false; }

// ---------- UI & screens ----------
function drawUI(){
  push();
  fill(255); textSize(12); textAlign(LEFT, TOP);
  text('Lit: ' + lights.filter(l=>l.isLit).length + '/' + lights.length, 10, 10);
  for (let i=0;i<3;i++){ let x = 10 + i*26, y = 36; fill(i < player.lives ? color(255,80,80) : color(80)); rectMode(CORNER); rect(x,y,20,14,3); }
  if (attachedGhost){ textAlign(CENTER, TOP); textSize(14); text(`Pulled! Press Q (${spamCount}/${SPAM_TARGET})`, width/2, 10); if (spamSuccess) text('Release Q to push ghost away', width/2, 34); }
  pop();
}

function drawStart(){
  background(12);
  fill(255); textAlign(CENTER, CENTER); textSize(46); text('AWAY FROM HOME', width/2, height/2 - 80);
  fill(255,40,80); rect(width/2, height/2 + 40, 160, 44, 8); fill(255); textSize(16); text('START', width/2, height/2 + 40);
}
function drawWin(msg){
  background(12);
  fill(255); textAlign(CENTER, CENTER); textSize(36); text('YOU WIN', width/2, height/2 - 40);
  textSize(16); text(msg, width/2, height/2);
  fill(255,40,80); rect(width/2, height/2 + 80, 160, 44, 8); fill(255); textSize(14); text('REPLAY', width/2, height/2 + 80);
}
function drawGameOver(){
  background(6);
  fill(255); textAlign(CENTER, CENTER); textSize(44); text('GAME OVER', width/2, height/2 - 60);
  textSize(18); text('You followed the darkness too far — replay to try again.', width/2, height/2 - 18);
  fill(255,40,80); rect(width/2, height/2 + 50, 160, 44, 8); fill(255); textSize(16); text('REPLAY', width/2, height/2 + 50);
}

// replay / restart controls
function mouseClicked(){
  if ([3,4,5].includes(gameState)){
    const bx = width/2, by = height/2 + 80, bw = 160, bh = 44;
    if (mouseX >= bx-bw/2 && mouseX <= bx+bw/2 && mouseY >= by-bh/2 && mouseY <= by+bh/2) restartGame();
  } else if (gameState === 6){
    const bx = width/2, by = height/2 + 50, bw = 160, bh = 44;
    if (mouseX >= bx-bw/2 && mouseX <= bx+bw/2 && mouseY >= by-bh/2 && mouseY <= by+bh/2) restartGame();
  } else if (gameState === 0){
    const bx = width/2, by = height/2 + 40, bw = 160, bh = 44;
    if (mouseX >= bx-bw/2 && mouseX <= bx+bw/2 && mouseY >= by-bh/2 && mouseY <= by+bh/2){ gameState = 2; resetSpam(); }
  }
}
function restartGame(){
  for (let L of lights) L.isLit = false;
  player.lives = 3; attachedGhost = null; resetSpam();
  placeLightsGrid(); spawnGhostPool(GHOST_START);
  lastGhostAdd = millis() + GHOST_SPAWN_INTERVAL;
  nextGlobalPulse = millis() + GLOBAL_PULSE_INTERVAL;
  gameState = 2;
}

// ---------- check wins, helper functions ----------
function checkWinConditions(){
  const diyasLit = lights.filter(l => l.type==='diya' && l.isLit).length;
  const lampsLit = lights.filter(l => l.type==='lamp' && l.isLit).length;

  if (diyasLit === DIYA_COUNT && lampsLit === LAMP_COUNT){
    ghosts.forEach(g => { g.alive = false; g.state = 'dead'; });
    gameState = 4; return;
  }
  if (diyasLit === DIYA_COUNT){
    ghosts.forEach(g => { g.alive = false; g.state = 'dead'; });
    gameState = 3; return;
  }
  if (lampsLit === LAMP_COUNT && diyasLit < DIYA_COUNT){
    gameState = 5; return;
  }
}

// ---------- utility functions ----------
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

// ---------- window resize ----------
function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  computeImagePlacement();
  placeLightsGrid();
  spawnGhostPool(GHOST_START);
  player.x = imgDrawX + roomW*imgScale/2;
  player.y = imgDrawY + roomH*imgScale/2;
}
