// "Catch the hearts": Bubu tosses hearts from the top, you move Dudu to catch them.
// Cilantro sneaks in too; catching it costs points. 30-second rounds, best score kept per browser.
(() => {
  const dlg = document.getElementById("game-modal");
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("game-overlay");
  const scoreEl = document.getElementById("game-score");
  const timeEl = document.getElementById("game-time");
  const ROUND = 30;

  const bubu = new Image(); bubu.src = "assets/images/sprite-bubu.webp";
  const dudu = new Image(); dudu.src = "assets/images/sprite-dudu.webp";

  let W = 0, H = 0, dpr = 1;
  let state = "idle", score = 0, left = ROUND, last = 0, spawnIn = 0;
  let duduX = 0.5, targetX = 0.5, shake = 0, bubuX = 0.5, bubuDir = 1;
  let items = [], pops = [];
  const keys = { left: false, right: false };

  const best = () => { try { return Number(localStorage.getItem("cp-best") || 0); } catch { return 0; } };
  const setBest = v => { try { localStorage.setItem("cp-best", String(v)); } catch {} };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
  }

  function heartPath(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * .3);
    ctx.bezierCurveTo(x, y, x - s * .5, y - s * .1, x - s * .5, y + s * .25);
    ctx.bezierCurveTo(x - s * .5, y + s * .55, x - s * .1, y + s * .75, x, y + s * .95);
    ctx.bezierCurveTo(x + s * .1, y + s * .75, x + s * .5, y + s * .55, x + s * .5, y + s * .25);
    ctx.bezierCurveTo(x + s * .5, y - s * .1, x, y, x, y + s * .3);
  }

  function drawCilantro(x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = "#5E8C4A"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, s * .55); ctx.lineTo(0, s * .05); ctx.stroke();
    ctx.fillStyle = "#79AE5C";
    [[-.3, -.05], [.3, -.05], [0, -.32]].forEach(([dx, dy]) => {
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = k * 2.09 - 1.57;
        ctx.ellipse(dx * s + Math.cos(a) * s * .12, dy * s + Math.sin(a) * s * .12, s * .14, s * .1, a, 0, Math.PI * 2);
      }
      ctx.fill();
    });
    ctx.restore();
  }

  function spawn() {
    const bad = Math.random() < .18;
    items.push({
      x: bubuX * W, y: H * .2, vx: (Math.random() - .5) * 60, vy: 60 + Math.random() * 40,
      s: bad ? 30 : 22 + Math.random() * 8, bad, rot: 0, spin: (Math.random() - .5) * 3,
      color: ["#E9A3A3", "#F0B9B9", "#D98C8C"][Math.floor(Math.random() * 3)]
    });
  }

  function start() {
    resize();
    score = 0; left = ROUND; items = []; pops = []; spawnIn = 0;
    duduX = targetX = .5;
    state = "play";
    overlay.hidden = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function end() {
    state = "over";
    const prev = best();
    const isBest = score > prev;
    if (isBest) setBest(score);
    overlay.innerHTML = `
      <p class="game-title">${score === 1 ? "1 heart" : `${score} hearts`}!</p>
      <p>${isBest ? "A new best! Bubu is so proud." : `Your best is ${Math.max(prev, score)}.`}</p>
      <button type="button" class="btn btn-solid" id="game-again">Play again</button>`;
    overlay.hidden = false;
    document.getElementById("game-again").addEventListener("click", start);
  }

  function loop(now) {
    if (state !== "play" || !dlg.open) return;
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    left -= dt;
    if (left <= 0) { left = 0; draw(); end(); return; }

    // Bubu paces along the top, tossing hearts
    bubuX += bubuDir * dt * .32;
    if (bubuX > .85 || bubuX < .15) { bubuDir *= -1; bubuX = Math.min(.85, Math.max(.15, bubuX)); }
    if (Math.random() < dt * .6) bubuDir *= -1;
    const pace = 1 - left / ROUND; // gets a little faster as the round goes on
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = .7 - pace * .35; }

    // Dudu follows the pointer or arrow keys
    if (keys.left) targetX -= dt * 1.1;
    if (keys.right) targetX += dt * 1.1;
    targetX = Math.min(.94, Math.max(.06, targetX));
    duduX += (targetX - duduX) * Math.min(1, dt * 12);

    const dw = Math.min(110, W * .22), dh = dw * (dudu.naturalHeight / dudu.naturalWidth || 1.2);
    const dx = duduX * W, dy = H - dh - 8;
    items.forEach(it => {
      it.vy += 120 * (1 + pace * .6) * dt;
      it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.spin * dt;
      if (it.x < 20 || it.x > W - 20) it.vx *= -1;
      const caught = it.y > dy + dh * .15 && it.y < dy + dh * .6 && Math.abs(it.x - dx) < dw * .45;
      if (caught) {
        it.done = true;
        score = Math.max(0, score + (it.bad ? -2 : 1));
        if (it.bad) shake = .4;
        pops.push({ x: it.x, y: dy, t: 0, text: it.bad ? "−2" : "+1", bad: it.bad });
      }
      if (it.y > H + 40) it.done = true;
    });
    items = items.filter(it => !it.done);
    pops.forEach(p => { p.t += dt; });
    pops = pops.filter(p => p.t < .8);
    shake = Math.max(0, shake - dt);
    draw(dw, dh, dx, dy);
    requestAnimationFrame(loop);
  }

  function draw(dw, dh, dx, dy) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const bw = Math.min(90, W * .18), bh = bw * (bubu.naturalHeight / bubu.naturalWidth || 1.1);
    if (bubu.complete) ctx.drawImage(bubu, bubuX * W - bw / 2, 6 + Math.sin(performance.now() / 300) * 2, bw, bh);
    items.forEach(it => {
      if (it.bad) drawCilantro(it.x, it.y, it.s, it.rot);
      else { ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot * .3); ctx.fillStyle = it.color; heartPath(0, -it.s / 2, it.s); ctx.fill(); ctx.restore(); }
    });
    if (dw && dudu.complete) {
      const jiggle = shake > 0 ? Math.sin(shake * 60) * 6 : 0;
      ctx.drawImage(dudu, dx - dw / 2 + jiggle, dy, dw, dh);
    }
    ctx.font = `500 20px "EB Garamond", Georgia, serif`;
    ctx.textAlign = "center";
    pops.forEach(p => {
      ctx.globalAlpha = 1 - p.t / .8;
      ctx.fillStyle = p.bad ? "#5E8C4A" : "#C26F6F";
      ctx.fillText(p.text, p.x, p.y - p.t * 50);
      ctx.globalAlpha = 1;
    });
    scoreEl.textContent = score;
    timeEl.textContent = Math.ceil(left);
  }

  function intro() {
    state = "idle";
    overlay.innerHTML = `
      <p class="game-title">Catch the hearts</p>
      <p>Bubu is tossing hearts. Move Dudu to catch as many as you can in 30 seconds, and watch out for the cilantro!</p>
      <p class="hint">Drag, move your mouse, or use the arrow keys.</p>
      <button type="button" class="btn btn-solid" id="game-start">Start</button>
      ${best() ? `<p class="hint">Your best: ${best()}</p>` : ""}`;
    overlay.hidden = false;
    document.getElementById("game-start").addEventListener("click", start);
  }

  const pointTo = clientX => {
    const r = canvas.getBoundingClientRect();
    targetX = (clientX - r.left) / r.width;
  };
  canvas.addEventListener("pointermove", e => pointTo(e.clientX));
  canvas.addEventListener("pointerdown", e => pointTo(e.clientX));
  canvas.addEventListener("touchmove", e => { pointTo(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  dlg.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { keys.left = true; e.preventDefault(); }
    if (e.key === "ArrowRight") { keys.right = true; e.preventDefault(); }
  });
  dlg.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
  });
  dlg.addEventListener("close", () => { state = "idle"; });

  document.getElementById("game-btn").addEventListener("click", () => {
    dlg.showModal();
    resize();
    intro();
  });
})();
