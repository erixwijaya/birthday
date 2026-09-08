/* ============ background decorative blobs ============ */
(function bgDecor(){
  const holder = document.getElementById('bgDecor');
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
  const keys = Object.keys(PHOTOS);
  keys.forEach((k)=>{
    const div = document.createElement('div');
    div.className='polaroid';
    div.innerHTML = '<div class="tape"></div><img loading="lazy" src="'+PHOTOS[k]+'" alt="kenangan">';
    gallery.appendChild(div);
  });
  // braga strip: reuse a couple of photos
  const strip = document.getElementById('bragaStrip');
  [keys[10], keys[1], keys[6]].filter(Boolean).forEach(k=>{
    const img=document.createElement('img');
    img.src=PHOTOS[k];
    img.loading='lazy';
    strip.appendChild(img);
  });
})();

/* ============ countdown to next September 9 ============ */
(function countdown(){
  const daysEl=document.getElementById('cd-days');
  const hoursEl=document.getElementById('cd-hours');
  const minsEl=document.getElementById('cd-mins');
  const secsEl=document.getElementById('cd-secs');
  const todayEl=document.getElementById('countToday');
  const gridEl=document.getElementById('countGrid');

  function nextBirthday(now){
    let year = now.getFullYear();
    let target = new Date(year, 8, 9, 0,0,0); // month index 8 = September
    if (target < now){
      // if already past September 9 this year, check if still "today" (same date) handled separately
      target = new Date(year+1, 8, 9, 0,0,0);
    }
    return target;
  }

  function isBirthdayToday(now){
    return now.getMonth()===8 && now.getDate()===9;
  }

  function tick(){
    const now = new Date();
    if (isBirthdayToday(now)){
      gridEl.style.display='none';
      todayEl.style.display='block';
      return;
    }
    gridEl.style.display='grid';
    todayEl.style.display='none';
    const target = nextBirthday(now);
    let diff = target - now;
    const d = Math.floor(diff/(1000*60*60*24));
    diff -= d*(1000*60*60*24);
    const h = Math.floor(diff/(1000*60*60));
    diff -= h*(1000*60*60);
    const m = Math.floor(diff/(1000*60));
    diff -= m*(1000*60);
    const s = Math.floor(diff/1000);
    daysEl.textContent=d;
    hoursEl.textContent=String(h).padStart(2,'0');
    minsEl.textContent=String(m).padStart(2,'0');
    secsEl.textContent=String(s).padStart(2,'0');
  }
  tick();
  setInterval(tick,1000);
})();

/* ============ confetti engine (canvas) ============ */
const confettiCanvas = document.getElementById('confetti-canvas');
const ctx = confettiCanvas.getContext('2d');
function resizeCanvas(){
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

/* ============ gate open ============ */
const gate = document.getElementById('gate');
const envelope = document.getElementById('envelope');
envelope.addEventListener('click', openGate);
envelope.addEventListener('touchend', function(e){ e.preventDefault(); openGate(); }, {passive:false});

let opened = false;
function openGate(){
  if(opened) return;
  opened = true;
  const cx = window.innerWidth/2;
  const cy = window.innerHeight*0.4;
  spawnConfetti(cx, cy, 160);
  setTimeout(()=> spawnConfetti(cx*0.3, cy, 60), 150);
  setTimeout(()=> spawnConfetti(cx*1.7, cy, 60), 150);
  gate.classList.add('opened');
  document.body.style.overflow='auto';
  // try to autoplay music after user gesture
  const bgm = document.getElementById('bgm');
  bgm.play().then(()=>{
    document.getElementById('music-toggle').classList.add('playing');
  }).catch(()=>{ /* file may not exist yet, ignore */ });
}

/* lock scroll until opened */
document.body.style.overflow='hidden';

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
  // Primary music-box tone (sine)
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const noteGain = audioCtx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  // Soft sparkle overtone (one octave above)
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

  // pause bgm if running so audios don't clash
  const bgm = document.getElementById('bgm');
  if(bgm && !bgm.paused){
    wasBgmPlayingBefore = true;
    bgm.pause();
    document.getElementById('music-toggle').classList.remove('playing');
  }

  clearTimeout(hbdLoopTimer);
  scheduleMelody();
}

function stopHappyBirthdayMusic(){
  isHbdMusicPlaying = false;
  clearTimeout(hbdLoopTimer);
  updateHbdMusicUI(false);

  // resume bgm if it was playing previously
  const bgm = document.getElementById('bgm');
  if(bgm && wasBgmPlayingBefore){
    bgm.play().then(()=>{
      document.getElementById('music-toggle').classList.add('playing');
    }).catch(()=>{});
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
const photoKeys = Object.keys(PHOTOS);
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

  // Crossfade between ImgA and ImgB
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

  // Update caption & counter
  if(showcaseCounter){
    showcaseCounter.textContent = (currentPhotoIndex + 1) + ' / ' + photoList.length;
  }
  if(showcaseCaption){
    showcaseCaption.textContent = photoCaptions[currentPhotoIndex % photoCaptions.length];
  }

  // Update dots
  if(showcaseDots){
    Array.from(showcaseDots.children).forEach((dot, i)=>{
      dot.classList.toggle('active', i === currentPhotoIndex);
    });
  }

  // Gentle polaroid tilt effect
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

    // spawn mini confetti & floating message
    spawnConfetti(cx, cy, 35);
    const msg = popMessages[index % popMessages.length];
    showPopToast(cx, cy, msg);

    // check if all balloons popped
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
    // reset voucher claim buttons
    document.querySelectorAll('.claim-btn').forEach(b => {
      b.classList.remove('claimed');
      b.textContent = 'Klaim di WA 💬';
    });
  });
}

// mark coupon as claimed when clicked
document.querySelectorAll('.claim-btn').forEach(btn => {
  btn.addEventListener('click', function(){
    this.classList.add('claimed');
    this.textContent = 'Terklaim! 💖';
  });
});

/* ============ music toggle ============ */
const musicBtn = document.getElementById('music-toggle');
const bgm = document.getElementById('bgm');
musicBtn.addEventListener('click', function(){
  if(bgm.paused){
    bgm.play().then(()=> musicBtn.classList.add('playing')).catch(()=>{
      alert('Belum ada file musiknya. Tambahkan file audio di assets/music.mp3 ya.');
    });
  } else {
    bgm.pause();
    musicBtn.classList.remove('playing');
  }
});
