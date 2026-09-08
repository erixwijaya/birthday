/* ============ background decorative blobs ============ */
(function bgDecor(){
  const holder = document.getElementById('bgDecor');
  if(!holder) return;
  const colors = ['#FF6F91','#FFC93C','#4FB6E8','#4ED9B0'];
  const count = window.innerWidth < 600 ? 5 : 8;
  for(let i=0;i<count;i++){
    const b = document.createElement('div');
    b.className='blob';
    const size = 60 + Math.random()*140;
    b.style.width=size+'px';
    b.style.height=size+'px';
    b.style.left=Math.random()*100+'%';
    b.style.top=Math.random()*100+'%';
    b.style.background=colors[i%colors.length];
    holder.appendChild(b);
  }
})();

/* ============ gallery population ============ */
(function renderGallery(){
  const gallery = document.getElementById('gallery');
  if(!gallery || typeof PHOTOS === 'undefined') return;
  const keys = Object.keys(PHOTOS);
  keys.forEach((k)=>{
    const div = document.createElement('div');
    div.className='polaroid';
    div.innerHTML = '<div class="tape"></div><img loading="lazy" src="'+PHOTOS[k]+'" alt="kenangan">';
    gallery.appendChild(div);
  });
  // braga strip: reuse a couple of photos
  const strip = document.getElementById('bragaStrip');
  if(strip){
    [keys[10], keys[1], keys[6]].filter(Boolean).forEach(k=>{
      const img=document.createElement('img');
      img.src=PHOTOS[k];
      img.loading='lazy';
      strip.appendChild(img);
    });
  }
})();

/* ============ confetti engine (canvas) ============ */
const confettiCanvas = document.getElementById('confetti-canvas');
const ctx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
function resizeCanvas(){
  if(!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let particles = [];
const confettiColors = ['#FF6F91','#FFC93C','#4FB6E8','#4ED9B0','#FFFFFF'];

function spawnConfetti(x, y, amount){
  for(let i=0;i<amount;i++){
    particles.push({
      x: x, y: y,
      vx: (Math.random()-0.5)*11,
      vy: (Math.random()*-13)-4,
      size: 5+Math.random()*6,
      color: confettiColors[Math.floor(Math.random()*confettiColors.length)],
      rot: Math.random()*360,
      vr: (Math.random()-0.5)*14,
      life: 0,
      shape: Math.random()>0.5?'rect':'circle'
    });
  }
}

function animateConfetti(){
  if(!ctx || !confettiCanvas) return;
  ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  particles.forEach(p=>{
    p.vy += 0.28; // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life += 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot*Math.PI/180);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, 1 - p.life/240);
    if(p.shape==='rect'){
      ctx.fillRect(-p.size/2, -p.size/2*0.6, p.size, p.size*0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0,0,p.size/2,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  });
  particles = particles.filter(p=> p.y < confettiCanvas.height + 40 && p.life < 260);
  requestAnimationFrame(animateConfetti);
}
animateConfetti();

/* ============ fireworks engine (canvas) ============ */
const fwCanvas = document.getElementById('fireworks-canvas');
const fwCtx = fwCanvas ? fwCanvas.getContext('2d') : null;
function resizeFwCanvas(){
  if(!fwCanvas) return;
  fwCanvas.width = window.innerWidth;
  fwCanvas.height = window.innerHeight;
}
resizeFwCanvas();
window.addEventListener('resize', resizeFwCanvas);

let fwRockets = [];
let fwSparks = [];
let isFireworksRunning = false;
let fwInterval = null;

const fwPalette = [
  '#FF4081', '#FF6F91', '#FFC93C', '#4FB6E8', '#4ED9B0',
  '#FFD700', '#FF85A2', '#A29BFE', '#FD79A8', '#00CEC9', '#FFFFFF'
];

class Rocket {
  constructor(startX, startY, targetX, targetY, color){
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.distanceToTarget = Math.hypot(targetX - startX, targetY - startY);
    this.distanceTraveled = 0;
    this.coordinates = [];
    this.coordinateCount = 4;
    while(this.coordinateCount--){
      this.coordinates.push([this.x, this.y]);
    }
    this.angle = Math.atan2(targetY - startY, targetX - startX);
    this.speed = 2.5;
    this.acceleration = 1.04;
    this.color = color || fwPalette[Math.floor(Math.random() * fwPalette.length)];
  }
  update(index){
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    this.speed *= this.acceleration;
    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    this.distanceTraveled = Math.hypot(this.x + vx - this.startX, this.y + vy - this.startY);
    if(this.distanceTraveled >= this.distanceToTarget){
      createExplosion(this.targetX, this.targetY, this.color);
      fwRockets.splice(index, 1);
    } else {
      this.x += vx;
      this.y += vy;
    }
  }
  draw(){
    if(!fwCtx) return;
    fwCtx.beginPath();
    fwCtx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    fwCtx.lineTo(this.x, this.y);
    fwCtx.strokeStyle = this.color;
    fwCtx.lineWidth = 3;
    fwCtx.stroke();
  }
}

class Spark {
  constructor(x, y, color){
    this.x = x;
    this.y = y;
    this.coordinates = [];
    this.coordinateCount = 5;
    while(this.coordinateCount--){
      this.coordinates.push([this.x, this.y]);
    }
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 7 + 1.5;
    this.friction = 0.95;
    this.gravity = 0.85;
    this.color = color;
    this.alpha = 1;
    this.decay = Math.random() * 0.016 + 0.012;
  }
  update(index){
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    this.speed *= this.friction;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed + this.gravity;
    this.alpha -= this.decay;
    if(this.alpha <= this.decay){
      fwSparks.splice(index, 1);
    }
  }
  draw(){
    if(!fwCtx) return;
    fwCtx.beginPath();
    fwCtx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    fwCtx.lineTo(this.x, this.y);
    fwCtx.strokeStyle = this.color;
    fwCtx.globalAlpha = Math.max(0, this.alpha);
    fwCtx.lineWidth = 2.2;
    fwCtx.stroke();
    fwCtx.globalAlpha = 1;
  }
}

function createExplosion(x, y, color){
  const sparkCount = 65;
  for(let i = 0; i < sparkCount; i++){
    fwSparks.push(new Spark(x, y, color));
  }
}

function launchSingleFirework(targetX, targetY){
  if(!fwCanvas) return;
  const startX = window.innerWidth * 0.15 + Math.random() * (window.innerWidth * 0.7);
  const startY = window.innerHeight;
  const tx = targetX !== undefined ? targetX : (window.innerWidth * 0.1 + Math.random() * (window.innerWidth * 0.8));
  const ty = targetY !== undefined ? targetY : (window.innerHeight * 0.1 + Math.random() * (window.innerHeight * 0.45));
  const color = fwPalette[Math.floor(Math.random() * fwPalette.length)];
  fwRockets.push(new Rocket(startX, startY, tx, ty, color));
}

function animateFireworks(){
  if(!fwCtx || !fwCanvas) return;
  requestAnimationFrame(animateFireworks);
  if(!isFireworksRunning && fwRockets.length === 0 && fwSparks.length === 0){
    fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
    return;
  }
  fwCtx.globalCompositeOperation = 'destination-out';
  fwCtx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);
  fwCtx.globalCompositeOperation = 'lighter';

  let i = fwRockets.length;
  while(i--){
    fwRockets[i].draw();
    fwRockets[i].update(i);
  }
  let j = fwSparks.length;
  while(j--){
    fwSparks[j].draw();
    fwSparks[j].update(j);
  }
}
animateFireworks();

function startFireworksShow(){
  if(!fwCanvas) return;
  fwCanvas.classList.add('active');
  isFireworksRunning = true;

  // Immediate salvo
  launchSingleFirework(window.innerWidth * 0.3, window.innerHeight * 0.25);
  setTimeout(()=> launchSingleFirework(window.innerWidth * 0.7, window.innerHeight * 0.22), 250);
  setTimeout(()=> launchSingleFirework(window.innerWidth * 0.5, window.innerHeight * 0.18), 500);

  // Periodic launches
  clearInterval(fwInterval);
  fwInterval = setInterval(()=>{
    if(!isFireworksRunning) return;
    launchSingleFirework();
    if(Math.random() > 0.5){
      setTimeout(launchSingleFirework, 220);
    }
  }, 1200);
}

/* ============ BACKGROUND MUSIC (Happy Birthday!.mp3) ============ */
const bgm = document.getElementById('bgm');
let isMusicActive = false;

function updateMusicUI(isPlaying){
  isMusicActive = !!isPlaying;
  const musicBtn = document.getElementById('music-toggle');
  const musicPill = document.getElementById('music-pill');
  if(musicBtn){
    if(isPlaying){
      musicBtn.classList.add('playing');
      musicBtn.textContent = '⏸️';
      musicBtn.title = 'Jeda Musik (Happy Birthday)';
    } else {
      musicBtn.classList.remove('playing');
      musicBtn.textContent = '🎵';
      musicBtn.title = 'Putar Musik (Happy Birthday)';
    }
  }
  if(musicPill){
    if(isPlaying){
      musicPill.classList.add('playing');
    } else {
      musicPill.classList.remove('playing');
    }
  }
}

if(bgm){
  bgm.addEventListener('play', () => updateMusicUI(true));
  bgm.addEventListener('pause', () => updateMusicUI(false));
  bgm.addEventListener('ended', () => updateMusicUI(false));
}

function playYtMusic(){
  if(!bgm) return;
  bgm.volume = 1.0;
  const p = bgm.play();
  if(p !== undefined){
    p.then(()=>{
      updateMusicUI(true);
    }).catch(err=>{
      console.warn('Playback waiting for user gesture:', err);
    });
  }
}

function pauseYtMusic(){
  if(!bgm) return;
  bgm.pause();
  updateMusicUI(false);
}

function isYtMusicPlayingNow(){
  return bgm && !bgm.paused;
}

function toggleYtMusic(){
  if(isYtMusicPlayingNow()){
    pauseYtMusic();
  } else {
    playYtMusic();
  }
}

/* ============ GATE LOCK & ENVELOPE OPENING ============ */
const gate = document.getElementById('gate');
const envelope = document.getElementById('envelope');
const envHeart = document.getElementById('envHeart');
const gateTimer = document.getElementById('gateTimer');
const gtHours = document.getElementById('gt-hours');
const gtMins = document.getElementById('gt-mins');
const gtSecs = document.getElementById('gt-secs');
const tapHint = document.getElementById('tapHint');
const gateLockToast = document.getElementById('gateLockToast');
const gateTitle = document.getElementById('gateTitle');

let toastTimeout = null;
function showGateToast(msg){
  if(!gateLockToast) return;
  gateLockToast.textContent = msg;
  gateLockToast.style.display = 'block';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=>{
    gateLockToast.style.display = 'none';
  }, 2500);
}

// Secret testing feature: double-click gate title or use ?unlock=1
let testUnlocked = new URLSearchParams(window.location.search).get('unlock') === '1';
if(gateTitle){
  gateTitle.addEventListener('dblclick', ()=>{
    testUnlocked = true;
    updateGateLockState();
    showGateToast('Mode Pengujian: Amplop Terbuka! 🔓✨');
  });
}

function getUnlockTime(now){
  const year = now.getFullYear();
  let target = new Date(year, 8, 9, 0, 0, 0); // 9 September 00:00:00
  if(now > new Date(year, 8, 9, 23, 59, 59)){
    target = new Date(year + 1, 8, 9, 0, 0, 0);
  }
  return target;
}

function isEnvelopeUnlocked(){
  if(testUnlocked) return true;
  const now = new Date();
  const unlockTarget = getUnlockTime(now);
  return now >= unlockTarget;
}

let opened = false;

function updateGateLockState(){
  if(opened) return;
  const now = new Date();
  const unlockTarget = getUnlockTime(now);
  let diff = unlockTarget - now;

  if(isEnvelopeUnlocked() || diff <= 0){
    // UNLOCKED!
    if(envHeart) envHeart.textContent = '💌';
    if(gateTimer) gateTimer.style.display = 'none';
    if(tapHint) tapHint.textContent = '✨ Waktunya telah tiba! Tap amplopnya ✨';
    if(envelope) envelope.classList.remove('locked');
  } else {
    // LOCKED!
    if(envHeart) envHeart.textContent = '🔒';
    if(gateTimer) gateTimer.style.display = 'inline-flex';
    if(envelope) envelope.classList.add('locked');

    const totalSecs = Math.max(0, Math.floor(diff / 1000));
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    if(gtHours) gtHours.textContent = String(h).padStart(2, '0');
    if(gtMins) gtMins.textContent = String(m).padStart(2, '0');
    if(gtSecs) gtSecs.textContent = String(s).padStart(2, '0');
    if(tapHint) tapHint.textContent = '(terkunci sampai 9 September 00:00)';
  }
}
updateGateLockState();
setInterval(updateGateLockState, 1000);

function handleEnvelopeClick(e){
  if(opened) return;
  if(e) e.preventDefault();

  if(!isEnvelopeUnlocked()){
    if(envelope){
      envelope.classList.remove('shake');
      void envelope.offsetWidth;
      envelope.classList.add('shake');
    }
    showGateToast('Sabar yaa, amplop baru bisa dibuka pukul 00:00 tgl 9 September! ⏳💖');
    return;
  }

  // 1. Mark as opened
  opened = true;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.4;

  // 2. Confetti burst
  spawnConfetti(cx, cy, 160);
  setTimeout(()=> spawnConfetti(cx * 0.3, cy, 70), 160);
  setTimeout(()=> spawnConfetti(cx * 1.7, cy, 70), 260);

  // 3. FIREWORKS SPECTACULAR
  startFireworksShow();

  // 4. Play background music (Happy Birthday!.mp3)
  playYtMusic();

  // 5. Slide open the gate
  if(gate) gate.classList.add('opened');
  document.body.style.overflow = 'auto';

  // 6. Trigger birthday greeting banner immediately if 9 September
  const now = new Date();
  if(now.getMonth() === 8 && now.getDate() === 9){
    const gridEl = document.getElementById('countGrid');
    const todayEl = document.getElementById('countToday');
    const countTitle = document.getElementById('countSectionTitle');
    const countSub = document.getElementById('countSectionSub');
    if(gridEl) gridEl.style.display = 'none';
    if(todayEl) todayEl.style.display = 'block';
    if(countTitle) countTitle.textContent = 'Hari Spesial Telah Tiba! 🎉';
    if(countSub) countSub.textContent = 'Selamat Ulang Tahun yang Terindah~ 💖';
  }
}

if(envelope){
  envelope.addEventListener('click', handleEnvelopeClick);
  envelope.addEventListener('touchend', handleEnvelopeClick, {passive:false});
}

/* lock scroll until opened */
document.body.style.overflow='hidden';

/* ============ COUNTDOWN LOGIC ============ */
(function countdown(){
  const daysEl=document.getElementById('cd-days');
  const hoursEl=document.getElementById('cd-hours');
  const minsEl=document.getElementById('cd-mins');
  const secsEl=document.getElementById('cd-secs');
  const todayEl=document.getElementById('countToday');
  const gridEl=document.getElementById('countGrid');
  const countTitle=document.getElementById('countSectionTitle');
  const countSub=document.getElementById('countSectionSub');
  const btnLaunchFireworks=document.getElementById('btnLaunchFireworks');

  let fireworksStarted = false;

  function nextBirthday(now){
    let year = now.getFullYear();
    let target = new Date(year, 8, 9, 0, 0, 0);
    if (target < now && !isBirthdayToday(now)){
      target = new Date(year + 1, 8, 9, 0, 0, 0);
    }
    return target;
  }

  function isBirthdayToday(now){
    return now.getMonth() === 8 && now.getDate() === 9;
  }

  function triggerBirthdayArrival(){
    if(gridEl) gridEl.style.display='none';
    if(todayEl) todayEl.style.display='block';
    if(countTitle) countTitle.textContent = 'Hari Spesial Telah Tiba! 🎉';
    if(countSub) countSub.textContent = 'Selamat Ulang Tahun yang Terindah~ 💖';

    if(!fireworksStarted){
      fireworksStarted = true;
      startFireworksShow();
      spawnConfetti(window.innerWidth * 0.5, window.innerHeight * 0.35, 90);
      setTimeout(()=> spawnConfetti(window.innerWidth * 0.2, window.innerHeight * 0.45, 60), 300);
      setTimeout(()=> spawnConfetti(window.innerWidth * 0.8, window.innerHeight * 0.45, 60), 600);
    }
  }

  if(btnLaunchFireworks){
    btnLaunchFireworks.addEventListener('click', function(e){
      e.stopPropagation();
      launchSingleFirework(window.innerWidth * 0.35, window.innerHeight * 0.25);
      setTimeout(()=> launchSingleFirework(window.innerWidth * 0.65, window.innerHeight * 0.22), 200);
      setTimeout(()=> launchSingleFirework(window.innerWidth * 0.5, window.innerHeight * 0.18), 450);
      spawnConfetti(window.innerWidth * 0.5, window.innerHeight * 0.4, 50);
    });
  }

  if(todayEl){
    todayEl.addEventListener('click', function(e){
      launchSingleFirework(e.clientX, e.clientY);
    });
  }

  function tick(){
    const now = new Date();
    if (isBirthdayToday(now)){
      triggerBirthdayArrival();
      return;
    }
    const target = nextBirthday(now);
    let diff = target - now;
    if (diff <= 0){
      triggerBirthdayArrival();
      return;
    }
    if(gridEl) gridEl.style.display='grid';
    if(todayEl) todayEl.style.display='none';
    const d = Math.floor(diff/(1000*60*60*24));
    diff -= d*(1000*60*60*24);
    const h = Math.floor(diff/(1000*60*60));
    diff -= h*(1000*60*60);
    const m = Math.floor(diff/(1000*60));
    diff -= m*(1000*60);
    const s = Math.floor(diff/1000);
    if(daysEl) daysEl.textContent=d;
    if(hoursEl) hoursEl.textContent=String(h).padStart(2,'0');
    if(minsEl) minsEl.textContent=String(m).padStart(2,'0');
    if(secsEl) secsEl.textContent=String(s).padStart(2,'0');
  }
  tick();
  setInterval(tick,1000);
})();

/* ============ HAPPY BIRTHDAY MUSIC SYNTHESIZER (Web Audio API) ============ */
let audioCtx = null;
let masterHbdGain = null;
let isHbdMusicPlaying = false;
let hbdLoopTimer = null;
let wasBgmPlayingBefore = false;

const NOTE_FREQS = {
  'G4': 392.00,
  'A4': 440.00,
  'B4': 493.88,
  'C5': 523.25,
  'D5': 587.33,
  'E5': 659.25,
  'F5': 698.46,
  'G5': 783.99
};

const HBD_MELODY = [
  // bar 1
  { note: 'G4', dur: 0.35, delay: 0.4 },
  { note: 'G4', dur: 0.2, delay: 0.25 },
  { note: 'A4', dur: 0.55, delay: 0.6 },
  { note: 'G4', dur: 0.55, delay: 0.6 },
  { note: 'C5', dur: 0.55, delay: 0.6 },
  { note: 'B4', dur: 1.1, delay: 1.2 },
  // bar 2
  { note: 'G4', dur: 0.35, delay: 0.4 },
  { note: 'G4', dur: 0.2, delay: 0.25 },
  { note: 'A4', dur: 0.55, delay: 0.6 },
  { note: 'G4', dur: 0.55, delay: 0.6 },
  { note: 'D5', dur: 0.55, delay: 0.6 },
  { note: 'C5', dur: 1.1, delay: 1.2 },
  // bar 3
  { note: 'G4', dur: 0.35, delay: 0.4 },
  { note: 'G4', dur: 0.2, delay: 0.25 },
  { note: 'G5', dur: 0.55, delay: 0.6 },
  { note: 'E5', dur: 0.55, delay: 0.6 },
  { note: 'C5', dur: 0.55, delay: 0.6 },
  { note: 'B4', dur: 0.55, delay: 0.6 },
  { note: 'A4', dur: 1.1, delay: 1.2 },
  // bar 4
  { note: 'F5', dur: 0.35, delay: 0.4 },
  { note: 'F5', dur: 0.2, delay: 0.25 },
  { note: 'E5', dur: 0.55, delay: 0.6 },
  { note: 'C5', dur: 0.55, delay: 0.6 },
  { note: 'D5', dur: 0.55, delay: 0.6 },
  { note: 'C5', dur: 1.4, delay: 1.8 }
];

function initAudioContext(){
  if(!audioCtx){
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(AudioContextClass){
      audioCtx = new AudioContextClass();
      masterHbdGain = audioCtx.createGain();
      masterHbdGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      masterHbdGain.connect(audioCtx.destination);
    }
  }
}

function playTone(freq, startTime, duration){
  if(!audioCtx || !masterHbdGain) return;
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const noteGain = audioCtx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, startTime);

  noteGain.gain.setValueAtTime(0.001, startTime);
  noteGain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 1.3);

  osc1.connect(noteGain);
  osc2.connect(noteGain);
  noteGain.connect(masterHbdGain);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration * 1.4);
  osc2.stop(startTime + duration * 1.4);
}

function scheduleMelody(){
  if(!isHbdMusicPlaying || !audioCtx) return;
  if(audioCtx.state === 'suspended'){
    audioCtx.resume();
  }
  let curTime = audioCtx.currentTime + 0.05;
  let totalDur = 0;

  HBD_MELODY.forEach(item => {
    const freq = NOTE_FREQS[item.note];
    if(freq){
      playTone(freq, curTime, item.dur);
    }
    curTime += item.delay;
    totalDur += item.delay;
  });

  hbdLoopTimer = setTimeout(()=>{
    if(isHbdMusicPlaying){
      scheduleMelody();
    }
  }, (totalDur + 1.2) * 1000);
}

function startHappyBirthdayMusic(){
  initAudioContext();
  if(!audioCtx) return;
  isHbdMusicPlaying = true;
  updateHbdMusicUI(true);

  if(isYtMusicPlayingNow()){
    wasBgmPlayingBefore = true;
    pauseYtMusic();
  }

  clearTimeout(hbdLoopTimer);
  scheduleMelody();
}

function stopHappyBirthdayMusic(){
  isHbdMusicPlaying = false;
  clearTimeout(hbdLoopTimer);
  updateHbdMusicUI(false);

  if(wasBgmPlayingBefore){
    playYtMusic();
    wasBgmPlayingBefore = false;
  }
}

function updateHbdMusicUI(active){
  const btn = document.getElementById('btnHbdMusic');
  const status = document.getElementById('hbdMusicStatus');
  if(!btn || !status) return;
  if(active){
    btn.classList.remove('muted');
    status.textContent = 'Memutar 🔊';
  } else {
    btn.classList.add('muted');
    status.textContent = 'Mati 🔇';
  }
}

/* ============ PHOTO SHOWCASE ENGINE ============ */
const photoKeys = typeof PHOTOS !== 'undefined' ? Object.keys(PHOTOS) : [];
const photoList = photoKeys.map(k => PHOTOS[k]);
let currentPhotoIndex = 0;
let slideshowTimer = null;
let isSlideshowPlaying = true;

const photoCaptions = [
  'Momen manis kita ✨',
  'Senyum terbaikmu 🥰',
  'Jalan-jalan santai berdua 🚶‍♀️🚶',
  'Tawa yang selalu bikin kangen 🌸',
  'Hari biasa jadi luar biasa 🎈',
  'Momen yang nggak terlupakan 💫',
  'Selalu suka lihat kamu bahagia 💖',
  'Cerita seru di Braga 🏮',
  'Kenangan terindah bareng kamu 📷',
  'Satu dari sejuta alasan bersyukur 🌟',
  'Terima kasih sudah selalu ada 🤍',
  'Selamat ulang tahun, sayang! 🎂🎉'
];

const showcaseImgA = document.getElementById('showcaseImgA');
const showcaseImgB = document.getElementById('showcaseImgB');
const showcaseCaption = document.getElementById('showcaseCaption');
const showcaseCounter = document.getElementById('showcaseCounter');
const showcaseDots = document.getElementById('showcaseDots');
const polaroidFrame = document.getElementById('polaroidFrame');
const showcasePlayPause = document.getElementById('showcasePlayPause');

function initPhotoShowcase(){
  if(!photoList.length || !showcaseDots) return;
  showcaseDots.innerHTML = '';
  photoList.forEach((_, idx)=>{
    const dot = document.createElement('div');
    dot.className = 'dot' + (idx === 0 ? ' active' : '');
    dot.addEventListener('click', ()=>{
      goToPhoto(idx);
      resetSlideshowTimer();
    });
    showcaseDots.appendChild(dot);
  });
  if(showcaseImgA) showcaseImgA.src = photoList[0];
  if(showcaseCounter) showcaseCounter.textContent = '1 / ' + photoList.length;
  if(showcaseCaption) showcaseCaption.textContent = photoCaptions[0];
}
initPhotoShowcase();

function goToPhoto(index){
  if(!photoList.length) return;
  currentPhotoIndex = (index + photoList.length) % photoList.length;
  const nextSrc = photoList[currentPhotoIndex];

  if(showcaseImgA && showcaseImgB){
    if(showcaseImgA.classList.contains('active')){
      showcaseImgB.src = nextSrc;
      showcaseImgB.classList.add('active');
      showcaseImgA.classList.remove('active');
    } else {
      showcaseImgA.src = nextSrc;
      showcaseImgA.classList.add('active');
      showcaseImgB.classList.remove('active');
    }
  }

  if(showcaseCounter){
    showcaseCounter.textContent = (currentPhotoIndex + 1) + ' / ' + photoList.length;
  }
  if(showcaseCaption){
    showcaseCaption.textContent = photoCaptions[currentPhotoIndex % photoCaptions.length];
  }

  if(showcaseDots){
    Array.from(showcaseDots.children).forEach((dot, i)=>{
      dot.classList.toggle('active', i === currentPhotoIndex);
    });
  }

  if(polaroidFrame){
    const tilts = [-2, 2.5, -1, 1.8, -2.5, 1.2];
    const tilt = tilts[currentPhotoIndex % tilts.length];
    polaroidFrame.style.transform = 'rotate(' + tilt + 'deg)';
  }
}

function nextPhoto(){
  goToPhoto(currentPhotoIndex + 1);
}

function prevPhoto(){
  goToPhoto(currentPhotoIndex - 1);
}

function startSlideshow(){
  stopSlideshow();
  isSlideshowPlaying = true;
  if(showcasePlayPause) showcasePlayPause.textContent = '⏸';
  slideshowTimer = setInterval(nextPhoto, 3200);
}

function stopSlideshow(){
  clearInterval(slideshowTimer);
  slideshowTimer = null;
}

function resetSlideshowTimer(){
  if(isSlideshowPlaying){
    startSlideshow();
  }
}

// Controls
const btnPrev = document.getElementById('showcasePrev');
const btnNext = document.getElementById('showcaseNext');

if(btnPrev){
  btnPrev.addEventListener('click', ()=>{
    prevPhoto();
    resetSlideshowTimer();
  });
}

if(btnNext){
  btnNext.addEventListener('click', ()=>{
    nextPhoto();
    resetSlideshowTimer();
  });
}

if(showcasePlayPause){
  showcasePlayPause.addEventListener('click', ()=>{
    if(isSlideshowPlaying){
      stopSlideshow();
      isSlideshowPlaying = false;
      showcasePlayPause.textContent = '▶';
    } else {
      startSlideshow();
      showcasePlayPause.textContent = '⏸';
    }
  });
}

// Music toggle button inside modal
const btnHbdMusic = document.getElementById('btnHbdMusic');
if(btnHbdMusic){
  btnHbdMusic.addEventListener('click', ()=>{
    if(isHbdMusicPlaying){
      stopHappyBirthdayMusic();
    } else {
      startHappyBirthdayMusic();
    }
  });
}

// Toggle vouchers collapsible
const btnToggleVouchers = document.getElementById('btnToggleVouchers');
const voucherSection = document.getElementById('voucherSection');
const voucherToggleIcon = document.getElementById('voucherToggleIcon');

if(btnToggleVouchers && voucherSection){
  btnToggleVouchers.addEventListener('click', ()=>{
    const isHidden = voucherSection.style.display === 'none';
    voucherSection.style.display = isHidden ? 'block' : 'none';
    if(voucherToggleIcon){
      voucherToggleIcon.textContent = isHidden ? '▲' : '▼';
    }
    if(isHidden){
      voucherSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

/* ============ BALLOON POP & SURPRISE TRIGGER ============ */
const balloonBtns = document.querySelectorAll('.pop-balloon');
const surpriseModal = document.getElementById('surpriseModal');
const reopenSurpriseBtn = document.getElementById('reopenSurpriseBtn');
const btnCloseSurprise = document.getElementById('btnCloseSurprise');
const btnResetBalloons = document.getElementById('btnResetBalloons');

const popMessages = [
  'Cinta kamu! 💖',
  'Makin bahagia! ✨',
  'Sehat selalu! 🌸',
  'Selalu cantik! 🥰',
  'Surprise unlocked! 🎉'
];

function showPopToast(x, y, text){
  const toast = document.createElement('div');
  toast.className = 'pop-toast';
  toast.textContent = text;
  toast.style.left = x + 'px';
  toast.style.top = y + 'px';
  document.body.appendChild(toast);
  setTimeout(()=>{ toast.remove(); }, 1200);
}

function celebrationStorm(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  spawnConfetti(w * 0.5, h * 0.35, 120);
  setTimeout(()=> spawnConfetti(w * 0.2, h * 0.45, 80), 180);
  setTimeout(()=> spawnConfetti(w * 0.8, h * 0.45, 80), 320);
  setTimeout(()=> spawnConfetti(w * 0.35, h * 0.3, 70), 500);
  setTimeout(()=> spawnConfetti(w * 0.65, h * 0.3, 70), 650);
}

function openSurpriseModal(){
  if(surpriseModal){
    surpriseModal.classList.add('show');
    startHappyBirthdayMusic();
    startSlideshow();
  }
}

function closeSurpriseModal(){
  if(surpriseModal){
    surpriseModal.classList.remove('show');
    stopHappyBirthdayMusic();
    stopSlideshow();
  }
}

let poppedCount = 0;
balloonBtns.forEach((btn, index)=>{
  btn.addEventListener('click', function(){
    if(this.classList.contains('popped')) return;
    this.classList.add('popped');
    poppedCount++;

    const rect = this.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    spawnConfetti(cx, cy, 35);
    const msg = popMessages[index % popMessages.length];
    showPopToast(cx, cy, msg);

    if(poppedCount === balloonBtns.length){
      celebrationStorm();
      if(reopenSurpriseBtn) reopenSurpriseBtn.style.display = 'inline-flex';
      setTimeout(()=>{
        openSurpriseModal();
      }, 700);
    }
  });
});

if(reopenSurpriseBtn){
  reopenSurpriseBtn.addEventListener('click', ()=>{
    celebrationStorm();
    openSurpriseModal();
  });
}

if(btnCloseSurprise){
  btnCloseSurprise.addEventListener('click', closeSurpriseModal);
}

if(surpriseModal){
  surpriseModal.addEventListener('click', (e)=>{
    if(e.target === surpriseModal){
      closeSurpriseModal();
    }
  });
}

if(btnResetBalloons){
  btnResetBalloons.addEventListener('click', ()=>{
    closeSurpriseModal();
    poppedCount = 0;
    balloonBtns.forEach(btn=> btn.classList.remove('popped'));
    if(reopenSurpriseBtn) reopenSurpriseBtn.style.display = 'none';
    if(voucherSection) voucherSection.style.display = 'none';
    if(voucherToggleIcon) voucherToggleIcon.textContent = '▼';
    document.querySelectorAll('.claim-btn').forEach(b => {
      b.classList.remove('claimed');
      b.textContent = 'Klaim di WA 💬';
    });
  });
}

document.querySelectorAll('.claim-btn').forEach(btn => {
  btn.addEventListener('click', function(){
    this.classList.add('claimed');
    this.textContent = 'Terklaim! 💖';
  });
});

/* ============ music toggle & pill ============ */
const musicBtn = document.getElementById('music-toggle');
const musicPill = document.getElementById('music-pill');

if(musicBtn){
  musicBtn.addEventListener('click', function(e){
    e.stopPropagation();
    toggleYtMusic();
  });
}

if(musicPill){
  musicPill.addEventListener('click', function(e){
    e.stopPropagation();
    toggleYtMusic();
  });
}
