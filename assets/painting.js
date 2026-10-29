// The garden watercolor, repainted live as impressionist brushstrokes. The two of us
// (masked out of the painting) stay crisp while the garden around us flows; scrolling
// past turns the day into a swirling starry night with a tiny planet under our feet.
(function () {
  const band = document.querySelector(".painting");
  if (!band) return;
  const canvas = document.createElement("canvas");
  canvas.className = "painting-canvas";
  canvas.setAttribute("aria-hidden", "true");
  band.append(canvas);
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Deterministic random so every visit paints the same picture
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const scene = new Image(), couple = new Image();
  scene.src = "assets/images/estate-painting.webp";
  couple.src = "assets/images/estate-couple.webp";
  let ready = 0;
  scene.onload = couple.onload = () => { if (++ready === 2) { build(); resize(); } };

  let strokes = [], stars = [], planet = [];
  let backdrop = null;
  let W = 0, H = 0, dpr = 1, fit = null, night = 0, sp = 0, visible = false, raf = 0;
  const IW = 715, IH = 490;
  // Night palette for the sky, light to deep
  const NIGHT = [[24, 38, 82], [38, 62, 118], [62, 96, 158], [228, 206, 120]];

  function build() {
    const c = document.createElement("canvas");
    c.width = IW; c.height = IH;
    const g = c.getContext("2d");
    g.drawImage(scene, 0, 0);
    const data = g.getImageData(0, 0, IW, IH), px = data.data;
    // Paint the original pair out of the backdrop: masked pixels take the colours of
    // the garden on either side of them in the same row
    const m = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    m.canvas.width = IW; m.canvas.height = IH;
    m.drawImage(couple, 0, 0);
    const ma = m.getImageData(0, 0, IW, IH).data;
    const masked = (x, y) => ma[(y * IW + x) * 4 + 3] > 8;
    for (let y = 0; y < IH; y++) {
      for (let x = 0; x < IW; x++) {
        if (!masked(x, y)) continue;
        let l = x; while (l > 0 && masked(l, y)) l--;
        let r = x; while (r < IW - 1 && masked(r, y)) r++;
        const pad = 6, li = (y * IW + Math.max(0, l - pad)) * 4, ri = (y * IW + Math.min(IW - 1, r + pad)) * 4;
        for (let xx = l + 1; xx < r; xx++) {
          const t = (xx - l) / (r - l), o = (y * IW + xx) * 4;
          for (let ch = 0; ch < 3; ch++) px[o + ch] = px[li + ch] * (1 - t) + px[ri + ch] * t;
        }
        x = r;
      }
    }
    g.putImageData(data, 0, 0);
    backdrop = c;
    const lum = (x, y) => { const i = (y * IW + x) * 4; return px[i] + px[i + 1] + px[i + 2]; };
    const step = 4;
    for (let y = 2; y < IH - 2; y += step) {
      for (let x = 2; x < IW - 2; x += step) {
        const jx = Math.round(x + (rand() - 0.5) * step), jy = Math.round(y + (rand() - 0.5) * step);
        const sx = clamp(jx, 1, IW - 2), sy = clamp(jy, 1, IH - 2);
        const i = (sy * IW + sx) * 4;
        // Strokes follow the edges in the painting, like brushwork following form
        const gx = lum(sx + 1, sy) - lum(sx - 1, sy), gy = lum(sx, sy + 1) - lum(sx, sy - 1);
        const v = sy / IH;
        // Sky strokes pick a night colour; a few become warm star swirls
        const n = rand() < 0.035 ? NIGHT[3] : NIGHT[Math.floor(rand() * 3)];
        strokes.push({
          u: sx / IW, v, angle: Math.atan2(gy, gx) + Math.PI / 2 + (rand() - 0.5) * 0.7,
          r: px[i], g: px[i + 1], b: px[i + 2], n,
          len: 0.8 + rand() * 1.2, phase: rand() * Math.PI * 2,
          sky: v < 0.47 ? 1 : smooth(0.62, 0.47, v),
        });
      }
    }
    for (let i = strokes.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [strokes[i], strokes[j]] = [strokes[j], strokes[i]]; }
    for (let i = 0; i < 46; i++) stars.push({ u: rand(), v: rand() * 0.6, r: 1.4 + rand() * 2.4, phase: rand() * 6 });
    const tones = ["#6c8a9e", "#8fae9a", "#a9c1a4", "#59768a", "#c6d2bb", "#d9b87a"];
    for (let i = 0; i < 900; i++) planet.push({ a: Math.PI + rand() * Math.PI, rr: Math.sqrt(rand()), color: tones[Math.floor(rand() * tones.length)], tilt: (rand() - 0.5) * 0.8 });
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = band.clientWidth; H = band.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    // Match the CSS backdrop: cover, centred, 40% vertical
    const s = Math.max(W / IW, H / IH);
    fit = { s, x: (W - IW * s) / 2, y: (H - IH * s) * 0.4 };
    draw(performance.now());
  }

  function draw(t) {
    if (!fit) return;
    const time = still ? 0 : t / 1000;
    const { s, x: ox, y: oy } = fit;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(backdrop, ox, oy, IW * s, IH * s);

    // Brushstrokes over the whole scene; the sky turns to a swirling night
    const base = Math.max(2.2, s * 2.6);
    ctx.lineCap = "round";
    ctx.lineWidth = base * 1.15;
    const cx = W / 2;
    for (const k of strokes) {
      const px = ox + k.u * IW * s, py = oy + k.v * IH * s;
      if (px < -10 || px > W + 10 || py < -10 || py > H + 10) continue;
      const nk = night * k.sky;
      // Starry swirl: sky strokes turn to follow a flowing field of eddies
      // The eddies turn as you scroll, so the whole sky churns with the page
      const fx = k.u * 6 + time * 0.12 + sp * 7, fy = k.v * 7 - sp * 3;
      const flow = Math.atan2(Math.cos(fx) * Math.sin(fy), Math.sin(fx + fy * 0.6)) + Math.PI / 2;
      const wob = still ? 0 : Math.sin(time * 0.9 + k.phase) * (0.18 + nk * 0.3);
      // Ground strokes lie down into long horizontal grass at night
      const lay = night * (1 - k.sky) * 0.8;
      const a = k.angle + (flow - k.angle) * nk + (0 - k.angle) * lay + wob;
      const l = base * k.len * (1 + nk * 1.6);
      const r = k.r + (k.n[0] - k.r) * nk, g = k.g + (k.n[1] - k.g) * nk, b = k.b + (k.n[2] - k.b) * nk;
      // Ground darkens toward a moonlit blue-green as night falls
      const gd = night * (1 - k.sky);
      ctx.strokeStyle = `rgb(${r * (1 - gd * 0.7) | 0},${g * (1 - gd * 0.6) | 0},${(b * (1 - gd * 0.5) + gd * 30) | 0})`;
      const dx = Math.cos(a) * l, dy = Math.sin(a) * l;
      // Night strokes ride along the flow instead of staying pinned in place
      const ride = nk * base * 5 * Math.sin(time * 0.8 + k.phase + sp * 9);
      const qx = px + Math.cos(a) * ride, qy = py + Math.sin(a) * ride;
      ctx.beginPath(); ctx.moveTo(qx - dx, qy - dy); ctx.lineTo(qx + dx, qy + dy); ctx.stroke();
    }

    // Stars come out
    if (night > 0.01) {
      for (const st of stars) {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.4 + st.phase));
        const x = st.u * W, y = st.v * H;
        ctx.fillStyle = `rgba(255,246,206,${night * tw})`;
        ctx.beginPath();
        for (let q = 0; q < 8; q++) { const rr = q % 2 ? st.r * 0.35 : st.r * 1.9, aa = q * Math.PI / 4; ctx.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); }
        ctx.fill();
      }
    }

    // We stand in the aisle by day; at night a tiny planet rises under our feet
    const ch = Math.min(H * 0.7, W * 0.95 * 416 / 302), cs = ch / 416;
    const feetY = H * 0.8, cxx = W / 2;
    const lift = smooth(0, 1, night);
    const pr = 302 * cs * 0.85, pcy = feetY + pr * 0.86 + (1 - lift) * pr * 0.9;
    if (night > 0.01) {
      ctx.globalAlpha = smooth(0, 0.6, night);
      const disc = ctx.createRadialGradient(cxx - pr * 0.3, pcy - pr * 0.4, pr * 0.1, cxx, pcy, pr);
      disc.addColorStop(0, "#c9d6c0"); disc.addColorStop(0.6, "#7f9b8f"); disc.addColorStop(1, "#4a647a");
      ctx.fillStyle = disc;
      ctx.beginPath(); ctx.arc(cxx, pcy, pr, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = base * 1.4;
      for (const p of planet) {
        const rad = pr * (0.3 + 0.7 * p.rr), x = cxx + Math.cos(p.a) * rad, y = pcy + Math.sin(p.a) * rad;
        if (y > H + 4) continue;
        const a = p.a + Math.PI / 2 + p.tilt, l = base * 1.6;
        ctx.strokeStyle = p.color;
        ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // Us, untouched: the couple's box in the source runs x 255-557, y 72-488
    ctx.drawImage(couple, cxx - 406 * cs, feetY - 488 * cs, IW * cs, IH * cs);
  }

  // Night falls over a long stretch of scrolling: it starts while the schedule is on
  // screen and is complete once the painting is centred. The whole page follows.
  const DAY = { paper: "#FAF9F5", "paper-deep": "#F2F0E8", ink: "#22313D", "ink-soft": "#55636F", dusty: "#5C8DAF", "dusty-deep": "#3F6683", mist: "#E6EEF4", line: "#DCE3E9", card: "#FFFFFF" };
  const DARK = { paper: "#121a33", "paper-deep": "#18223f", ink: "#EEF0F6", "ink-soft": "#B6C1D6", dusty: "#8FB4D6", "dusty-deep": "#A9C6E4", mist: "#22315a", line: "#2f4068", card: "#1a2648" };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const root = document.documentElement;
  let lastNight = -1;
  function measure() {
    const shown = band.offsetParent !== null;
    const r = band.getBoundingClientRect(), vh = innerHeight;
    const start = vh * 2.4, end = (vh - r.height) / 2;
    sp = shown ? clamp((start - r.top) / (start - end), 0, 1.4) : 0;
    night = shown ? smooth(0, 1, sp) : 0;
    if (Math.abs(night - lastNight) < 0.004) return;
    lastNight = night;
    for (const k in DAY) {
      const a = hex(DAY[k]), b = hex(DARK[k]);
      root.style.setProperty("--" + k, `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * night)).join(",")})`);
    }
    root.style.setProperty("--night", night.toFixed(3));
    root.classList.toggle("is-night", night > 0.5);
    sky.style.opacity = night.toFixed(3);
    if (night > 0.01 && !skyRaf && !still) skyRaf = requestAnimationFrame(skyLoop);
    if (still) drawSky(0);
  }

  // ---------- A full-screen night sky behind the page ----------
  const sky = document.createElement("canvas");
  sky.className = "night-sky";
  sky.setAttribute("aria-hidden", "true");
  document.body.prepend(sky);
  const sx = sky.getContext("2d");
  const skyStars = Array.from({ length: 140 }, () => ({ x: rand(), y: rand(), r: 0.4 + rand() * 1.4, ph: rand() * 6, big: rand() < 0.12 }));
  let shoot = null, nextShoot = 0, skyRaf = 0;
  function sizeSky() { sky.width = innerWidth * dpr; sky.height = innerHeight * dpr; }
  function drawSky(t) {
    const w = innerWidth, h = innerHeight, time = t / 1000;
    sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sx.clearRect(0, 0, w, h);
    // Stars drift slowly upward as you scroll, like the sky turning
    const drift = (scrollY * 0.05) % h;
    for (const st of skyStars) {
      const y = (st.y * h - drift + h) % h, x = st.x * w;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(time * (st.big ? 0.9 : 1.6) + st.ph));
      sx.fillStyle = `rgba(255,246,214,${tw})`;
      if (st.big) {
        const R = 2.6 + st.r;
        sx.beginPath();
        for (let q = 0; q < 8; q++) { const rr = q % 2 ? R * 0.3 : R * 1.6, a = q * Math.PI / 4 + time * 0.2; sx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        sx.fill();
      } else { sx.beginPath(); sx.arc(x, y, st.r, 0, 7); sx.fill(); }
    }
    // A crescent moon with a soft glow
    const mx = w * 0.84, my = h * 0.16, mr = Math.min(42, w * 0.06);
    const glow = sx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.2);
    glow.addColorStop(0, "rgba(255,240,200,.35)"); glow.addColorStop(1, "rgba(255,240,200,0)");
    sx.fillStyle = glow; sx.beginPath(); sx.arc(mx, my, mr * 3.2, 0, 7); sx.fill();
    sx.fillStyle = "#FFF1C9"; sx.beginPath(); sx.arc(mx, my, mr, 0, 7); sx.fill();
    sx.globalCompositeOperation = "destination-out";
    sx.beginPath(); sx.arc(mx + mr * 0.45, my - mr * 0.2, mr * 0.9, 0, 7); sx.fill();
    sx.globalCompositeOperation = "source-over";
    // Now and then a shooting star
    if (!still) {
      if (!shoot && time > nextShoot) shoot = { x: rand() * w * 0.7, y: rand() * h * 0.35, t0: time };
      if (shoot) {
        const k = (time - shoot.t0) / 1.1;
        if (k > 1) { shoot = null; nextShoot = time + 4 + rand() * 6; }
        else {
          const hx = shoot.x + k * 320, hy = shoot.y + k * 140;
          const tail = sx.createLinearGradient(hx - 130, hy - 57, hx, hy);
          tail.addColorStop(0, "rgba(255,240,200,0)"); tail.addColorStop(1, `rgba(255,248,226,${1 - k})`);
          sx.strokeStyle = tail; sx.lineWidth = 2; sx.beginPath(); sx.moveTo(hx - 130, hy - 57); sx.lineTo(hx, hy); sx.stroke();
        }
      }
    }
  }
  function skyLoop(t) {
    skyRaf = 0;
    if (night <= 0.01) return;
    drawSky(t);
    skyRaf = requestAnimationFrame(skyLoop);
  }
  sizeSky();
  addEventListener("resize", sizeSky);
  let scrollRaf = 0;
  const onScroll = () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; measure(); if (!visible && still) draw(0); }); };
  addEventListener("scroll", onScroll, { passive: true });
  // Switching tabs hides the painting, which should bring the day back
  addEventListener("hashchange", () => setTimeout(onScroll, 50));
  document.addEventListener("click", () => setTimeout(onScroll, 60));

  function loop(t) {
    raf = 0;
    if (!visible) return;
    measure(); draw(t);
    if (!still) raf = requestAnimationFrame(loop);
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }).observe(band);
  // Reduced motion still follows scroll, without the continuous shimmer
  if (still) addEventListener("scroll", () => { if (visible && !raf) raf = requestAnimationFrame(loop); }, { passive: true });
  new ResizeObserver(() => { if (ready === 2 && (band.clientWidth !== W || band.clientHeight !== H)) resize(); }).observe(band);
})();
