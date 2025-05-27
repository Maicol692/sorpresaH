function heartShape(t, scale = 1) {
  const x = scale * 16 * Math.pow(Math.sin(t), 3);
  const y = -scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return [x, y];
}

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
canvas.width = innerWidth * dpr;
canvas.height = innerHeight * dpr;
canvas.style.width = innerWidth + "px";
canvas.style.height = innerHeight + "px";
ctx.scale(dpr, dpr);

let w = innerWidth;
let h = innerHeight;

const mouse = {
  x: w / 2,
  y: h / 2,
  radius: 80
};

const numBots = w < 700 ? 400 : 2000;
const microbots = [];

function randomHeartColor() {
  const colors = [
    "#ff4d4d", "#ff6699", "#ff0066", "#ff5e78", "#ff85b3", "#d36ba6",
    "#ff3366", "#e75480", "#db7093", "#ff1493", "#ff69b4",
    "#66ccff", "#3399ff", "#66aaff", "#88ccee", "#aaddff",
    "#77ddff", "#99ccff", "#66ffff", "#00ccff", "#33ddff",
    "#6699ff", "#ccddff", "#aaccee", "#99e6ff", "#55bbff"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

while (microbots.length < numBots) {
  const t = Math.random() * Math.PI * 2;
  const [hx, hy] = heartShape(t, 18);
  const rand = Math.pow(Math.random(), 0.7);
  const x = w/2 + hx * rand + (Math.random() - 0.5) * 2;
  const y = h/2 + hy * rand + (Math.random() - 0.5) * 2;

  microbots.push({
    x, y,
    baseX: x,
    baseY: y,
    vx: 0,
    vy: 0,
    color: randomHeartColor()
  });
}

window.addEventListener("mousemove", e => {
  mouse.x = e.clientX * dpr;
  mouse.y = e.clientY * dpr;
});
window.addEventListener("touchmove", e => {
  if (e.touches.length > 0) {
    mouse.x = e.touches[0].clientX * dpr;
    mouse.y = e.touches[0].clientY * dpr;
  }
}, {passive: true});

const starfield = [];
for (let i = 0; i < 300; i++) {
  starfield.push({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.5,
    alpha: Math.random(),
    speed: 0.2 + Math.random() * 0.3
  });
}

function drawStars() {
  ctx.save();
  ctx.globalAlpha = 0.3;
  for (let s of starfield) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    s.y += s.speed;
    if (s.y > h) {
      s.y = 0;
      s.x = Math.random() * w;
    }
  }
  ctx.restore();
}

// Meteoritos dirigidos al corazón
let meteoritos = [];

function createMeteor() {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  switch (edge) {
    case 0: x = -50; y = Math.random() * h; break;
    case 1: x = Math.random() * w; y = -50; break;
    case 2: x = w + 50; y = Math.random() * h; break;
    case 3: x = Math.random() * w; y = h + 50; break;
  }

  const dx = (w / 2) - x;
  const dy = (h / 2) - y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const speed = 10;
  const vx = (dx / dist) * speed;
  const vy = (dy / dist) * speed;

  meteoritos.push({ x, y, vx, vy, trail: [] });
}

canvas.addEventListener("dblclick", createMeteor);
canvas.addEventListener("touchstart", (() => {
  let last = 0;
  return (e) => {
    const now = Date.now();
    if (now - last < 400) createMeteor();
    last = now;
  };
})());

function drawMeteoritos() {
  for (let meteor of meteoritos) {
    meteor.trail.unshift({ x: meteor.x, y: meteor.y });
    if (meteor.trail.length > 30) meteor.trail.pop();

    for (let i = 0; i < meteor.trail.length; i++) {
      const t = meteor.trail[i];
      ctx.beginPath();
      ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${1 - i / meteor.trail.length})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(meteor.x, meteor.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.shadowColor = "white";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    meteor.x += meteor.vx;
    meteor.y += meteor.vy;
  }

  meteoritos = meteoritos.filter(m => m.x > -100 && m.x < w + 100 && m.y > -100 && m.y < h + 100);
}

function animate() {
  ctx.clearRect(0, 0, w, h);
  drawStars();
  drawMeteoritos();

  for (let bot of microbots) {
    let dx = bot.x - mouse.x;
    let dy = bot.y - mouse.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < mouse.radius) {
      let force = (mouse.radius - dist) / mouse.radius;
      let angle = Math.atan2(dy, dx);
      bot.vx += Math.cos(angle) * force * 2.5;
      bot.vy += Math.sin(angle) * force * 2.5;
    }

    for (let meteor of meteoritos) {
      let dx = bot.x - meteor.x;
      let dy = bot.y - meteor.y;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d < 100) {
        let force = (100 - d) / 100;
        let angle = Math.atan2(dy, dx);
        bot.vx += Math.cos(angle) * force * 5;
        bot.vy += Math.sin(angle) * force * 5;
      }
    }

    bot.vx += (bot.baseX - bot.x) * 0.01;
    bot.vy += (bot.baseY - bot.y) * 0.01;
    bot.vx *= 0.88;
    bot.vy *= 0.88;
    bot.x += bot.vx;
    bot.y += bot.vy;

    ctx.beginPath();
    ctx.arc(bot.x, bot.y, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = bot.color;
    ctx.fill();
  }

  requestAnimationFrame(animate);
}

animate();

// Doble click derecho para mostrar "te amo"
let lastRightClick = 0;
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('mousedown', e => {
  if (e.button === 2) {
    const now = Date.now();
    if (now - lastRightClick < 400) {
      const teamo = document.createElement('div');
      teamo.className = 'teamo teamo-fade';
      teamo.textContent = 'te amo';
      document.body.appendChild(teamo);
      setTimeout(() => teamo.remove(), 1000);
    }
    lastRightClick = now;
  }
});

// Letras románticas con la tecla J
document.addEventListener('keydown', function(e) {
  if (e.key.toLowerCase() === 'j') {
    const amor = document.createElement('div');
    amor.className = 'amor-j';
    amor.textContent = 'siempre te voy amar,\nte amo de aquí a la luna\na pasitos de tortuga';
    amor.style.left = mouse.x / (window.devicePixelRatio || 1) + 'px';
    amor.style.top = mouse.y / (window.devicePixelRatio || 1) + 'px';
    document.body.appendChild(amor);
    setTimeout(() => amor.remove(), 3000);
  }

  // Activar música romántica con tecla M
  if (e.key.toLowerCase() === 'm') {
    let audio = document.getElementById('loveMusic');
    if (audio) {
      audio.paused ? audio.play() : audio.pause();
    }
  }
});
