// The ocean above Claire's sand heart: now and then a sea friend swims by.
// Tap, click or press Enter on one and it does its own little trick.
// Motion stops while the page is hidden or scrolled away, when paused, and by default for reduced motion.
(() => {
  const ocean = document.getElementById("ocean");
  if (!ocean || !ocean.animate) return;
  const water = document.getElementById("ocean-visitors");
  const shore = document.getElementById("ocean-shoreline");
  const toggle = document.getElementById("ocean-toggle");
  const live = document.getElementById("ocean-live");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- The animals, drawn facing right ----------

  const fish = (n, x, y, c1, c2) => `
    <g transform="translate(${x} ${y})"><g class="fish fish-${n}">
      <path class="wag" d="M7 8 1 2.5 2.6 8 1 13.5Z" fill="${c2}"/>
      <path d="M6 8C9 3 17 1.5 23 4.6 26 6.2 27 7.4 27 8 27 8.6 26 9.8 23 11.4 17 14.5 9 13 6 8Z" fill="${c1}"/>
      <path d="M13 3.2C15 1 18 .4 20 1.2 18 2 17 2.8 16.5 3.4Z" fill="${c2}"/>
      <path d="M12 9.5C15 11 19 11.2 22 10" stroke="#fff" stroke-opacity=".45" fill="none"/>
      <circle cx="22.6" cy="6.8" r="1.25" fill="#22313D"/>
    </g></g>`;

  const SPECIES = {
    fish: {
      name: "a little school of fish", weight: 30, w: 66, h: 40, speed: [9000, 12500], lane: "water",
      svg: `<svg viewBox="0 0 66 40" width="66" height="40">${fish(1, 2, 4, "#F2A65A", "#E07A3F")}${fish(2, 30, 14, "#7FC8C2", "#4FA39C")}${fish(3, 8, 24, "#F6C76B", "#E3A33A")}</svg>`,
      trick: "scatter", said: "The fish scattered and swam back together."
    },
    dolphin: {
      name: "a dolphin", weight: 20, w: 100, h: 44, speed: [10000, 13000], lane: "water",
      svg: `<svg viewBox="0 0 120 52" width="100" height="44">
        <g class="wag" transform="translate(0 4)"><path d="M22 26C16 25 11 23 7 19 5 15 4 11 1 8 7 10 11 15 13 19 9 22 5 28 3 35 9 31 13 28 18 28Z" fill="#5F8299"/></g>
        <path d="M18 29C30 19 52 14 74 15 86 15 96 18 104 22L117 24C118.5 25 118 26.5 116 26.6L104 27.4C98 32 86 36 70 36 52 37 34 35 18 29Z" fill="#6E91A8"/>
        <path d="M30 31C44 35 60 36 74 35 86 34 96 31 103 27.6 96 33 84 37 70 37 54 38 40 35 30 31Z" fill="#DDE8EE"/>
        <path d="M57 15.5C59 7 65 2.5 70 3 66.5 7 65.5 11.5 67.5 16Z" fill="#5F8299"/>
        <g class="paddle"><path d="M73 32C71 39 65 44 60 44.5 63.5 40 66 35.5 67 32Z" fill="#5F8299"/></g>
        <circle cx="96.5" cy="21.6" r="1.5" fill="#22313D"/>
        <path d="M104.5 25.6C102 26.6 99.5 26.8 97 26.4" stroke="#3F5D70" fill="none" stroke-linecap="round"/>
      </svg>`,
      trick: "flip", said: "The dolphin did a flip!"
    },
    orca: {
      name: "an orca", weight: 10, w: 124, h: 50, speed: [17000, 21000], lane: "water",
      svg: `<svg viewBox="0 0 150 62" width="124" height="50">
        <g class="wag" transform="translate(0 6)"><path d="M28 28C20 27 14 24 10 20 8 16 8 12 4 9 11 12 16 18 18 22 13 26 9 32 7 39 13 35 19 31 24 30Z" fill="#1E262D"/></g>
        <path d="M24 34C40 22 70 18 100 19 120 20 136 26 144 33 146 35 144.5 37 141 38 128 44 104 47 80 47 56 47 38 42 24 34Z" fill="#1E262D"/>
        <path d="M84 46C104 46 124 43 137 37.5 129 43 112 46.5 96 47Z" fill="#F4F6F7"/>
        <path d="M68 21C78 23.5 92 23.5 101 20.5 93 25 78 25.5 68 21Z" fill="#9AA6AE"/>
        <path d="M81 20C83 9 87 0 91.5 -2.5 91.5 7 93 14 97 20Z" fill="#1E262D"/>
        <ellipse cx="124" cy="28.4" rx="6.5" ry="2.7" transform="rotate(-8 124 28.4)" fill="#F4F6F7"/>
        <g class="paddle"><path d="M101 42C99 51 93 57 87 57.5 91 52 95 46 97 42Z" fill="#1E262D"/></g>
      </svg>`,
      trick: "spout", said: "The orca blew a spout of water."
    },
    shark: {
      name: "a shark", weight: 10, w: 114, h: 44, speed: [12000, 15000], lane: "water",
      svg: `<svg viewBox="0 0 140 56" width="114" height="44">
        <g class="wag" transform="translate(0 2)"><path d="M23 27 11 17C9 11 7 5 2 1 10 7 16 15 21 21L15 33C11 39 7 43 4 47 10 43 17 37 23 31Z" fill="#6E7F8C"/></g>
        <path d="M20 29C36 19 64 15 92 16 110 17 126 22 137 28.5 128 33 112 37 92 38 64 39 38 36 20 29Z" fill="#7D8E9B"/>
        <path d="M44 34C64 38 92 38.5 112 35 122 33 130 31 134 29.6 126 34.5 110 38 92 39 70 39.5 54 37.5 44 34Z" fill="#E9EEF1"/>
        <path d="M70 17C74 7 80 1 86.5 -1.5 84.5 6.5 84.5 12 86.5 17Z" fill="#6E7F8C"/>
        <g class="paddle"><path d="M96 35C92 45 84 51 77.5 53 82 45 88 39 90 35Z" fill="#6E7F8C"/></g>
        <path d="M104 25.5V31M107.5 25V30.6M111 24.6V30" stroke="#5E6F7B" stroke-linecap="round"/>
        <circle cx="119.5" cy="24.4" r="1.4" fill="#22313D"/>
      </svg>`,
      trick: "dash", said: "The shark zoomed off. Don't worry, it's a friendly one."
    },
    seal: {
      name: "a seal", weight: 15, w: 80, h: 40, speed: [11000, 14000], lane: "water",
      svg: `<svg viewBox="0 0 92 44" width="80" height="40">
        <g class="wag"><path d="M15 26C9 22 5 20 1 20 4 24 6 26 8 28 4 30 2 34 1 37 6 34 10 32 15 29Z" fill="#776C64"/></g>
        <path d="M12 26C16 16 34 12 52 13 64 14 74 17 81 22 85 25 84.5 29 79 30.5 70 33 56 34 40 33 26 33 16 31 12 26Z" fill="#8F837A"/>
        <path d="M30 31C44 33.5 62 33.5 76 30.8 66 34 52 35 40 34.5 36 34.4 33 33.6 30 31Z" fill="#C9BFB6"/>
        <g fill="#776C64"><circle cx="34" cy="20" r="1.3"/><circle cx="44" cy="17.5" r="1"/><circle cx="52" cy="21" r="1.2"/></g>
        <g class="paddle"><path d="M53 30C51 36 47 40 41 41 45 36.5 47 33 48 30Z" fill="#776C64"/></g>
        <circle cx="74.6" cy="20.6" r="1.6" fill="#22313D"/>
        <ellipse cx="83" cy="24" rx="1.6" ry="1.2" fill="#3B3430"/>
        <path d="M80 26.4 88 25M80 27.4 87.5 28.6" stroke="#5A504A" stroke-width=".7" stroke-linecap="round"/>
      </svg>`,
      trick: "roll", said: "The seal did a barrel roll and sent a heart."
    },
    crab: {
      name: "a crab", weight: 15, w: 60, h: 38, speed: [13000, 17000], lane: "sand",
      svg: `<svg viewBox="0 0 70 44" width="60" height="38">
        <g stroke="#C9573F" stroke-width="2.2" stroke-linecap="round" fill="none">
          <path class="leg" d="M24 30 15 35 12 41"/><path class="leg" d="M25 33 18 39 17 43"/><path class="leg" d="M27 35 23 41"/>
          <path class="leg" d="M46 30 55 35 58 41"/><path class="leg" d="M45 33 52 39 53 43"/><path class="leg" d="M43 35 47 41"/>
          <path d="M31 18 30 11M39 18 40 11"/>
        </g>
        <g class="claw claw-l"><path d="M23 25C17 23 12 19 10 13 8 9 11 4.6 15.5 6 13.8 9 14.6 12 17.6 12.4 17.6 8.6 21.4 6.4 24 9 24.5 14 22.5 18.5 24.5 22Z" fill="#E07A5F"/></g>
        <g class="claw claw-r"><path d="M47 25C53 23 58 19 60 13 62 9 59 4.6 54.5 6 56.2 9 55.4 12 52.4 12.4 52.4 8.6 48.6 6.4 46 9 45.5 14 47.5 18.5 45.5 22Z" fill="#E07A5F"/></g>
        <ellipse cx="35" cy="27" rx="15.5" ry="10" fill="#E07A5F"/>
        <path d="M25 24C30 21 40 21 45 24" stroke="#F3A68F" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <circle cx="30" cy="10.4" r="2.6" fill="#fff"/><circle cx="40" cy="10.4" r="2.6" fill="#fff"/>
        <circle cx="30.5" cy="10.8" r="1.3" fill="#22313D"/><circle cx="40.5" cy="10.8" r="1.3" fill="#22313D"/>
      </svg>`,
      trick: "wave", said: "The crab waved hello with both claws."
    }
  };

  // ---------- State: running only when allowed, visible, and on screen ----------

  let wanted = true, visible = !document.hidden, onScreen = true, running = false;
  let spawnTimer = 0;
  const moving = new Set();   // Web Animations we pause and resume together
  const timers = new Set();

  try {
    const saved = localStorage.getItem("cp-ocean");
    wanted = saved ? saved === "on" : !reduce.matches;
  } catch { wanted = !reduce.matches; }

  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const say = text => { live.textContent = ""; requestAnimationFrame(() => { live.textContent = text; }); };

  function track(anim) {
    moving.add(anim);
    const done = () => moving.delete(anim);
    anim.addEventListener("finish", done);
    anim.addEventListener("cancel", done);
    if (!running) anim.pause();
    return anim;
  }

  function sync() {
    const go = wanted && visible && onScreen;
    toggle.setAttribute("aria-pressed", String(!wanted));
    toggle.setAttribute("aria-label", wanted ? "Pause the ocean" : "Play the ocean");
    if (go === running) return;
    running = go;
    ocean.classList.toggle("is-live", go);
    moving.forEach(a => (go ? a.play() : a.pause()));
    if (go) scheduleNext(document.querySelector(".critter") ? rand(6000, 12000) : 2500);
    else { clearTimeout(spawnTimer); spawnTimer = 0; }
  }

  function scheduleNext(ms) {
    clearTimeout(spawnTimer);
    spawnTimer = setTimeout(() => {
      spawnTimer = 0;
      if (!running) return;
      const max = ocean.clientWidth < 560 ? 1 : 2;
      if (ocean.querySelectorAll(".critter").length < max) spawn();
      scheduleNext(rand(7000, 15000));
    }, ms);
  }

  function pick() {
    const kinds = Object.keys(SPECIES);
    const total = kinds.reduce((n, k) => n + SPECIES[k].weight, 0);
    let r = Math.random() * total;
    for (const k of kinds) { r -= SPECIES[k].weight; if (r <= 0) return k; }
    return "fish";
  }

  // ---------- A visitor swims (or scuttles) across ----------

  function spawn(kind = pick()) {
    const sp = SPECIES[kind];
    const lane = sp.lane === "sand" ? shore : water;
    const W = ocean.clientWidth;
    const leftward = Math.random() < .5;
    const el = document.createElement("button");
    el.type = "button";
    el.className = `critter c-${kind}${leftward ? " is-left" : ""}`;
    el.setAttribute("aria-label", `${sp.name[0].toUpperCase()}${sp.name.slice(1)} passing by. Tap to say hi.`);
    el.style.width = `${Math.max(44, sp.w)}px`;
    el.style.height = `${Math.max(44, sp.h)}px`;
    el.innerHTML = `<span class="body"><span class="face">${sp.svg}</span></span>`;
    if (sp.lane === "water") el.style.marginTop = `${-Math.max(44, sp.h) / 2 + rand(-5, 5)}px`;
    lane.append(el);

    const from = leftward ? W + 20 : -sp.w - 20;
    const to = leftward ? -sp.w - 20 : W + 20;
    const duration = rand(...sp.speed) * Math.max(.75, W / 1100);
    const frames = kind === "crab"
      // a crab scuttles, stops to look around, then scuttles on
      ? [{ transform: `translateX(${from}px)`, offset: 0 }, { transform: `translateX(${from + (to - from) * .42}px)`, offset: .38 },
         { transform: `translateX(${from + (to - from) * .42}px)`, offset: .52 }, { transform: `translateX(${to}px)`, offset: 1 }]
      : [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }];
    const swim = track(el.animate(frames, { duration, easing: "linear", fill: "forwards" }));
    el._swim = swim;
    swim.addEventListener("finish", () => leave(el));
    el.addEventListener("click", () => react(el, kind));
  }

  function leave(el) {
    if (document.activeElement === el) toggle.focus({ preventScroll: true });
    el.getAnimations({ subtree: true }).forEach(a => a.cancel());
    el.remove();
  }

  // ---------- Tricks ----------

  function fx(kind, x, y, keyframes, options) {
    const d = document.createElement("span");
    d.className = `ocean-fx ${kind}`;
    d.style.transform = `translate(${x}px, ${y}px)`;
    ocean.append(d);
    const a = track(d.animate(keyframes, { easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards", ...options }));
    a.addEventListener("finish", () => d.remove());
    a.addEventListener("cancel", () => d.remove());
  }

  function where(el) {
    const o = ocean.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  }

  function hearts(p, n = 3) {
    for (let i = 0; i < n; i++) {
      const x = p.x + p.w / 2 - 7 + rand(-14, 14), y = p.y - 4;
      fx("sea-heart", x, y, [{ transform: `translate(${x}px, ${y}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${x}px, ${y - 12}px) scale(1)`, opacity: 1, offset: .25 },
        { transform: `translate(${x + rand(-10, 10)}px, ${y - 40}px) scale(.8)`, opacity: 0 }], { duration: 1400, delay: i * 140 });
    }
  }

  function react(el, kind) {
    if (el._busy) return;
    el._busy = true;
    const face = el.querySelector(".face");
    const left = el.classList.contains("is-left");
    const p = where(el);
    let anim;

    if (kind === "fish") {
      el.querySelectorAll(".fish").forEach((f, i) => {
        const dx = rand(-26, 26), dy = (i - 1) * 12;
        track(f.animate([{ translate: "0 0" }, { translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration: 1100, easing: "cubic-bezier(.22,1,.36,1)" }));
      });
      for (let i = 0; i < 5; i++) {
        const x = p.x + rand(0, p.w), y = p.y + p.h / 2;
        fx("bubble", x, y, [{ transform: `translate(${x}px, ${y}px) scale(.5)`, opacity: .9 },
          { transform: `translate(${x + rand(-6, 6)}px, ${y - rand(18, 34)}px) scale(1)`, opacity: 0 }], { duration: 1000, delay: i * 90 });
      }
      anim = track(el.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1100 }));
    } else if (kind === "dolphin") {
      anim = track(face.animate([
        { transform: `translateY(0) rotate(0)` },
        { transform: `translateY(-14px) rotate(${left ? 180 : -180}deg)`, offset: .5 },
        { transform: `translateY(0) rotate(${left ? 360 : -360}deg)` }], { duration: 900, easing: "ease-in-out", composite: "replace" }));
      const x = p.x + p.w / 2 - 15, y = p.y + p.h - 8;
      fx("ring", x, y, [{ transform: `translate(${x}px, ${y}px) scale(.3)`, opacity: .9 }, { transform: `translate(${x}px, ${y}px) scale(2.2)`, opacity: 0 }], { duration: 900, delay: 650 });
    } else if (kind === "orca") {
      const bx = p.x + (left ? p.w * .27 : p.w * .73), by = p.y + p.h * .3;
      for (let i = 0; i < 9; i++) {
        const dx = rand(-18, 18), up = Math.min(rand(18, 30), by - 2);
        fx("drop", bx, by, [{ transform: `translate(${bx}px, ${by}px) scale(.6)`, opacity: 1 },
          { transform: `translate(${bx + dx * .6}px, ${by - up}px) scale(1)`, opacity: 1, offset: .5 },
          { transform: `translate(${bx + dx}px, ${by - up * .4}px) scale(.8)`, opacity: 0 }], { duration: 1100, delay: i * 35, easing: "ease-out" });
      }
      anim = track(face.animate([{ transform: `translateY(0)` }, { transform: `translateY(-4px)` }, { transform: `translateY(0)` }], { duration: 1100, easing: "ease-in-out" }));
    } else if (kind === "shark") {
      el._swim.updatePlaybackRate(3.2);
      later(() => el._swim.updatePlaybackRate(1), 900);
      anim = track(face.animate([{ transform: `rotate(0)` }, { transform: `rotate(-4deg)` }, { transform: `rotate(3deg)` }, { transform: `rotate(0)` }], { duration: 900 }));
      for (let i = 0; i < 4; i++) {
        const x = p.x + (left ? p.w : 0), y = p.y + p.h / 2 + rand(-8, 8);
        fx("bubble", x, y, [{ transform: `translate(${x}px, ${y}px)`, opacity: .9 }, { transform: `translate(${x + (left ? 30 : -30)}px, ${y - 10}px)`, opacity: 0 }], { duration: 700, delay: i * 80 });
      }
    } else if (kind === "seal") {
      anim = track(face.animate([{ transform: `rotate(0)` }, { transform: `rotate(${left ? -360 : 360}deg)` }], { duration: 1000, easing: "cubic-bezier(.45,0,.25,1)" }));
      hearts(p, 2);
    } else {
      el.classList.add("is-waving");
      el._swim.pause();
      hearts(p, 3);
      anim = track(el.animate([{ transform: "translateY(0)" }, { transform: "translateY(-8px)", offset: .3 }, { transform: "translateY(0)", offset: .6 }], { duration: 1500, composite: "add" }));
      anim.addEventListener("finish", () => { el.classList.remove("is-waving"); if (running) el._swim.play(); });
    }
    say(SPECIES[kind].said);
    anim.addEventListener("finish", () => { el._busy = false; });
  }

  // ---------- Controls and housekeeping ----------

  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    wanted = !wanted;
    try { localStorage.setItem("cp-ocean", wanted ? "on" : "off"); } catch {}
    sync();
  });
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; sync(); });
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(ocean);
  reduce.addEventListener?.("change", e => {
    let saved = null;
    try { saved = localStorage.getItem("cp-ocean"); } catch {}
    if (!saved) { wanted = !e.matches; sync(); }
  });
  addEventListener("pagehide", () => {
    // BFCache retains this closure. Stop cleanly so pageshow can restart the
    // scheduler, rather than retaining running=true with its only timer gone.
    visible = false;
    sync();
    timers.forEach(clearTimeout);
    timers.clear();
    [...moving].forEach(a => a.cancel());
    ocean.querySelectorAll(".critter").forEach(leave);
  });
  addEventListener("pageshow", () => {
    visible = !document.hidden;
    sync();
  });

  sync();
  // for quick checks in the console: oceanVisit("orca")
  window.oceanVisit = kind => SPECIES[kind] && spawn(kind);
})();
