// ===========================================================================
//  Ueidvd — o protetor de tela do DVD, mas quem quica é uma careca sorridente.
//  Bata no canto exato e ganhe confete. Clique pra multiplicar as cabeças.
// ===========================================================================

const container = document.getElementById("container");
const scoreboard = {
  bounces: document.getElementById("bounceCount"),
  corners: document.getElementById("cornerCount"),
  record: document.getElementById("cornerRecord"),
};
const soundToggle = document.getElementById("soundToggle");
const cornerBanner = document.getElementById("cornerBanner");

const BASE_SPEED = 3;         // velocidade base (px por frame)
const MAX_BOUNCERS = 20;      // limite de cabeças pra não fritar o navegador
const CORNER_TOLERANCE = 6;   // "quase" no canto (px) pra provocar o balão

// Frases zombeteiras no espírito do adesivo "CABELO".
const TAUNTS = [
  "cadê o cabelo?",
  "CTRL Z não desfaz careca",
  "reflete a luz ✨",
  "saudades do 2010",
  "boing",
  "careca é aerodinâmico",
  "vira as costas pro sol",
  "shampoo? não conheço",
  "liso por natureza",
  "pentear é rápido",
  "🫡",
];
const CORNER_TAUNTS = ["QUASE!", "no canto quase!", "por pouco!"];

// ---- Placar (com recorde persistente) ------------------------------------
let bounceCount = 0;
let cornerCount = 0;
let cornerRecord = Number(localStorage.getItem("ueidvd_corner_record")) || 0;
scoreboard.record.textContent = cornerRecord;

function bumpBounces() {
  bounceCount += 1;
  scoreboard.bounces.textContent = bounceCount;
}

function bumpCorners() {
  cornerCount += 1;
  scoreboard.corners.textContent = cornerCount;
  if (cornerCount > cornerRecord) {
    cornerRecord = cornerCount;
    scoreboard.record.textContent = cornerRecord;
    localStorage.setItem("ueidvd_corner_record", String(cornerRecord));
  }
}

// ---- Som "boing" opcional (Web Audio, começa mutado) ---------------------
let soundEnabled = false;
let audioCtx = null;
let lastBoing = 0;

function boing() {
  if (!soundEnabled || !audioCtx) return;
  const now = performance.now();
  if (now - lastBoing < 60) return; // throttle: evita metralhadora de boings
  lastBoing = now;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.2);
}

soundToggle.addEventListener("click", (e) => {
  e.stopPropagation(); // não deixa o clique no botão criar uma nova cabeça
  soundEnabled = !soundEnabled;
  if (soundEnabled && !audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
});

// ---- Confete + banner da comemoração de canto ----------------------------
const CONFETTI_COLORS = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#f78c6b", "#fff"];

function celebrateCorner(x, y) {
  bumpCorners();

  cornerBanner.textContent = "🏆 BATEU NO CANTO! 🏆";
  cornerBanner.style.setProperty("--banner-hue", String(Math.floor(Math.random() * 360)));
  cornerBanner.classList.remove("pop");
  void cornerBanner.offsetWidth; // reinicia a animação
  cornerBanner.classList.add("pop");

  for (let i = 0; i < 90; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.setProperty("--dur", (1.2 + Math.random() * 1.4).toFixed(2) + "s");
    piece.style.animationDelay = (Math.random() * 0.25).toFixed(2) + "s";
    container.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

// ---- Fábrica de "cabeças quicantes" --------------------------------------
const bouncers = [];

function createBouncer(el, opts = {}) {
  const width = el.offsetWidth;
  const height = el.offsetHeight;

  const bouncer = {
    el,
    taunt: el.querySelector(".taunt"),
    width,
    height,
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    vx: opts.vx ?? BASE_SPEED,
    vy: opts.vy ?? BASE_SPEED,
    hue: Math.floor(Math.random() * 360),
    tauntTimer: null,
  };

  bouncer.render = () => {
    el.style.transform = `translate(${bouncer.x}px, ${bouncer.y}px)`;
  };

  bouncer.showTaunt = (text) => {
    if (!bouncer.taunt) return;
    bouncer.taunt.textContent = text;
    bouncer.taunt.classList.add("show");
    clearTimeout(bouncer.tauntTimer);
    bouncer.tauntTimer = setTimeout(() => bouncer.taunt.classList.remove("show"), 900);
  };

  bouncer.onWallHit = (nearCorner) => {
    bumpBounces();
    bouncer.hue = (bouncer.hue + 47) % 360;
    el.style.setProperty("--hue", String(bouncer.hue));
    boing();
    const phrase = nearCorner
      ? CORNER_TAUNTS[Math.floor(Math.random() * CORNER_TAUNTS.length)]
      : TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
    bouncer.showTaunt(phrase);
  };

  bouncer.render();
  bouncers.push(bouncer);
  return bouncer;
}

// ---- Loop único de animação (move todas as cabeças) ----------------------
let maxX = 0;
let maxY = 0;

function measure() {
  maxX = container.clientWidth;
  maxY = container.clientHeight;
}

function step() {
  for (const b of bouncers) {
    b.x += b.vx;
    b.y += b.vy;

    const limitX = maxX - b.width;
    const limitY = maxY - b.height;

    let hitH = false;
    let hitV = false;

    if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx); hitH = true; }
    else if (b.x >= limitX) { b.x = limitX; b.vx = -Math.abs(b.vx); hitH = true; }

    if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy); hitV = true; }
    else if (b.y >= limitY) { b.y = limitY; b.vy = -Math.abs(b.vy); hitV = true; }

    if (hitH && hitV) {
      // O sonho: canto exato nos dois eixos no mesmo frame.
      celebrateCorner(b.x, b.y);
      b.onWallHit(false);
    } else if (hitH || hitV) {
      // "Quase": bateu numa parede bem pertinho de um canto.
      const nearCorner =
        (hitH && (b.y <= CORNER_TOLERANCE || b.y >= limitY - CORNER_TOLERANCE)) ||
        (hitV && (b.x <= CORNER_TOLERANCE || b.x >= limitX - CORNER_TOLERANCE));
      b.onWallHit(nearCorner);
    }

    b.render();
  }
  requestAnimationFrame(step);
}

// ---- Clique = mais uma cabeça no caos ------------------------------------
function spawnBouncer() {
  if (bouncers.length >= MAX_BOUNCERS) {
    // Já tá lotado: dá um "boing" e uma provocação na primeira cabeça.
    bouncers[0]?.showTaunt("chega de careca! 😵");
    return;
  }

  const original = document.getElementById("box");
  const clone = original.cloneNode(true);
  clone.removeAttribute("id");
  container.appendChild(clone);

  const dir = () => (Math.random() < 0.5 ? -1 : 1);
  const speed = () => BASE_SPEED + Math.random() * 3;

  createBouncer(clone, {
    x: Math.random() * Math.max(0, maxX - original.offsetWidth),
    y: Math.random() * Math.max(0, maxY - original.offsetHeight),
    vx: dir() * speed(),
    vy: dir() * speed(),
  });
}

container.addEventListener("click", spawnBouncer);

// ---- Inicialização --------------------------------------------------------
window.addEventListener("resize", measure);

measure();
createBouncer(document.getElementById("box"), { vx: BASE_SPEED, vy: BASE_SPEED });
requestAnimationFrame(step);
