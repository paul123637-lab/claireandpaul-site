// Painterly touches across the site: photos are brushed in as they appear, section
// titles get a hand-painted stroke beneath them, and the home page sky twinkles with
// small stars and the occasional shooting star.
(function () {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  // A painted stroke under each section title. The path wobbles a little differently
  // for each title so they look hand-made rather than stamped.
  let n = 0;
  document.querySelectorAll(".block > h2").forEach(h => {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 220 18");
    svg.setAttribute("class", "brush-line");
    svg.setAttribute("aria-hidden", "true");
    const w = (k) => (Math.sin(n * 3.1 + k) * 2.2).toFixed(1);
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", `M6 ${10 + +w(1)} C 50 ${4 + +w(2)}, 95 ${14 + +w(3)}, 140 ${8 + +w(4)} S 200 ${6 + +w(5)}, 214 ${10 + +w(6)}`);
    path.setAttribute("pathLength", "1");
    svg.append(path);
    h.after(svg);
    n++;
  });

  // Photos start as a blank canvas and are brushed in left to right
  const photos = document.querySelectorAll(".feature-photo img, .story-photo img, .gallery img");
  photos.forEach(img => img.classList.add("brush-in"));
  document.querySelectorAll(".brush-line").forEach(s => s.classList.add("brush-pending"));

  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("painted");
      // The title above wipes in with its stroke, even if its own reveal was missed
      if (e.target.classList.contains("brush-line")) e.target.previousElementSibling?.classList.add("is-seen");
      io.unobserve(e.target);
    }
  }, { threshold: 0.1 });
  [...photos, ...document.querySelectorAll(".brush-line")].forEach(el => io.observe(el));

  // ---------- The places map as a constellation ----------
  // Once the pins are drawn, link them with faint gold lines (a minimum spanning tree,
  // so the shape follows our trips), and paint the lines in when the map is seen.
  const pinLayer = document.getElementById("us-pins");
  if (pinLayer) {
    const drawConstellation = () => {
      const pts = [...pinLayer.querySelectorAll("circle")].map(c => [+c.getAttribute("cx"), +c.getAttribute("cy")]);
      if (pts.length < 2 || pinLayer.previousElementSibling?.classList.contains("constellation")) return;
      const inTree = [0], edges = [];
      while (inTree.length < pts.length) {
        let best = null;
        for (const a of inTree) pts.forEach((p, b) => {
          if (inTree.includes(b)) return;
          const d = Math.hypot(p[0] - pts[a][0], p[1] - pts[a][1]);
          if (!best || d < best[2]) best = [a, b, d];
        });
        inTree.push(best[1]); edges.push(best);
      }
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "constellation");
      g.setAttribute("aria-hidden", "true");
      edges.forEach(([a, b], i) => {
        const l = document.createElementNS(NS, "line");
        l.setAttribute("x1", pts[a][0]); l.setAttribute("y1", pts[a][1]);
        l.setAttribute("x2", pts[b][0]); l.setAttribute("y2", pts[b][1]);
        l.setAttribute("pathLength", "1");
        l.style.transitionDelay = (i * 0.12).toFixed(2) + "s";
        g.append(l);
      });
      pinLayer.before(g);
      const seen = new IntersectionObserver(([e]) => { if (e.isIntersecting) { g.classList.add("painted"); seen.disconnect(); } }, { threshold: 0.3 });
      seen.observe(pinLayer.ownerSVGElement || pinLayer);
    };
    new MutationObserver(drawConstellation).observe(pinLayer, { childList: true });
    drawConstellation();
  }

  // ---------- A trail of tiny stars behind the mouse (desktop only) ----------
  if (!still && matchMedia("(pointer: fine)").matches) {
    let last = 0;
    addEventListener("pointermove", e => {
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      const s = document.createElement("span");
      s.className = "trail-star";
      s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
      s.style.setProperty("--dx", ((Math.random() - 0.5) * 30).toFixed(0) + "px");
      document.body.append(s);
      s.addEventListener("animationend", () => s.remove());
    }, { passive: true });
  }

  // Stars over the hero: a few twinkling sparkles and, now and then, a shooting star
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const sky = document.createElement("div");
  sky.className = "hero-sky";
  sky.setAttribute("aria-hidden", "true");
  const spots = [[6, 14, 14], [15, 46, 9], [88, 10, 12], [94, 38, 8], [10, 72, 10], [84, 66, 13], [24, 26, 7], [76, 24, 8]];
  spots.forEach(([x, y, size], i) => {
    const star = document.createElementNS(NS, "svg");
    star.setAttribute("viewBox", "-10 -10 20 20");
    star.setAttribute("class", "sparkle");
    star.style.cssText = `left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:${(i * 0.7) % 4}s`;
    star.innerHTML = '<path d="M0-10 C1-2 2-1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2-1 -1-2 0-10Z"/>';
    sky.append(star);
  });
  if (!still) {
    const shoot = document.createElement("span");
    shoot.className = "shooting-star";
    sky.append(shoot);
    const fly = () => {
      shoot.style.top = 5 + Math.random() * 25 + "%";
      shoot.style.left = 10 + Math.random() * 50 + "%";
      shoot.classList.remove("fly"); void shoot.offsetWidth; shoot.classList.add("fly");
      setTimeout(fly, 9000 + Math.random() * 9000);
    };
    setTimeout(fly, 3500);
  }
  hero.prepend(sky);
})();
