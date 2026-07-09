/* ============================================================
   OPENING ANIMATION — the heart beats, then bursts outward to
   reveal slide one.
   ============================================================ */
(function introAnimation(){
  const overlay = document.getElementById('introOverlay');
  const btn = document.getElementById('introBtn');
  const heart = document.getElementById('introHeart');
  btn?.addEventListener('click', () => {
    heart.classList.add('burst');
    overlay.classList.add('opening');
    setTimeout(() => overlay.remove(), 1100);const bgMusic = document.getElementById('bgMusic');
    bgMusic.play().then(() => {
      document.getElementById('miniPlayer').classList.remove('hidden');
    }).catch(() => { });

    
  });
})();

/* ============================================================
   STARFIELD — lightweight 3D-style particle field with parallax
   ============================================================ */
(function starfield(){
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let w, h, stars = [];
  const STAR_COUNT = 160;

  function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize);
  resize();

  function makeStar(){
    return {
      x: Math.random() * w, y: Math.random() * h,
      z: Math.random() * 1 + 0.15,
      r: Math.random() * 1.4 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.15 + 0.02
    };
  }
  for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar());

  let parallaxX = 0, parallaxY = 0, targetX = 0, targetY = 0;
  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / w - 0.5) * 18;
    targetY = (e.clientY / h - 0.5) * 18;
  });
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    targetX = Math.max(-18, Math.min(18, e.gamma / 3));
    targetY = Math.max(-18, Math.min(18, (e.beta - 40) / 4));
  });

  function draw(){
    ctx.clearRect(0, 0, w, h);
    parallaxX += (targetX - parallaxX) * 0.04;
    parallaxY += (targetY - parallaxY) * 0.04;
    for (const s of stars){
      s.twinkle += s.speed;
      s.y += s.speed * 0.4;
      if (s.y > h) s.y = 0;
      const dx = parallaxX * s.z, dy = parallaxY * s.z;
      const alpha = 0.5 + Math.sin(s.twinkle) * 0.4;
      const size = s.r * s.z * 2;
      ctx.beginPath();
      ctx.fillStyle = `rgba(251,244,248,${Math.max(0.15, alpha).toFixed(2)})`;
      ctx.arc(s.x + dx, s.y + dy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ============================================================
   SHARED HELPER — spawns one emoji that beats/pulses in place
   while also drifting along an erratic multi-directional path.
   Used by the global ambient hearts, the finale petals, and the
   small kisses that drift during the "yes" celebration.
   ============================================================ */
function rand(min, max){ return Math.random() * (max - min) + min; }

function spawnDriftingEmoji({ container, emoji, className, minSize, maxSize, minDuration, maxDuration, riseFactor }){
  const wrap = document.createElement('div');
  wrap.className = className;
  const inner = document.createElement('span');
  inner.className = 'petal-beat';
  inner.innerHTML = emoji;
  wrap.appendChild(inner);

  const bounds = container === document.body
    ? { w: window.innerWidth, h: window.innerHeight }
    : container.getBoundingClientRect();

  const startX = rand(0, bounds.width || bounds.w);
  const startY = (bounds.height || bounds.h) + 30;
  wrap.style.left = startX + 'px';
  wrap.style.top = startY + 'px';
  wrap.style.fontSize = rand(minSize, maxSize) + 'px';
  container.appendChild(wrap);

  const totalRise = (bounds.height || bounds.h) * riseFactor + 100;
  const steps = 5 + Math.floor(rand(0, 3));
  const keyframes = [];
  for (let i = 0; i <= steps; i++){
    const progress = i / steps;
    keyframes.push({
      transform: `translate(${rand(-80, 80)}px, ${-totalRise * progress}px) rotate(${rand(-40, 40)}deg)`,
      opacity: i === 0 ? 0 : (i === steps ? 0 : rand(0.35, 0.65)),
      offset: progress
    });
  }
  const anim = wrap.animate(keyframes, {
    duration: rand(minDuration, maxDuration),
    easing: 'ease-in-out',
    fill: 'forwards'
  });
  anim.onfinish = () => wrap.remove();
}

/* ============================================================
   GLOBAL AMBIENT HEARTS — pink, beating, drifting everywhere,
   on every slide, from the moment the site opens.
   ============================================================ */
(function ambientHearts(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(() => {
    spawnDriftingEmoji({
      container: document.body,
      emoji: '&#10084;',
      className: 'ambient-heart',
      minSize: 12, maxSize: 22,
      minDuration: 9000, maxDuration: 14000,
      riseFactor: 1.1
    });
  }, 1400);
})();

/* ============================================================
   PAGER — one swipe / wheel notch / arrow key = exactly one
   slide, locked until the transition finishes.
   ============================================================ */
const pager = (function pagedScroll(){
  const track = document.querySelector('.track');
  const panels = Array.from(document.querySelectorAll('.panel'));
  const dots = document.querySelectorAll('.dot');
  let current = 0;
  let locked = false;
  const LOCK_MS = 800;

  function render(){
    track.style.transform = `translateY(-${current * 100}vh)`;
    dots.forEach(d => d.classList.toggle('active', d.dataset.target === panels[current].id));
    document.dispatchEvent(new CustomEvent('slidechange', {
      detail: { id: panels[current].id, index: current }
    }));
  }

  function goTo(index){
    if (index < 0 || index >= panels.length || locked) return;
    locked = true;
    current = index;
    render();
    setTimeout(() => { locked = false; }, LOCK_MS);
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  const scroller = document.querySelector('.scroller');
  let wheelCooldown = false;
  scroller.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (locked || wheelCooldown) return;
    wheelCooldown = true;
    goTo(current + (e.deltaY > 0 ? 1 : -1));
    setTimeout(() => { wheelCooldown = false; }, LOCK_MS);
  }, { passive: false });

  let touchStartY = 0;
  scroller.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  scroller.addEventListener('touchend', (e) => {
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 40 || locked) return;
    goTo(current + (dy > 0 ? 1 : -1));
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') goTo(current + 1);
    if (e.key === 'ArrowUp' || e.key === 'PageUp') goTo(current - 1);
  });

  render();
  return { goTo, get current(){ return current; } };
})();

/* ============================================================
   RECORDED MESSAGE SLIDE — background music ducks out
   automatically while her message plays, and resumes after.
   ============================================================ */
(function messagePlayer(){
  const cd = document.getElementById('cd');
  const btn = document.getElementById('playBtn');
  const message = document.getElementById('message');
  const bgMusic = document.getElementById('bgMusic');
  const miniPlayer = document.getElementById('miniPlayer');
  let bgWasPlaying = false;

  function setIcon(playing){
    btn.querySelector('.icon').innerHTML = playing ? '&#10074;&#10074;' : '&#9658;';
  }

  function playMessage(){
    bgWasPlaying = !bgMusic.paused;
    bgMusic.pause();
    message.play().then(() => {
      cd.classList.add('spinning');
      setIcon(true);
      miniPlayer.classList.remove('hidden');
    }).catch(() => { });
  }

  function stopMessage(){
    message.pause();
    cd.classList.remove('spinning');
    setIcon(false);
    if (bgWasPlaying){
      bgMusic.play().then(() => miniPlayer.classList.remove('hidden')).catch(() => {});
    } else {
      miniPlayer.classList.add('hidden');
    }
  }

  btn.addEventListener('click', () => {
    if (message.paused) playMessage(); else stopMessage();
  });

  message.addEventListener('ended', stopMessage);

  document.addEventListener('slidechange', (e) => {
    if (e.detail.id === 'player'){
      if (message.paused) playMessage();
    } else {
      if (!message.paused) stopMessage();
    }
  });

  miniPlayer.addEventListener('click', () => {
    if (!message.paused){ stopMessage(); }
    else if (!bgMusic.paused){ bgMusic.pause(); miniPlayer.classList.add('hidden'); }
  });
})();

/* ============================================================
   "DOES SHE LOVE ME?"
   - "No" always stays visible: every click moves it to a fresh
     spot on screen. It never disappears.
   - After it's been pressed 3 times, the heartbreak animation
     plays, then everything resets so she can try again.
   - "Yes" plays a heart animation that zooms toward the viewer
     and vanishes — right here on the question slide — then a
     single bundled bouquet (not separate floating roses) pops
     up in its place, with kisses drifting softly in this panel.
   ============================================================ */
(function questionGame(){
  const noBtn = document.getElementById('noBtn');
  const yesBtn = document.getElementById('yesBtn');
  const heartbreak = document.getElementById('heartbreak');
  const questionTitle = document.getElementById('questionTitle');
  const answerRow = document.getElementById('answerRow');
  const questionPanel = document.getElementById('question');

  const revealStage = document.getElementById('revealStage');
  const heartBurst = document.getElementById('revealHeartBurst');
  const revealContent = document.getElementById('revealContent');
  const resetBtn = document.getElementById('resetQuestion');

  let presses = 0;
  const MAX_PRESSES = 3;
  let kissInterval = null;

  function moveNoButton(){
    const btnRect = noBtn.getBoundingClientRect();
    const maxX = window.innerWidth - btnRect.width - 24;
    const maxY = window.innerHeight - btnRect.height - 24;
    const newX = Math.max(24, rand(0, maxX));
    const newY = Math.max(24, rand(0, maxY));
    noBtn.classList.add('dodging');
    noBtn.style.left = newX + 'px';
    noBtn.style.top = newY + 'px';
  }

  function resetNoButton(){
    noBtn.classList.remove('dodging');
    noBtn.style.left = '';
    noBtn.style.top = '';
    presses = 0;
  }

  // Moves away on approach too, so it's genuinely hard to pin down,
  // but a real click always still registers and counts as a press.
  noBtn?.addEventListener('mouseenter', moveNoButton);
  noBtn?.addEventListener('touchstart', (e) => { e.preventDefault(); moveNoButton(); }, { passive: false });

  noBtn?.addEventListener('click', () => {
    presses++;
    if (presses >= MAX_PRESSES){
      heartbreak.classList.remove('hidden');
      setTimeout(() => {
        heartbreak.classList.add('hidden');
        resetNoButton();
      }, 2400);
    } else {
      moveNoButton();
    }
  });

  function startKisses(){
    if (kissInterval) return;
    kissInterval = setInterval(() => {
      spawnDriftingEmoji({
        container: questionPanel,
        emoji: '&#128139;',
        className: 'modal-petal',
        minSize: 14, maxSize: 24,
        minDuration: 3000, maxDuration: 5000,
        riseFactor: 0.6
      });
    }, 500);
  }
  function stopKisses(){
    clearInterval(kissInterval);
    kissInterval = null;
  }

  yesBtn?.addEventListener('click', () => {
    // hide the question UI, stay on this same slide
    questionTitle.style.opacity = '0';
    answerRow.style.opacity = '0';
    answerRow.style.pointerEvents = 'none';

    revealStage.classList.remove('hidden');
    heartBurst.classList.remove('bursting');
    void heartBurst.offsetWidth; // restart animation
    heartBurst.classList.add('bursting');
    startKisses();

    // once the heart has zoomed in and vanished, pop the bouquet up
    setTimeout(() => {
      revealContent.classList.remove('hidden');
      requestAnimationFrame(() => revealContent.classList.add('show'));
    }, 950);
  });

  resetBtn?.addEventListener('click', () => {
    stopKisses();
    revealContent.classList.remove('show');
    setTimeout(() => {
      revealContent.classList.add('hidden');
      revealStage.classList.add('hidden');
      heartBurst.classList.remove('bursting');
      questionTitle.style.opacity = '1';
      answerRow.style.opacity = '1';
      answerRow.style.pointerEvents = 'auto';
    }, 400);
  });
})();

/* ============================================================
   FINALE — roses, beating hearts, and kisses drifting small in
   the background of the note. Only this slide gets this mix.
   ============================================================ */
(function finalePetals(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const EMOJIS = ['&#127801;', '&#10084;', '&#128139;']; // rose, heart, kiss
  let intervalId = null;

  function spawnPetal(){
    spawnDriftingEmoji({
      container: document.body,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      className: 'finale-petal',
      minSize: 14, maxSize: 26,
      minDuration: 8000, maxDuration: 13000,
      riseFactor: 1.1
    });
  }

  document.addEventListener('slidechange', (e) => {
    if (e.detail.id === 'finale' && !intervalId){
      spawnPetal();
      intervalId = setInterval(spawnPetal, 700);
    } else if (e.detail.id !== 'finale' && intervalId){
      clearInterval(intervalId);
      intervalId = null;
    }
  });
})();

/* ============================================================
   ENDING SLIDE — "Happy Birthday" pops in, then pops outward
   and fades, then a square photo appears with birthday icons
   orbiting circularly around it.
   ============================================================ */
(function endingReveal(){
  const title = document.getElementById('endingTitle');
  const photoWrap = document.getElementById('endingPhotoWrap');
  let played = false;

  document.addEventListener('slidechange', (e) => {
    if (e.detail.id === 'ending' && !played){
      played = true;
      title.classList.add('show-in');
      setTimeout(() => {
        title.classList.remove('show-in');
        title.classList.add('show-out');
      }, 1500);
      setTimeout(() => {
        photoWrap.classList.remove('hidden');
        requestAnimationFrame(() => photoWrap.classList.add('show'));
      }, 2400);
    }
  });
})();
