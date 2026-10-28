(() => {
  const WEDDING = new Date("2027-03-07T15:45:00-08:00");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    $("toast-container").append(t);
    setTimeout(() => t.remove(), 3700);
  }

  // ---------- Tabs, with Bubu and Dudu hopping along the bar ----------

  const pages = [...document.querySelectorAll(".page")];
  const tabLinks = [...document.querySelectorAll(".tabs a[data-tab]")];
  const tabBears = $("tab-bears");
  let currentX = null;

  function placeTabBears(link, hop) {
    const x = link.offsetLeft + link.offsetWidth / 2 - tabBears.offsetWidth / 2;
    if (hop && !reduced && currentX !== null && Math.abs(currentX - x) > 2) {
      tabBears.style.setProperty("--from", `${currentX}px`);
      tabBears.classList.remove("is-hopping");
      void tabBears.offsetWidth;
      tabBears.classList.add("is-hopping");
    }
    tabBears.style.setProperty("--bx", `${x}px`);
    currentX = x;
  }
  tabBears.addEventListener("animationend", () => tabBears.classList.remove("is-hopping"));

  function showTab(name, hop = true) {
    if (!pages.some(p => p.dataset.page === name)) name = "home";
    pages.forEach(p => { p.hidden = p.dataset.page !== name; });
    tabLinks.forEach(a => a.classList.toggle("is-active", a.dataset.tab === name));
    tabLinks.forEach(a => { if (a.dataset.tab === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    placeTabBears(tabLinks.find(a => a.dataset.tab === name), hop);
    document.querySelectorAll(`[data-page="${name}"] .block h2`).forEach(observeHeading);
    if (name === "places") drawMap();
    updateSchedule();
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-tab]");
    if (!a) return;
    e.preventDefault();
    if (location.hash !== `#${a.dataset.tab}`) history.pushState(null, "", `#${a.dataset.tab}`);
    showTab(a.dataset.tab);
    const tabs = document.querySelector(".tabs");
    if (tabs.getBoundingClientRect().top < 0 || a.closest(".page")) tabs.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  });
  addEventListener("popstate", () => showTab(location.hash.slice(1) || "home"));
  addEventListener("resize", () => {
    const active = tabLinks.find(a => a.classList.contains("is-active"));
    if (active) placeTabBears(active, false);
  });

  // ---------- Home ----------

  function countdown() {
    let ms = Math.max(0, WEDDING - Date.now());
    const d = Math.floor(ms / 86400000); ms -= d * 86400000;
    const h = Math.floor(ms / 3600000); ms -= h * 3600000;
    const m = Math.floor(ms / 60000); ms -= m * 60000;
    const sec = Math.floor(ms / 1000);
    const set = (id, v) => { const el = $(id); const t = String(v); if (el.textContent !== t) { el.textContent = t; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); } };
    set("cd-days", d.toLocaleString()); set("cd-hours", h); set("cd-mins", m); set("cd-secs", sec);
  }

  // ---------- Opening envelope (first visit only) ----------

  function envelope() {
    const intro = $("envelope-intro");
    let seen = false;
    try { seen = sessionStorage.getItem("cp-opened") === "1"; } catch {}
    if (seen || reduced || location.hash.length > 1) return;
    intro.hidden = false;
    document.documentElement.classList.add("intro-open");
    const done = () => {
      try { sessionStorage.setItem("cp-opened", "1"); } catch {}
      intro.classList.add("is-leaving");
      document.documentElement.classList.remove("intro-open");
      setTimeout(() => { intro.hidden = true; }, 900);
    };
    $("envelope").addEventListener("click", () => {
      if (intro.classList.contains("is-opening")) return;
      intro.classList.add("is-opening");
      setTimeout(done, 1700);
    });
    $("envelope-skip").addEventListener("click", done);
    addEventListener("keydown", e => { if (e.key === "Escape" && !intro.hidden) done(); });
  }

  function heartFrom(el) {
    if (reduced) return;
    const h = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    h.setAttribute("viewBox", "0 0 24 24");
    h.setAttribute("class", "heart");
    h.style.setProperty("--drift", `${(Math.random() - .5) * 40}px`);
    h.innerHTML = '<path fill="#E9A3A3" d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3.1 4 7 4c2.2 0 3.7 1.2 5 3 1.3-1.8 2.8-3 5-3 3.9 0 6.2 4.2 4.6 7.8C19.5 16.4 12 21 12 21z"/>';
    el.append(h);
    setTimeout(() => h.remove(), 1700);
  }

  function heroBears() {
    const el = $("tab-bears");
    if (!reduced) {
      const blink = () => {
        el.classList.add("is-blinking");
        setTimeout(() => el.classList.remove("is-blinking"), 140);
        setTimeout(blink, 2800 + Math.random() * 3200);
      };
      setTimeout(blink, 2200);
    }
    if (!reduced) {
      const bounce = () => {
        if (!document.hidden) {
          el.classList.add("is-bouncing");
          setTimeout(() => el.classList.remove("is-bouncing"), 900);
        }
        setTimeout(bounce, 7000 + Math.random() * 5000);
      };
      setTimeout(bounce, 4500);
    }
    let taps = [];
    el.addEventListener("click", () => {
      el.classList.add("is-smiling");
      clearTimeout(el._smile);
      el._smile = setTimeout(() => el.classList.remove("is-smiling"), 1400);
      const now = Date.now();
      taps = taps.filter(t => now - t < 900).concat(now);
      if (taps.length >= 3) { heartBurst(el, 10); taps = []; }
      else heartFrom(el);
    });
  }

  // several hearts at once, fanning out
  function heartBurst(el, n) {
    for (let i = 0; i < n; i++) setTimeout(() => heartFrom(el), i * 70);
  }

  // a shower of hearts rising from the bottom of the screen
  function heartShower() {
    if (reduced) return;
    const layer = document.createElement("div");
    layer.className = "shower";
    for (let i = 0; i < 26; i++) {
      const h = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      h.setAttribute("viewBox", "0 0 24 24");
      h.style.left = `${Math.random() * 100}%`;
      h.style.setProperty("--size", `${14 + Math.random() * 18}px`);
      h.style.setProperty("--sway", `${(Math.random() - .5) * 120}px`);
      h.style.animationDelay = `${Math.random() * .9}s`;
      h.style.animationDuration = `${2.4 + Math.random() * 1.4}s`;
      const colors = ["#E9A3A3", "#F3C6C6", "#A4CBE3", "#C7DFEE"];
      h.innerHTML = `<path fill="${colors[i % colors.length]}" d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3.1 4 7 4c2.2 0 3.7 1.2 5 3 1.3-1.8 2.8-3 5-3 3.9 0 6.2 4.2 4.6 7.8C19.5 16.4 12 21 12 21z"/>`;
      layer.append(h);
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), 4800);
  }

  // ---------- Petals drifting over the home page ----------

  function petals() {
    if (reduced) return;
    const home = document.querySelector('[data-page="home"]');
    const canvas = document.createElement("canvas");
    canvas.className = "petals";
    canvas.setAttribute("aria-hidden", "true");
    home.prepend(canvas);
    const ctx = canvas.getContext("2d");
    const colors = ["#EBCFC9", "#D3E3EF", "#F0DCD3", "#C9DCEA", "#F4E6E1"];
    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
    };
    const make = (y) => ({
      x: Math.random() * w, y: y ?? -20 - Math.random() * h * .5,
      r: 5 + Math.random() * 6, vy: .25 + Math.random() * .45, phase: Math.random() * 6.28,
      spin: (Math.random() - .5) * .02, rot: Math.random() * 6.28, c: colors[Math.floor(Math.random() * colors.length)]
    });
    resize();
    const count = w < 600 ? 9 : 16;
    const list = Array.from({ length: count }, () => make(Math.random() * h));
    addEventListener("resize", resize);
    const frame = (t) => {
      requestAnimationFrame(frame);
      if (document.hidden || home.hidden) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      list.forEach((p, i) => {
        p.y += p.vy; p.rot += p.spin;
        const x = p.x + Math.sin(t / 1600 + p.phase) * 22;
        if (p.y > h + 20) list[i] = make();
        ctx.save();
        ctx.translate(x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = .75;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .58, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(92,141,175,.12)"; ctx.lineWidth = .8; ctx.stroke();
        ctx.restore();
      });
    };
    requestAnimationFrame(frame);
  }

  const schedule = $("schedule");
  function updateSchedule() {
    if (!schedule || schedule.offsetParent === null) return;
    const mark = innerHeight * 0.6;
    const r = schedule.getBoundingClientRect();
    const p = reduced ? 1 : Math.min(1, Math.max(0, (mark - r.top) / r.height));
    schedule.style.setProperty("--progress", p.toFixed(3));
    [...schedule.children].forEach(li => li.classList.toggle("is-passed", reduced || li.getBoundingClientRect().top < mark));
  }
  // On the wedding day, mark what's happening right now
  function nowMarker() {
    if (!schedule) return;
    const now = new Date();
    const local = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    if (local.getFullYear() !== 2027 || local.getMonth() !== 2 || local.getDate() !== 7) return;
    const mins = local.getHours() * 60 + local.getMinutes();
    const starts = [...schedule.children].map(li => {
      const [h, m] = li.querySelector("time").textContent.split(":").map(Number);
      return (h < 12 ? h + 12 : h) * 60 + m;
    });
    schedule.querySelectorAll(".is-now").forEach(li => li.classList.remove("is-now"));
    let idx = -1;
    starts.forEach((t, k) => { if (mins >= t) idx = k; });
    if (idx >= 0 && mins < 21 * 60 + 15) schedule.children[idx].classList.add("is-now");
  }

  // Type "bubu", "dudu" or "love" anywhere for a surprise
  function easterEggs() {
    let typed = "";
    addEventListener("keydown", e => {
      if (e.target?.closest?.("input, textarea, select, dialog[open]") || !e.key || e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-8);
      const el = $("tab-bears");
      const hop = () => { el.classList.remove("is-bouncing"); void el.offsetWidth; el.classList.add("is-bouncing"); setTimeout(() => el.classList.remove("is-bouncing"), 900); };
      if (typed.endsWith("bubu") || typed.endsWith("dudu")) { hop(); heartBurst(el, 6); toast(typed.endsWith("bubu") ? "Bubu says hi!" : "Dudu says hi!"); typed = ""; }
      if (typed.endsWith("love")) { heartShower(); typed = ""; }
    });
  }

  let ticking = false;
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; updateSchedule(); }); } }, { passive: true });

  const headingObserver = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-seen"); headingObserver.unobserve(e.target); }
  }), { threshold: 0.4 });
  function observeHeading(h) {
    if (h.classList.contains("is-seen")) return;
    // headings already on screen when a tab opens wipe in right away
    requestAnimationFrame(() => {
      const r = h.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) h.classList.add("is-seen");
      else headingObserver.observe(h);
    });
  }

  // ---------- Places map ----------

  let mapDrawn = false;
  let projection = null;
  const KIND = { been: "Been there together", soon: "Coming up next", wedding: "Our wedding!" };

  function placeCard(p) {
    const card = $("place-card");
    // Trip photos must show both Paul and Claire; custom alt text adds the setting.
    const alt = p.photoAlt || `Claire and Paul in ${p.name}`;
    // photoFrame "postcard" crops the card view to 4:3; the lightbox still shows the whole photo
    const frame = p.photoFrame === "postcard" ? " postcard" : "";
    const photo = p.photo ? `<img src="${esc(p.photo)}" alt="${esc(alt)}" class="zoomable${frame}" tabindex="0" role="button" aria-haspopup="dialog" loading="lazy">` : "";
    card.innerHTML = `<h3>${esc(p.name)}</h3><p class="when">${KIND[p.kind]}</p><p>${esc(p.note)}</p>${photo}`;
    card.style.animation = "none"; void card.offsetWidth; card.style.animation = "";
  }

  let lastXY = null;
  function moveMapBears(lon, lat) {
    const bears = $("map-bears");
    const xy = projection && lon !== undefined ? projection([lon, lat]) : null;
    if (!xy) return;
    if (lastXY && !reduced && Math.hypot(xy[0] - lastXY[0], xy[1] - lastXY[1]) > 4) {
      // a dotted travel line arcing from the last place to this one
      const [x1, y1] = lastXY, [x2, y2] = xy;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * .25;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
      path.setAttribute("class", "trail");
      $("us-trail").append(path);
      const len = path.getTotalLength();
      path.style.setProperty("--len", len);
      setTimeout(() => path.classList.add("is-fading"), 1600);
      setTimeout(() => path.remove(), 3200);
      ride(path, x2 < x1, bears);
    }
    lastXY = xy;
    bears.setAttribute("x", xy[0] - 30);
    bears.setAttribute("y", xy[1] - 46);
  }

  // Bubu and Dudu fly between faraway stops and take the bus for short hops
  const PLANE = `<g class="vehicle">
      <image href="assets/images/bears-smile.webp" width="34" height="22" x="-12" y="-26"/>
      <path d="M-26-5-32-18H-24L-15-6Z" fill="#5C8DAF"/>
      <path d="M-28 1C-28-4-21-7-9-7H18C26-7 31-3 32 1 31 4 26 6 18 6H-20C-25 6-28 4-28 1Z" fill="#fff" stroke="#5C8DAF" stroke-width="1.2"/>
      <path d="M-24 2H25" stroke="#E9A3A3" stroke-width="1.4"/>
      <g fill="#7FA6C2"><circle cx="-14" cy="-2" r="1.4"/><circle cx="-8" cy="-2" r="1.4"/><circle cx="-2" cy="-2" r="1.4"/><circle cx="4" cy="-2" r="1.4"/><circle cx="10" cy="-2" r="1.4"/></g>
      <path d="M25-4C27-4 29-2 30 0H25Z" fill="#7FA6C2"/>
      <path d="M-3 2-13 16H-5L9 3Z" fill="#DCE7EF" stroke="#5C8DAF" stroke-width="1"/>
    </g>`;
  const BUS = `<g class="vehicle">
      <defs><clipPath id="bus-window"><rect x="-23" y="-13" width="38" height="10" rx="2"/></clipPath></defs>
      <rect x="-27" y="-17" width="54" height="25" rx="6" fill="#F4E3B5" stroke="#B89A5E" stroke-width="1.2"/>
      <rect x="-23" y="-13" width="38" height="10" rx="2" fill="#DCEBF2"/>
      <image href="assets/images/bears-smile.webp" width="30" height="19" x="-19" y="-15" clip-path="url(#bus-window)"/>
      <rect x="18" y="-13" width="6" height="15" rx="1.5" fill="#DCEBF2" stroke="#B89A5E" stroke-width=".8"/>
      <path d="M-27 0H27" stroke="#5C8DAF" stroke-width="2"/>
      <g class="wheel" transform="translate(-15 8)"><circle r="5" fill="#33414C"/><path d="M-3 0H3M0-3V3" stroke="#C8D2D9" stroke-width="1.2"/></g>
      <g class="wheel" transform="translate(15 8)"><circle r="5" fill="#33414C"/><path d="M-3 0H3M0-3V3" stroke="#C8D2D9" stroke-width="1.2"/></g>
    </g>`;
  let rideToken = 0;
  function ride(path, leftward, bears) {
    const token = ++rideToken;
    document.querySelectorAll(".ride").forEach(n => n.remove());
    const len = path.getTotalLength();
    const flying = len > 140;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "ride");
    g.innerHTML = flying ? PLANE : BUS;
    path.parentNode.append(g);
    bears.classList.add("is-away");
    const wheels = [...g.querySelectorAll(".wheel")];
    const duration = Math.min(2000, 800 + len * 2.4);
    const start = performance.now();
    const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const step = now => {
      if (token !== rideToken) return;
      const t = Math.min(1, (now - start) / duration);
      const at = ease(t) * len;
      const p = path.getPointAtLength(at), q = path.getPointAtLength(Math.min(len, at + 1));
      if (flying) {
        const angle = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
        g.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${angle})${leftward ? " scale(1 -1)" : ""}`);
      } else {
        const bob = Math.sin(t * 40) * 1.2;
        g.setAttribute("transform", `translate(${p.x} ${p.y - 8 + bob})${leftward ? " scale(-1 1)" : ""}`);
        wheels.forEach((w, i) => w.setAttribute("transform", `translate(${i ? 15 : -15} 8) rotate(${at * 12})`));
      }
      if (t < 1) requestAnimationFrame(step);
      else { g.remove(); bears.classList.remove("is-away"); }
    };
    requestAnimationFrame(step);
  }

  function selectPlace(p, el) {
    document.querySelectorAll(".pin.is-on, .chip.is-on").forEach(n => n.classList.remove("is-on"));
    el?.classList.add("is-on");
    moveMapBears(p.lon, p.lat);
    placeCard(p);
  }

  let touring = false;
  async function tour() {
    if (touring) return;
    touring = true;
    const btn = $("tour-btn");
    btn.textContent = "Touring…";
    const stops = window.PLACES.filter(p => p.kind === "been").concat(window.PLACES.filter(p => p.kind === "soon"));
    for (const p of stops) {
      if (!touring) break;
      const chip = [...document.querySelectorAll(".chip")].find(c => c.textContent === p.name.replace(/, [A-Z]{2}$/, ""));
      selectPlace(p, chip);
      await new Promise(r => setTimeout(r, reduced ? 900 : 2200));
    }
    touring = false;
    btn.textContent = "Take the tour";
  }

  async function drawMap() {
    if (mapDrawn || !window.d3 || !window.topojson) return;
    mapDrawn = true;
    const us = await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-albers-10m.json").then(r => r.json());
    const path = d3.geoPath();
    const states = $("us-states");
    topojson.feature(us, us.objects.states).features.forEach(f => {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("d", path(f));
      el.setAttribute("class", "state");
      states.append(el);
    });
    // us-atlas "albers" files are pre-projected with this exact projection
    projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
    const pins = $("us-pins");
    window.PLACES.forEach(p => {
      const xy = projection([p.lon, p.lat]);
      if (!xy) return;
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `pin ${p.kind}`);
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", p.name);
      g.innerHTML = `<circle cx="${xy[0]}" cy="${xy[1]}" r="6"></circle><title>${esc(p.name)}</title>`;
      const go = () => selectPlace(p, g);
      g.addEventListener("click", go);
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      pins.append(g);
    });
    const abroad = $("abroad");
    window.PLACES.forEach(p => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `chip ${p.kind}`;
      b.textContent = p.name.replace(/, [A-Z]{2}$/, "");
      b.addEventListener("click", () => selectPlace(p, b));
      abroad.append(b);
    });
    window.ABROAD.forEach(p => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `chip ${p.kind}`;
      b.textContent = p.name;
      b.addEventListener("click", () => selectPlace(p, b));
      abroad.append(b);
    });
    const legend = document.createElement("p");
    legend.className = "legend";
    legend.innerHTML = '<span><i></i>Been there</span><span><i class="soon"></i>Coming up</span><span><i class="wedding"></i>Our wedding</span>';
    abroad.after(legend);
    $("tour-btn").addEventListener("click", () => { if (touring) { touring = false; } else tour(); });
    const home = window.PLACES.find(p => p.kind === "wedding");
    moveMapBears(home.lon, home.lat);
  }

  // ---------- RSVP: open form, saved to the Google Sheet ----------

  function rsvpForm() {
    const form = $("rsvp-form");
    const draftKey = "cp-rsvp-draft-v2";
    let identity = window.WeddingRsvp.identity();
    const updateFields = () => {
      const coming = document.querySelector('input[name="attendance"]:checked').value === "attending";
      $("attending-fields").hidden = !coming;
      $("rsvp-party").required = coming && Number($("rsvp-count").value) > 1;
    };
    document.querySelectorAll('input[name="attendance"]').forEach(r => r.addEventListener("change", updateFields));
    $("rsvp-count").addEventListener("change", updateFields);
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null");
      if (saved && saved.id && saved.editToken) {
        identity = { id: saved.id, editToken: saved.editToken };
        for (const key of ["name", "contact", "party", "dietary", "song", "message"]) $("rsvp-" + key).value = saved[key] || "";
        document.querySelector(`input[name="attendance"][value="${saved.rsvp === "declined" ? "declined" : "attending"}"]`).checked = true;
        $("rsvp-count").value = String(saved.attendingCount || 1);
        $("rsvp-resume").hidden = !saved.confirmed;
      }
    } catch { /* A guest can reply even when session storage is unavailable. */ }
    updateFields();

    form.addEventListener("submit", async e => {
      e.preventDefault();
      updateFields();
      if (!form.reportValidity()) return;
      const name = $("rsvp-name").value.trim();
      if (!name) { $("rsvp-name").focus(); return; }
      const coming = document.querySelector('input[name="attendance"]:checked').value === "attending";
      const count = coming ? Number($("rsvp-count").value) || 1 : 0;
      const party = coming ? $("rsvp-party").value.trim() : "";
      const contact = $("rsvp-contact").value.trim();
      const entry = {
        ...identity,
        name,
        side: "Guest",
        role: [contact && `Contact: ${contact}`, party && `Party: ${party}`].filter(Boolean).join(" | "),
        contact, party,
        website: $("rsvp-website").value,
        count: count || 1,
        rsvp: coming ? "attending" : "declined",
        attendingCount: count,
        meal: "Buffet",
        dietary: coming ? $("rsvp-dietary").value.trim() : "",
        song: coming ? $("rsvp-song").value.trim() : "",
        message: $("rsvp-message").value.trim()
      };
      const btn = $("submit-rsvp-btn");
      btn.disabled = true;
      btn.textContent = "Sending…";
      $("rsvp-error").hidden = true;
      form.setAttribute("aria-busy", "true");
      try { sessionStorage.setItem(draftKey, JSON.stringify(entry)); } catch {}
      try {
        await window.WeddingRsvp.submit(entry);
        try { sessionStorage.setItem(draftKey, JSON.stringify({ ...entry, confirmed: true })); } catch {}
        const first = name.split(/\s+/)[0];
        $("confirm-message-text").textContent = coming
          ? `We can't wait to see you on March 7, ${first}! Please arrive by 3:45.`
          : `We'll miss you, ${first}. Thank you for letting us know.`;
        form.hidden = true;
        $("rsvp-done").hidden = false;
        $("rsvp-resume").hidden = true;
        $("rsvp-done").setAttribute("tabindex", "-1");
        $("rsvp-done").focus();
        if (coming) heartShower(); else heartFrom($("rsvp-done"));
      } catch (error) {
        $("rsvp-error").textContent = error.message || "We couldn’t confirm your reply. Please try again or message Paul or Claire.";
        $("rsvp-error").hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = "Send RSVP";
        form.removeAttribute("aria-busy");
      }
    });

    const showForm = () => {
      $("rsvp-done").hidden = true;
      form.hidden = false;
      $("rsvp-name").focus();
    };
    $("rsvp-edit-btn").addEventListener("click", () => { showForm(); btnLabel(); });
    const btnLabel = () => { $("submit-rsvp-btn").textContent = "Save updated RSVP"; };
    $("rsvp-another-btn").addEventListener("click", () => {
      form.reset();
      identity = window.WeddingRsvp.identity();
      try { sessionStorage.removeItem(draftKey); } catch {}
      $("rsvp-resume").hidden = true;
      $("rsvp-error").hidden = true;
      $("submit-rsvp-btn").textContent = "Send RSVP";
      updateFields();
      showForm();
    });
  }

  // ---------- Calendar ----------

  function downloadIcs() {
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Claire and Paul//Wedding//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:claire-paul-wedding-20270307@claireandpaul.me",
      "DTSTAMP:20261015T000000Z",
      "DTSTART:20270307T234500Z",
      "DTEND:20270308T050000Z",
      "SUMMARY:Claire & Paul's wedding",
      "DESCRIPTION:Arrive by 3:45. The ceremony starts at 4:00 in the Compass Garden. Free parking on site. https://claireandpaul.me",
      "LOCATION:Beverly Mansion\\, Grand Tradition Estate & Gardens\\, 220 Grand Tradition Way\\, Fallbrook\\, CA 92028",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = "claire-and-paul-wedding.ics";
    document.body.append(a);
    a.click();
    a.remove();
  }

  // ---------- Photo viewer: arrows, keys, swipe ----------

  function lightbox() {
    const dlg = $("lightbox-modal"), img = $("lightbox-image");
    let set = [], i = 0;
    const show = (k) => {
      i = (k + set.length) % set.length;
      img.classList.remove("is-in");
      const next = set[i];
      const swap = () => { img.src = next.currentSrc || next.src; img.alt = next.alt; requestAnimationFrame(() => img.classList.add("is-in")); };
      if (dlg.open) setTimeout(swap, 140); else swap();
      $("lightbox-count").textContent = set.length > 1 ? `${i + 1} / ${set.length}` : "";
      $("lightbox-prev").hidden = $("lightbox-next").hidden = set.length < 2;
    };
    // Delegated, so photos added later (the Places card) open too
    const open = el => {
      set = [...el.closest(".page").querySelectorAll(".zoomable")];
      show(set.indexOf(el));
      dlg.showModal();
    };
    document.addEventListener("click", e => {
      const el = e.target.closest?.(".zoomable");
      if (el && !dlg.contains(el)) open(el);
    });
    document.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target.closest?.(".zoomable[tabindex]");
      if (el) { e.preventDefault(); open(el); }
    });
    $("lightbox-prev").addEventListener("click", e => { e.stopPropagation(); show(i - 1); });
    $("lightbox-next").addEventListener("click", e => { e.stopPropagation(); show(i + 1); });
    dlg.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
    let sx = null;
    dlg.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
      sx = null;
    });
  }

  // ---------- Gentle reveals as things scroll into view ----------

  function reveals() {
    const targets = document.querySelectorAll(".story p, .story-photo, .gallery img, .stays > div, .recs > div, .feature-photo, details");
    if (reduced) return;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((el, k) => { el.classList.add("reveal"); el.style.setProperty("--d", `${(k % 3) * 70}ms`); io.observe(el); });
  }

  // ---------- Wire up ----------

  function init() {
    envelope();
    nowMarker();
    setInterval(nowMarker, 60000);
    easterEggs();
    countdown();
    setInterval(countdown, 1000);
    heroBears();
    rsvpForm();

    document.querySelectorAll("dialog").forEach(d => {
      d.querySelector("[data-close]")?.addEventListener("click", () => d.close());
      d.addEventListener("click", e => { if (e.target === d) d.close(); });
    });
    $("add-calendar-btn").addEventListener("click", () => $("calendar-modal").showModal());
    $("download-ics-btn").addEventListener("click", downloadIcs);

    lightbox();
    petals();
    reveals();

    // fonts change tab widths, so place the bears again once they've loaded
    showTab(location.hash.slice(1) || "home", false);
    document.fonts?.ready.then(() => showTab(location.hash.slice(1) || "home", false));
  }

  init();
})();
