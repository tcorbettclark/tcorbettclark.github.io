const LABELS = ['neutral', 'smiling'];
const zSub = i => 'z' + '₀₁₂₃₄₅₆₇'[i];   // feature-vector notation z₀…z₇ (0-based)
const SLOT_COLORS = ['#ff3b30', '#ffcc00', '#34c759', '#00c7be',
                     '#0a84ff', '#bf5af2', '#ffffff', '#000000'];
const REF_RC = [[43, 83, 48, 87], [61, 86, 65, 95], [38, 40, 42, 49], [23, 70, 35, 82]];
const S = 2;                       // selector zoom
const SZ = DATA.size, GAP = 8;     // face size, gap between faces on the canvas

/* Extracted image assets (previously base64 data URIs embedded in DATA). */
const IMG = {
  mu0: 'images/mean-neutral.png',        // average neutral face
  mu1: 'images/mean-smiling.png',        // average smiling face
  trainSheet: 'images/train-sheet.png',  // 115-tile training spritesheet
  testSheet: 'images/test-sheet.png',    // 114-tile test spritesheet
};

const state = {
  slots: new Array(8).fill(null),  // [x0,y0,x1,y1] per slot or null
  manual: [5, 5, -5],              // hand-tuned [w1, w2, b] for the fit-a-line step
  manual3: [5, 5, 5, -8],          // hand-tuned [w1, w2, w3, b] for the 3-D plane step
  active: 0,
  drag: null,
  testModel: null,                 // model whose results Step 6, the 3-D plane and the photo show
  Xtrain: null, Xtest: null,
  gray: {},                        // decoded spritesheets
  imgs: {},
};

const $ = id => document.getElementById(id);

/* ---------- image decoding ---------- */
function loadImage(url) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = url;
  });
}
function toGray(im) {
  const c = document.createElement('canvas');
  c.width = im.width; c.height = im.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(im, 0, 0);
  const px = ctx.getImageData(0, 0, im.width, im.height).data;
  const g = new Float64Array(im.width * im.height);
  for (let i = 0; i < g.length; i++) g[i] = px[i * 4] / 255;
  return g;
}

/* ---------- montages ---------- */
function renderMontage(el, which, texts, classes) {
  const n = which === 'train' ? DATA.nTrain : DATA.nTest;
  const sheet = which === 'train' ? IMG.trainSheet : IMG.testSheet;
  const ts = 64, cols = DATA.cols, rows = Math.ceil(n / cols);
  el.innerHTML = '';
  for (let k = 0; k < n; k++) {
    const r = Math.floor(k / cols), c = k % cols;
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML = `<div class="lbl ${classes[k]}">${texts[k]}</div><div class="img"></div>`;
    const img = tile.lastChild;
    img.style.backgroundImage = `url(${sheet})`;
    img.style.backgroundSize = `${cols * ts}px ${rows * ts}px`;
    img.style.backgroundPosition = `-${c * ts}px -${r * ts}px`;
    el.appendChild(tile);
  }
}
function showDataTab(which) {
  $('tabTrain').setAttribute('aria-pressed', which === 'train');
  $('tabTest').setAttribute('aria-pressed', which === 'test');
  const el = $('montageData');
  if (which === 'test') {
    el.className = '';
    el.innerHTML = `<div class="placeholder">
      <strong>🔒 The test set is locked.</strong>
      The test images play the role of <em>brand-new faces</em> the classifier has
      never seen, so they must stay hidden while you choose your features and train.
      If you peeked at them now, you might — even without meaning to — pick features
      that suit these particular images, and the accuracy in Step 4 would look better
      than the classifier really is. You will see every test image, and how your
      classifier does on each one, when you test in Step 4.</div>`;
    return;
  }
  el.className = 'montage';
  const C = DATA.cTrain;
  renderMontage(el, 'train', C.map(c => LABELS[c]), C.map(c => LABELS[c]));
}

/* ---------- feature selector ----------
 * The selector appears more than once on the page (first with 2 slots, later
 * with 3+). All instances share the same slots/active state and stay in sync. */
const selectorInstances = [];

/* map canvas point to single-face coords + which face it is on */
function facePoint(p) {
  const right = p.x >= SZ * S + GAP / 2;
  let x = (p.x - (right ? SZ * S + GAP : 0)) / S, y = p.y / S;
  return { x: Math.min(Math.max(x, 0), SZ - 1), y: Math.min(Math.max(y, 0), SZ - 1), right };
}
function dragRect() {
  const a = state.drag.a, b = state.drag.b;
  return [Math.round(Math.min(a.x, b.x)), Math.round(Math.min(a.y, b.y)),
          Math.round(Math.max(a.x, b.x)), Math.round(Math.max(a.y, b.y))];
}

function createSelector(ids, max, showLocked) {
  const cv = $(ids.canvas);
  if (!cv) return;
  const inst = { cv, chips: $(ids.chips), max, showLocked };
  selectorInstances.push(inst);
  cv.width = SZ * S * 2 + GAP; cv.height = SZ * S;
  const pos = ev => {
    const b = cv.getBoundingClientRect();
    return { x: ev.clientX - b.left, y: ev.clientY - b.top };
  };
  cv.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    cv.setPointerCapture(ev.pointerId);
    cv.focus();
    if (state.active >= inst.max) { state.active = 0; renderChips(); }
    const a = facePoint(pos(ev));
    state.drag = { a, b: a, right: a.right };
    drawSelectors();
  });
  cv.addEventListener('pointermove', ev => {
    if (!state.drag) return;
    const b = facePoint(pos(ev));
    b.right = state.drag.right;                    // clamp to the starting face
    if (b.right !== facePoint(pos(ev)).right) b.x = state.drag.right ? 0 : SZ - 1;
    state.drag.b = b;
    drawSelectors();
  });
  cv.addEventListener('pointerup', () => {
    if (!state.drag) return;
    const r = dragRect();
    state.drag = null;
    if (r[2] - r[0] >= 1 && r[3] - r[1] >= 1) {
      state.slots[state.active] = r;
      featuresChanged();
    }
    drawSelectors();
  });
  cv.addEventListener('keydown', ev => {
    if (ev.key >= '1' && ev.key <= '8' && +ev.key <= inst.max) {
      state.active = +ev.key - 1; renderChips(); drawSelectors();
    }
    else if (ev.key === 'd' || ev.key === 'Backspace') { clearSlot(state.active); }
  });
  if (ids.loadRef) $(ids.loadRef).addEventListener('click', () => {
    state.slots = new Array(8).fill(null);
    REF_RC.slice(0, inst.max).forEach((r, i) => state.slots[i] = r.slice());
    state.active = 0;
    featuresChanged();
  });
  if (ids.clearAll) $(ids.clearAll).addEventListener('click', () => {
    state.slots = new Array(8).fill(null);
    state.active = 0;
    featuresChanged();
  });
}

function drawSelectors() {
  for (const inst of selectorInstances) {
    const ctx = inst.cv.getContext('2d');
    ctx.clearRect(0, 0, inst.cv.width, inst.cv.height);
    ctx.drawImage(state.imgs.mu0, 0, 0, SZ * S, SZ * S);
    ctx.drawImage(state.imgs.mu1, SZ * S + GAP, 0, SZ * S, SZ * S);
    const strokeRect = (r, color, lw, dashed) => {
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.setLineDash(dashed ? [5, 4] : []);
      for (const off of [0, SZ * S + GAP]) {
        ctx.strokeRect(off + r[0] * S + .5, r[1] * S + .5,
                       (r[2] - r[0] + 1) * S - 1, (r[3] - r[1] + 1) * S - 1);
      }
    };
    state.slots.forEach((r, i) => {
      if (r) strokeRect(r, SLOT_COLORS[i], i === state.active ? 2.5 : 1.5, false);
    });
    if (state.drag) strokeRect(dragRect(), SLOT_COLORS[state.active], 2, true);
    ctx.setLineDash([]);
  }
}

function clearSlot(i) { state.slots[i] = null; featuresChanged(); }

function renderChips() {
  for (const inst of selectorInstances) {
    const el = inst.chips;
    el.innerHTML = '';
    const count = inst.showLocked ? 8 : inst.max;
    for (let i = 0; i < count; i++) {
      const r = state.slots[i];
      const b = document.createElement('button');
      const locked = i >= inst.max;
      b.className = 'chip' + (r ? '' : ' empty') + (locked ? ' locked' : '');
      b.setAttribute('aria-pressed', String(i === state.active));
      if (locked) {
        b.disabled = true;
        b.title = 'Locked — this slot unlocks later in the practical';
        b.innerHTML = `<span aria-hidden="true">🔒</span>${i + 1}`;
      } else {
        b.innerHTML = `<span class="sw" style="background:${SLOT_COLORS[i]}"></span>${i + 1}` +
                      (r ? ' <span class="clear" title="clear this feature">×</span>' : '');
        b.addEventListener('click', ev => {
          if (ev.target.classList.contains('clear')) { clearSlot(i); }
          else { state.active = i; renderChips(); drawSelectors(); }
        });
      }
      el.appendChild(b);
    }
  }
}

function activeRects() { return state.slots.filter(Boolean); }

/* ---------- reactive pipeline ---------- */
function featuresChanged() {
  const rects = activeRects();
  if (rects.length) {
    const shW = DATA.cols * SZ;
    state.Xtrain = rectFeats(state.gray.train, shW, DATA.nTrain, DATA.cols, SZ, rects);
    state.Xtest = rectFeats(state.gray.test, shW, DATA.nTest, DATA.cols, SZ, rects);
  } else {
    state.Xtrain = state.Xtest = null;
  }
  // features changed => both fits are stale; show fresh random initialisations
  for (const inst of trainInstances) inst.model = state.Xtrain ? freshModel() : null;
  state.testModel = null;
  renderChips(); drawSelectors(); renderScatterAll(); renderManual();
  renderManual3Stat(); renderTrainAll(); renderTest(); renderUpload();
}

/* ---------- SVG helpers ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function niceTicks(lo, hi, n = 3) {
  const span = hi - lo || 1;
  const step = Math.pow(10, Math.floor(Math.log10(span / n)));
  const s = [1, 2, 5, 10].map(m => m * step).find(m => span / m <= n + 1) || step * 10;
  const t = [];
  for (let v = Math.ceil(lo / s) * s; v <= hi + 1e-9; v += s) t.push(+v.toFixed(10));
  return t;
}
/** Scatter panel of feature i vs j (or 1-D strip when j === null). */
function scatterPanel(Xi, Xj, C, nameI, nameJ, extras) {
  const W = Xj ? 240 : 480, H = Xj ? 240 : 110, m = { l: Xj ? 40 : 14, r: 10, t: 8, b: 34 };
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H });
  // features are mean grey levels, so both axes are bounded [0, 1]
  const [x0, x1] = [0, 1];
  const [y0, y1] = [0, 1];
  const sx = v => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r);
  const sy = v => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b);
  for (const t of niceTicks(x0, x1)) {
    svgEl('line', { x1: sx(t), x2: sx(t), y1: m.t, y2: H - m.b, class: 'gridline' }, svg);
    svgEl('text', { x: sx(t), y: H - m.b + 14, 'text-anchor': 'middle' }, svg).textContent = t;
  }
  if (Xj) for (const t of niceTicks(y0, y1)) {
    svgEl('line', { x1: m.l, x2: W - m.r, y1: sy(t), y2: sy(t), class: 'gridline' }, svg);
    svgEl('text', { x: m.l - 5, y: sy(t) + 3, 'text-anchor': 'end' }, svg).textContent = t;
  }
  svgEl('line', { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, class: 'axisline' }, svg);
  if (Xj) svgEl('line', { x1: m.l, x2: m.l, y1: m.t, y2: H - m.b, class: 'axisline' }, svg);
  svgEl('text', { x: (m.l + W - m.r) / 2, y: H - 4, 'text-anchor': 'middle' }, svg).textContent = nameI;
  const yl = svgEl('text', { x: 10, y: (m.t + H - m.b) / 2, 'text-anchor': 'middle',
                             transform: `rotate(-90 10 ${(m.t + H - m.b) / 2})` }, svg);
  yl.textContent = nameJ;
  const r = 3.5;
  for (let k = 0; k < C.length; k++) {
    const cx = sx(Xi[k]);
    const cy = Xj ? sy(Xj[k]) : sy(0.5 + (k % 7 - 3) * 0.05);   // one line, slight jitter to reduce overlap
    const g = svgEl('g', { class: LABELS[C[k]] }, svg);
    if (C[k] === 0) {  // plus
      svgEl('line', { x1: cx - r, x2: cx + r, y1: cy, y2: cy }, g);
      svgEl('line', { x1: cx, x2: cx, y1: cy - r, y2: cy + r }, g);
    } else {           // cross
      svgEl('line', { x1: cx - r, x2: cx + r, y1: cy - r, y2: cy + r }, g);
      svgEl('line', { x1: cx - r, x2: cx + r, y1: cy + r, y2: cy - r }, g);
    }
    svgEl('title', {}, g).textContent =
      `${LABELS[C[k]]} #${k + 1}: ${Xi[k].toFixed(3)}${Xj ? ', ' + Xj[k].toFixed(3) : ''}`;
  }
  if (extras) {
    // overlays (decision line, side arrows) are clipped to the plot area
    const clipId = `panelclip-${scatterPanel.nextClipId = (scatterPanel.nextClipId || 0) + 1}`;
    const cp = svgEl('clipPath', { id: clipId }, svgEl('defs', {}, svg));
    svgEl('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }, cp);
    const g = svgEl('g', { 'clip-path': `url(#${clipId})` }, svg);
    extras(g, sx, sy, [x0, x1], [y0, y1]);
  }
  return svg;
}

/* ---------- 2-D scatter panels ----------
 * Two instances: 'first2' (Step 2 — always just the z1/z2 view) and 'all'
 * (Step 7 — every pairwise projection). */
const scatterInstances = [];

function createScatterView(ids, mode) {
  const el = $(ids.panel);
  if (el) scatterInstances.push({ el, legend: $(ids.legend), empty: $(ids.empty), mode });
}

function renderScatter() {
  const X = state.Xtrain;
  const C = DATA.cTrain;
  for (const inst of scatterInstances) {
    inst.legend.hidden = !X;
    if (inst.empty) inst.empty.hidden = !!X;
    inst.el.innerHTML = '';
    if (!X) continue;
    if (X.length === 1) {
      inst.el.appendChild(scatterPanel(Array.from(X[0]), null, C, `${zSub(0)} (rectangle 1)`, ''));
      continue;
    }
    const nPairs = inst.mode === 'first2' ? 2 : X.length;
    for (let i = 0; i < nPairs; i++)
      for (let j = i + 1; j < nPairs; j++)
        inst.el.appendChild(scatterPanel(Array.from(X[i]), Array.from(X[j]), C,
                                         zSub(i), zSub(j)));
  }
}

function renderScatterAll() { renderScatter(); render3d(); }

/* ---------- 3-D feature view ----------
 * Appears more than once (data-only in Step 4, with the decision plane in
 * Step 5). Instances share the feature data but rotate independently. */
const view3dInstances = [];

function hexToRgba(hex, a) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

function createScatter3d(ids, planeSource, width = 460) {   // planeSource: 'manual' | 'model' | null
  const cv = $(ids.canvas);
  if (!cv) return;
  const inst = { cv, wrap: $(ids.wrap), empty: $(ids.empty), note: $(ids.note),
                 yaw: -0.7, pitch: 0.42, auto: true, planeSource, W: width };
  view3dInstances.push(inst);
  let last = null;
  cv.addEventListener('pointerdown', e => {
    inst.auto = false; last = [e.clientX, e.clientY];
    cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing';
  });
  cv.addEventListener('pointermove', e => {
    if (!last) return;
    inst.yaw += (e.clientX - last[0]) * 0.008;
    inst.pitch = Math.min(1.45, Math.max(-1.45,
      inst.pitch + (e.clientY - last[1]) * 0.008));
    last = [e.clientX, e.clientY];
    render3dOne(inst);
  });
  cv.addEventListener('pointerup', () => { last = null; cv.style.cursor = 'grab'; });
}

function startScatter3dSpin() {
  (function spin() {                 // gentle auto-rotation until first drag
    for (const inst of view3dInstances) {
      if (inst.auto && !inst.wrap.hidden) { inst.yaw += 0.004; render3dOne(inst); }
    }
    requestAnimationFrame(spin);
  })();
}

function render3d() { view3dInstances.forEach(render3dOne); }

function render3dOne(inst) {
  const X = state.Xtrain;
  const show = X && X.length >= 3;
  inst.wrap.hidden = !show;
  inst.empty.hidden = show;
  if (!show) {
    inst.empty.textContent = X
      ? `You have ${X.length} feature${X.length > 1 ? 's' : ''} so far — select three rectangles to see the 3-D feature space.`
      : 'Select rectangles (or load the reference set) to see the feature space here.';
    return;
  }
  inst.note.innerHTML =
    'With three features every image is a point in 3-D feature space — <strong>drag to rotate</strong>.' +
    (inst.planeSource === 'model' && state.testModel && state.testModel.nf === 3 && X.length === 3
      ? (state.testModel.status === 'init'
          ? ' The <span style="color:var(--boundary)">green plane</span> is a randomly initialised decision boundary — press Train to optimise it.'
          : ' The <span style="color:var(--boundary)">green plane</span> is the decision boundary.') : '') +
    (X.length > 3 ? ' <span class="muted">(showing z₁–z₃ only)</span>' : '');

  const cv = inst.cv;
  const W = inst.W, H = 400, dpr = window.devicePixelRatio || 1;
  if (cv.width !== W * dpr) {
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const css = getComputedStyle(document.documentElement);
  const col = name => css.getPropertyValue(name).trim();

  // axes are the [0, 1] grey-level range, centred on the origin for projection
  const lo = [0, 0, 0], hi = [1, 1, 1];
  const norm = (a, v) => v - 0.5;

  const cy = Math.cos(inst.yaw), sy = Math.sin(inst.yaw);
  const cp = Math.cos(inst.pitch), sp = Math.sin(inst.pitch);
  const S = Math.min(W, H) * 0.58;
  const proj = (x, y, z) => {                  // turntable: yaw about z, then tilt
    const x1 = cy * x + sy * y, y1 = -sy * x + cy * y;
    return { x: W / 2 + S * x1, y: H / 2 - S * (cp * z - sp * y1),
             depth: cp * y1 + sp * z };
  };
  const projF = p => proj(norm(0, p[0]), norm(1, p[1]), norm(2, p[2]));

  // bounding box
  ctx.strokeStyle = col('--border'); ctx.lineWidth = 1;
  const cs = [-0.5, 0.5];
  for (const a of [0, 1, 2]) {
    const [u, v] = [0, 1, 2].filter(i => i !== a);
    for (const cu of cs) for (const cvv of cs) {
      const p = [0, 0, 0], q = [0, 0, 0];
      p[u] = q[u] = cu; p[v] = q[v] = cvv; p[a] = -0.5; q[a] = 0.5;
      const a1 = proj(...p), a2 = proj(...q);
      ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke();
    }
  }
  // axis arrows from the low-value corner of the box, labelled at the tips
  ctx.strokeStyle = ctx.fillStyle = col('--ink-2');
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 1.4;
  const origin = [-0.5, -0.5, -0.5], alen = 0.36, ah = 6;
  for (let a = 0; a < 3; a++) {
    const tip = origin.slice(); tip[a] += alen;
    const p1 = proj(...origin), p2 = proj(...tip);
    const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - ah * Math.cos(ang - 0.45), p2.y - ah * Math.sin(ang - 0.45));
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - ah * Math.cos(ang + 0.45), p2.y - ah * Math.sin(ang + 0.45));
    ctx.stroke();
    const lp = origin.slice(); lp[a] += alen + 0.11;
    const p3 = proj(...lp);
    ctx.fillText(zSub(a), p3.x, p3.y + 4);
  }

  // decision plane: hand-tuned sliders ('manual') or the trained model ('model' —
  // only when it IS the true boundary, i.e. exactly 3 features)
  const m = state.testModel;
  let pw = null;
  if (inst.planeSource === 'manual') pw = state.manual3;
  else if (inst.planeSource === 'model' && m && m.nf === 3 && X.length === 3) {
    pw = [m.w[0], m.w[1], m.w[2], m.w[3]];
  }
  if (pw) {
    const poly = planeBoxPolygon([pw[0], pw[1], pw[2]], pw[3],
                                 [lo[0], lo[1], lo[2]], [hi[0], hi[1], hi[2]]);
    if (poly) {
      ctx.beginPath();
      poly.forEach((p, i) => {
        const s = projF(p);
        i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y);
      });
      ctx.closePath();
      ctx.fillStyle = hexToRgba(col('--boundary'), 0.16);
      ctx.strokeStyle = col('--boundary'); ctx.lineWidth = 1.4;
      ctx.fill(); ctx.stroke();

      // perpendicular arrows from the plane centre: red = smiling (positive)
      // side, blue = neutral side
      const cen = [0, 1, 2].map(i => poly.reduce((s, p) => s + p[i], 0) / poly.length);
      const nl = Math.hypot(pw[0], pw[1], pw[2]);
      if (nl > 1e-9) {
        const n = [pw[0] / nl, pw[1] / nl, pw[2] / nl];
        const at = t => projF([cen[0] + t * n[0], cen[1] + t * n[1], cen[2] + t * n[2]]);
        for (const [dir, cvar, label] of [[1, '--c-smiling', 'smiling'],
                                          [-1, '--c-neutral', 'neutral']]) {
          const base = at(dir * 0.02), tip = at(dir * 0.16), lab = at(dir * 0.23);
          const ang = Math.atan2(tip.y - base.y, tip.x - base.x);
          ctx.strokeStyle = ctx.fillStyle = col(cvar);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(base.x, base.y); ctx.lineTo(tip.x, tip.y);
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(tip.x - 6 * Math.cos(ang - 0.45), tip.y - 6 * Math.sin(ang - 0.45));
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(tip.x - 6 * Math.cos(ang + 0.45), tip.y - 6 * Math.sin(ang + 0.45));
          ctx.stroke();
          ctx.fillText(label, lab.x, lab.y + 4);
        }
      }
    }
  }

  // points, drawn back to front
  const pts = [];
  for (let k = 0; k < X[0].length; k++) {
    const p = projF([X[0][k], X[1][k], X[2][k]]);
    pts.push({ ...p, c: DATA.cTrain[k] });
  }
  pts.sort((a, b) => a.depth - b.depth);

  // uploaded photo, if registered: a gold star
  if (upload.z && upload.z.length >= 3) {
    const p = projF([upload.z[0], upload.z[1], upload.z[2]]);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 5;
      const rad = i % 2 ? 3.5 : 8;
      ctx[i ? 'lineTo' : 'moveTo'](p.x + rad * Math.cos(ang), p.y + rad * Math.sin(ang));
    }
    ctx.closePath();
    ctx.fillStyle = '#eda100'; ctx.strokeStyle = '#7a5600'; ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();
  }

  const r = 3.6;
  ctx.lineWidth = 1.5;
  for (const p of pts) {
    ctx.strokeStyle = col(p.c ? '--c-smiling' : '--c-neutral');
    ctx.beginPath();
    if (p.c === 0) {           // plus
      ctx.moveTo(p.x - r, p.y); ctx.lineTo(p.x + r, p.y);
      ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x, p.y + r);
    } else {                   // cross
      ctx.moveTo(p.x - r, p.y - r); ctx.lineTo(p.x + r, p.y + r);
      ctx.moveTo(p.x - r, p.y + r); ctx.lineTo(p.x + r, p.y - r);
    }
    ctx.stroke();
  }
}

/* Draw a red and a blue arrow perpendicular to the decision line w1*z1 + w2*z2 + b = 0,
 * showing which side is classified smiling (red, positive) / neutral (blue). */
function decisionSideArrows(svg, sx, sy, xd, yd, w1, w2, b) {
  const eps = 1e-9;
  const cands = [];
  if (Math.abs(w2) > eps) {
    for (const x of xd) cands.push([x, (-b - w1 * x) / w2]);
  }
  if (Math.abs(w1) > eps) {
    for (const y of yd) cands.push([(-b - w2 * y) / w1, y]);
  }
  const inPlot = cands.filter(([x, y]) =>
    x >= xd[0] - eps && x <= xd[1] + eps && y >= yd[0] - eps && y <= yd[1] + eps);
  if (inPlot.length < 2) return;                 // line misses the plot area
  inPlot.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const a = inPlot[0], c = inPlot[inPlot.length - 1];
  const mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
  const P = p => ({ x: sx(p[0]), y: sy(p[1]) });
  const pa = P(a), pc = P(c), pm = P(mid);
  const L = Math.hypot(pc.x - pa.x, pc.y - pa.y);
  if (L < eps) return;
  let px = -(pc.y - pa.y) / L, py = (pc.x - pa.x) / L;   // screen-space perpendicular
  // orient (px,py) towards the smiling (positive) side
  const nl = Math.hypot(w1, w2);
  const sm = P([mid[0] + w1 / nl * (xd[1] - xd[0]) * 0.05,
                mid[1] + w2 / nl * (yd[1] - yd[0]) * 0.05]);
  if ((sm.x - pm.x) * px + (sm.y - pm.y) * py < 0) { px = -px; py = -py; }

  for (const [dir, cls, label] of [[1, 'smiling', 'smiling'], [-1, 'neutral', 'neutral']]) {
    const bx = pm.x + dir * px * 5, by = pm.y + dir * py * 5;
    const tx = pm.x + dir * px * 24, ty = pm.y + dir * py * 24;
    const ang = Math.atan2(ty - by, tx - bx);
    const g = svgEl('g', { class: cls }, svg);
    const seg = (x1, y1, x2, y2) => svgEl('line', { x1, y1, x2, y2 }, g);
    seg(bx, by, tx, ty);
    seg(tx, ty, tx - 6 * Math.cos(ang - 0.45), ty - 6 * Math.sin(ang - 0.45));
    seg(tx, ty, tx - 6 * Math.cos(ang + 0.45), ty - 6 * Math.sin(ang + 0.45));
    svgEl('text', { x: pm.x + dir * px * 32, y: pm.y + dir * py * 32 + 4,
                    'text-anchor': 'middle', class: `arrowlabel ${cls}` }, svg)
      .textContent = label;
  }
}

/* ---------- fit a plane by hand (sliders on the Step 4 3-D view) ---------- */
function initManual3() {
  [['pw0', 0], ['pw1', 1], ['pw2', 2], ['pb', 3]].forEach(([id, i]) => {
    $(id).value = state.manual3[i];
    $(id).addEventListener('input', () => {
      state.manual3[i] = parseFloat($(id).value);
      view3dInstances.forEach(inst => { if (inst.planeSource === 'manual') render3dOne(inst); });
      renderManual3Stat();
    });
  });
}

function renderManual3Stat() {
  const el = $('man3Stat');
  if (!el) return;
  const [w1, w2, w3, b] = state.manual3;
  $('pw0v').textContent = w1.toFixed(1);
  $('pw1v').textContent = w2.toFixed(1);
  $('pw2v').textContent = w3.toFixed(1);
  $('pbv').textContent = b.toFixed(1);
  const X = state.Xtrain;
  if (!X || X.length < 3) { el.innerHTML = ''; return; }
  const C = DATA.cTrain;
  let correct = 0;
  for (let k = 0; k < C.length; k++) {
    const q = w1 * X[0][k] + w2 * X[1][k] + w3 * X[2][k] + b > 0 ? 1 : 0;
    if (q === C[k]) correct++;
  }
  el.innerHTML = `<div class="stat"><div class="big">${(100 * correct / C.length).toFixed(1)}%</div>
    <div class="sub">of the training set correctly classified — ${correct} of ${C.length} images</div></div>`;
}

/* ---------- fit a line by hand ---------- */
function initManual() {
  [['mw0', 0], ['mw1', 1], ['mb', 2]].forEach(([id, i]) => {
    $(id).value = state.manual[i];
    $(id).addEventListener('input', () => {
      state.manual[i] = parseFloat($(id).value);
      renderManual();
    });
  });
}

function renderManual() {
  const el = $('manualOut');
  if (!el) return;
  const X = state.Xtrain;
  const [w1, w2, b] = state.manual;
  $('mw0v').textContent = w1.toFixed(1);
  $('mw1v').textContent = w2.toFixed(1);
  $('mbv').textContent = b.toFixed(1);
  el.innerHTML = '';
  if (!X || X.length < 2) {
    el.innerHTML = '<div class="placeholder">Select two rectangles in Step 1 to plot the feature space here.</div>';
    return;
  }
  const C = DATA.cTrain;
  let correct = 0;
  for (let k = 0; k < C.length; k++) {
    if ((w1 * X[0][k] + w2 * X[1][k] + b > 0 ? 1 : 0) === C[k]) correct++;
  }
  el.appendChild(scatterPanel(Array.from(X[0]), Array.from(X[1]), C, zSub(0), zSub(1),
    (svg, sx, sy, xd, yd) => {
      if (Math.abs(w2) > 1e-9) {
        svgEl('line', { x1: sx(xd[0]), y1: sy((-b - w1 * xd[0]) / w2),
                        x2: sx(xd[1]), y2: sy((-b - w1 * xd[1]) / w2),
                        class: 'boundary' }, svg);
      } else if (Math.abs(w1) > 1e-9) {
        svgEl('line', { x1: sx(-b / w1), y1: 0, x2: sx(-b / w1), y2: 1000,
                        class: 'boundary' }, svg);
      }
      decisionSideArrows(svg, sx, sy, xd, yd, w1, w2, b);
    }));
  const stat = document.createElement('div');
  stat.className = 'stat';
  stat.innerHTML = `<div class="big">${(100 * correct / C.length).toFixed(1)}%</div>
    <div class="sub">of the training set correctly classified — ${correct} of ${C.length} images</div>`;
  el.appendChild(stat);
}

/* ---------- step 3: training ---------- */
function randnBoxMuller() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
/* Training animates at a constant rate so every gradient step is visible.
 * Default eta/iters (0.15 / 300) converge like 0.1 / 2000 did, but with smooth
 * early steps (larger eta makes the plane thrash near the initialisation). */
const ANIM_RATE = 10;         // iterations per second

/** A fresh randomly-initialised model for the current features. Shown (as the
 *  starting plane/equation) before training; gradient descent continues from it. */
function freshModel() {
  const nf = state.Xtrain.length;
  const w = new Float64Array(nf + 1);
  for (let i = 0; i <= nf; i++) w[i] = randnBoxMuller();
  return { w, history: [], nf, iter: 0, iters: 300,
           status: 'init' };                     // status: 'init' | 'training' | 'done'
}

/* The training controls appear more than once on the page; all instances drive
 * the same single model. */
const trainInstances = [];

function createTrainUI(ids) {
  const btn = $(ids.btn);
  if (!btn) return;
  const inst = { btn, stop: $(ids.stop), eta: $(ids.eta), iters: $(ids.iters),
                 note: $(ids.note), out: $(ids.out), model: null };
  trainInstances.push(inst);
  btn.addEventListener('click', () => train(inst));
  inst.stop.addEventListener('click', () => stopTraining(inst));
}

/** Stop this panel's run; the weights fitted so far are kept and tested. */
function stopTraining(inst) {
  const m = inst.model;
  if (m && m.status === 'training') m.stop = true;
}

function train(srcInst) {
  if (!state.Xtrain || !srcInst.model) return;
  if (srcInst.model.status === 'training') return;
  // A stopped run resumes from the weights on screen; a completed one restarts.
  if (srcInst.model.status === 'done' && !srcInst.model.stopped) srcInst.model = freshModel();
  const model = srcInst.model;                   // continue from the shown random init
  state.testModel = model;                       // this run feeds Step 6 from now on
  const w = model.w;
  const eta = parseFloat(srcInst.eta.value) || 0.15;
  const iters = Math.max(10, parseInt(srcInst.iters.value) || 300);
  model.iters = iters;
  model.status = 'training';
  model.stop = false;
  model.stopped = false;
  const recEvery = Math.max(Math.floor(iters / 100), 1);

  function run(nIters) {
    while (nIters-- > 0 && model.iter < iters) {
      model.iter++;
      const sse = sigmoidStep(state.Xtrain, DATA.cTrain, eta, w);
      if (model.iter <= 30 || model.iter % recEvery === 0 || model.iter === iters) {
        model.history.push([model.iter, sse]);
      }
    }
  }
  const startIter = model.iter;                  // a resumed run paces from here
  let frameCount = 0;
  function frame() {
    if (srcInst.model !== model) return;         // features changed mid-run: abort
    // constant pacing: ANIM_RATE gradient steps per second, every one visible
    frameCount++;
    const target = Math.min(iters, startIter + Math.floor(frameCount * ANIM_RATE / 60));
    run(target - model.iter);
    if (model.stop) {                            // Stop pressed: keep fitted weights
      model.stop = false;
      model.stopped = true;
      model.status = 'done';
      renderTrainAll(); renderTest(); renderUpload();
      return;
    }
    if (model.iter < iters) {
      if (frameCount % 3 === 0) renderTrainAll(); // redraw at ~20 Hz, not every frame
      requestAnimationFrame(frame);
    } else {
      model.status = 'done';
      renderTrainAll(); renderTest(); renderUpload();
    }
  }
  renderTest();                                  // hide stale results while training
  requestAnimationFrame(frame);
}
function sseChart(history, xMax) {
  const W = 430, H = 240, m = { l: 52, r: 12, t: 10, b: 36 };
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H });
  const ys = history.map(h => h[1]);
  const x1 = xMax, yMax = ys.length ? Math.max(...ys) * 1.05 : 15;
  const sx = v => m.l + v / x1 * (W - m.l - m.r);
  const sy = v => H - m.b - v / yMax * (H - m.t - m.b);
  for (const t of niceTicks(0, yMax)) {
    svgEl('line', { x1: m.l, x2: W - m.r, y1: sy(t), y2: sy(t), class: 'gridline' }, svg);
    svgEl('text', { x: m.l - 6, y: sy(t) + 3, 'text-anchor': 'end' }, svg).textContent = t;
  }
  for (const t of niceTicks(0, x1)) {
    svgEl('text', { x: sx(t), y: H - m.b + 14, 'text-anchor': 'middle' }, svg).textContent = t;
  }
  svgEl('line', { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, class: 'axisline' }, svg);
  svgEl('line', { x1: m.l, x2: m.l, y1: m.t, y2: H - m.b, class: 'axisline' }, svg);
  svgEl('text', { x: (m.l + W) / 2, y: H - 4, 'text-anchor': 'middle' }, svg).textContent = 'iteration';
  svgEl('text', { x: 12, y: (m.t + H - m.b) / 2, 'text-anchor': 'middle',
                  transform: `rotate(-90 12 ${(m.t + H - m.b) / 2})` }, svg).textContent = 'training error (sse)';
  if (history.length) {
    svgEl('path', { d: 'M' + history.map(h => `${sx(h[0]).toFixed(1)},${sy(h[1]).toFixed(1)}`).join('L'),
                    class: 'sse' }, svg);
    for (const [it, e] of history) {
      const c = svgEl('circle', { cx: sx(it), cy: sy(e), r: 3, fill: 'var(--accent)' }, svg);
      svgEl('title', {}, c).textContent = `iteration ${it}: sse ${e.toFixed(3)}`;
    }
  }
  return svg;
}
/** The fitted discriminant as an HTML one-liner: "3.21 z₁ + 0.45 z₂ + … − 2.05". */
function weightEq(w, nf) {
  let s = '';
  for (let i = 0; i <= nf; i++) {
    s += (w[i] < 0 ? ' − ' : (i ? ' + ' : '')) + Math.abs(w[i]).toFixed(2) +
         (i < nf ? ` z<sub>${i + 1}</sub>` : '');
  }
  return s;
}

/** Render one training panel from its own model. */
function renderTrain(inst) {
  const m = inst.model;
  const busy = m && m.status === 'training';
  const el = inst.out;
  el.innerHTML = '';
  inst.btn.disabled = !state.Xtrain || busy;
  inst.btn.textContent = busy ? 'Training…' : 'Train';
  inst.stop.disabled = !busy;
  inst.note.textContent = !state.Xtrain
    ? 'Select features in Step 1 first.'
    : busy
      ? `training… iteration ${m.iter} of ${m.iters} — watch the error fall and the weights settle`
      : m && m.status === 'init'
        ? 'The weights are randomly initialised — press Train to begin gradient descent.'
        : m && m.stopped
          ? `stopped at iteration ${m.iter} of ${m.iters} — press Train to continue.`
          : `${state.Xtrain.length} feature(s) selected — training re-runs from a new random initialisation each click.`;
  if (!m) return;
  const { w, history, nf } = m;
  el.appendChild(sseChart(history, m.iters));  // blank axes before training
  const eq = document.createElement('p');
  eq.className = 'eqline';
  eq.innerHTML = `w<sup>T</sup>z + b &nbsp;=&nbsp; ${weightEq(w, nf)}`;
  el.appendChild(eq);
  if (nf === 2) {     // with 3+ features the 3-D plot shows the true boundary instead
    const p = document.createElement('p');
    p.innerHTML = 'The <span style="color:var(--boundary)">green line</span> is the decision boundary ' +
      'w<sub>1</sub>z<sub>1</sub> + w<sub>2</sub>z<sub>2</sub> + b = 0 found by training. ' +
      'Does it separate the two classes?';
    el.appendChild(p);
    el.appendChild(scatterPanel(Array.from(state.Xtrain[0]), Array.from(state.Xtrain[1]),
      DATA.cTrain, zSub(0), zSub(1),
      (svg, sx, sy, xd, yd) => {
        const a = w[0], b = w[1], c = w[nf];
        if (Math.abs(b) < 1e-12) return;
        const pts = [[xd[0], (-c - a * xd[0]) / b], [xd[1], (-c - a * xd[1]) / b]];
        svgEl('line', { x1: sx(pts[0][0]), y1: sy(pts[0][1]), x2: sx(pts[1][0]), y2: sy(pts[1][1]),
                        class: 'boundary' }, svg);
        decisionSideArrows(svg, sx, sy, xd, yd, a, b, c);
      }));
  }
}

/** Render both panels, the shared equation and the 3-D plane. */
function renderTrainAll() {
  const m = state.testModel;
  const eq3 = $('eq3d');
  if (eq3) eq3.innerHTML = m ? `${weightEq(m.w, m.nf)} &nbsp;=&nbsp; 0` : '';
  trainInstances.forEach(renderTrain);
  render3d();       // keep the 3-D decision plane in sync (animates during training)
}

/* ---------- step 4: testing ---------- */
function renderTest() {
  const el = $('testOut');
  el.innerHTML = '';
  if (!state.testModel || state.testModel.status !== 'done') {
    el.innerHTML = state.testModel && state.testModel.status === 'training'
      ? '<div class="placeholder">Training in progress — results will appear when it finishes…</div>'
      : '<div class="placeholder">Train the classifier to see test results here.</div>';
    return;
  }
  const q = classify(state.Xtest, state.testModel.w);
  const m = confusion(DATA.cTest, q);
  const nCorrect = m[0][0] + m[1][1], n = DATA.nTest;

  const stat = document.createElement('div');
  stat.className = 'stat';
  stat.innerHTML = `<div class="big">${(100 * nCorrect / n).toFixed(1)}%</div>
    <div class="sub">overall accuracy — ${nCorrect} of ${n} test images correct</div>`;
  el.appendChild(stat);

  const tbl = document.createElement('table');
  tbl.className = 'mat';
  tbl.innerHTML = `
    <tr><th></th><th>predicted neutral</th><th>predicted smiling</th></tr>
    <tr><th>true neutral</th><td class="diag">${m[0][0]}</td><td>${m[0][1]}</td></tr>
    <tr><th>true smiling</th><td>${m[1][0]}</td><td class="diag">${m[1][1]}</td></tr>`;
  el.appendChild(tbl);

  const wrap = document.createElement('div');
  wrap.className = 'scroller';
  const grid = document.createElement('div');
  grid.className = 'montage';
  wrap.appendChild(grid);
  el.appendChild(wrap);
  renderMontage(grid, 'test',
    Array.from(q, (p, k) => (p === DATA.cTest[k] ? '✓ ' : '✗ ') + LABELS[p]),
    Array.from(q, (p, k) => p === DATA.cTest[k] ? 'ok' : 'err'));
}

/* ---------- try your own photo ---------- */
/* Canonical landmark positions in the registered 128x128 frame (measured from
 * the mean face): pupils and mouth corners. Same registration as the dataset. */
const REF_PTS = [[40, 41], [86, 41], [43, 85], [84, 85]];
const PT_NAMES = ['LEFT eye', 'RIGHT eye', 'LEFT corner of the mouth', 'RIGHT corner of the mouth'];
const PT_COLORS = ['#0a84ff', '#0a84ff', '#ff3b30', '#ff3b30'];

const upload = { img: null, gray: null, w: 0, h: 0, pts: [], reg: null, z: null };

function initUpload() {
  $('uploadInput').addEventListener('change', ev => {
    const file = ev.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); uploadLoaded(im); };
    im.onerror = () => { URL.revokeObjectURL(url); $('uploadPrompt').textContent = 'Could not read that file — try a JPEG or PNG.'; };
    im.src = url;
  });
  $('uploadReset').addEventListener('click', () => {
    upload.pts = []; upload.reg = null; upload.z = null;
    renderUpload(); render3d();
  });
  $('uploadCanvas').addEventListener('pointerdown', ev => {
    if (!upload.img || upload.pts.length >= 4) return;
    const b = ev.currentTarget.getBoundingClientRect();
    upload.pts.push([ev.clientX - b.left, ev.clientY - b.top]);
    if (upload.pts.length === 4) {
      const T = similarityTransform(upload.pts, REF_PTS);
      upload.reg = warpSimilarity(upload.gray, upload.w, upload.h, T, SZ);
    }
    renderUpload();
  });
}

function uploadLoaded(im) {
  const s = Math.min(1, 500 / im.width, 540 / im.height);   // cap display size
  const w = Math.round(im.width * s), h = Math.round(im.height * s);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(im, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const g = new Float64Array(w * h);
  for (let i = 0; i < g.length; i++) {
    g[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
  }
  Object.assign(upload, { img: c, gray: g, w, h, pts: [], reg: null, z: null });
  renderUpload();
}

function renderUpload() {
  const cv = $('uploadCanvas');
  if (!cv) return;
  cv.hidden = !upload.img;
  $('uploadReset').hidden = !upload.img || upload.pts.length === 0;
  $('uploadResult').hidden = !upload.reg;

  if (!upload.img) {
    $('uploadPrompt').textContent = 'Choose a clear, front-on photo of a face.';
    return;
  }
  $('uploadPrompt').innerHTML = upload.pts.length < 4
    ? `Click the <strong>${PT_NAMES[upload.pts.length]}</strong> (${upload.pts.length}/4 points placed — left/right as you see them on screen)`
    : 'Face registered — the warped 128×128 image is shown on the right.';

  // photo with landmark markers
  if (cv.width !== upload.w) { cv.width = upload.w; cv.height = upload.h; }
  const ctx = cv.getContext('2d');
  ctx.drawImage(upload.img, 0, 0);
  upload.pts.forEach(([x, y], i) => {
    ctx.strokeStyle = PT_COLORS[i]; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y);
    ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); ctx.stroke();
  });

  // registered result + prediction
  upload.z = null;
  if (upload.reg) {
    const wc = $('warpCanvas'), wctx = wc.getContext('2d');
    const imd = wctx.createImageData(SZ, SZ);
    for (let i = 0; i < SZ * SZ; i++) {
      const v = Math.round(upload.reg[i] * 255);
      imd.data[i * 4] = imd.data[i * 4 + 1] = imd.data[i * 4 + 2] = v;
      imd.data[i * 4 + 3] = 255;
    }
    const off = document.createElement('canvas');
    off.width = SZ; off.height = SZ;
    off.getContext('2d').putImageData(imd, 0, 0);
    wctx.imageSmoothingEnabled = false;
    wctx.drawImage(off, 0, 0, wc.width, wc.height);
    const rects = activeRects();
    const sc = wc.width / SZ;
    rects.forEach((r, i) => {
      const slot = state.slots.indexOf(r);
      wctx.strokeStyle = SLOT_COLORS[slot]; wctx.lineWidth = 1.5;
      wctx.strokeRect(r[0] * sc, r[1] * sc, (r[2] - r[0] + 1) * sc, (r[3] - r[1] + 1) * sc);
    });

    const out = $('uploadVerdict');
    if (!rects.length) {
      out.innerHTML = '<div class="stale">Select features in Step 1 to classify this face.</div>';
    } else {
      const z = rectFeats(upload.reg, SZ, 1, 1, SZ, rects).map(r => r[0]);
      upload.z = z;
      const m = state.testModel;
      if (!m || m.status !== 'done') {
        out.innerHTML = '<div class="stale">Train the classifier to classify this face.</div>';
      } else {
        let act = m.w[m.nf];
        for (let f = 0; f < m.nf; f++) act += m.w[f] * z[f];
        const label = act > 0 ? 'smiling' : 'neutral';
        const conf = 1 / (1 + Math.exp(-act));
        out.innerHTML = `<div class="stat"><div class="big" style="color:var(--c-${label})">${label}</div>
          <div class="sub">w<sup>T</sup>z = ${act.toFixed(2)} &nbsp;·&nbsp; σ(w<sup>T</sup>z) = ${conf.toFixed(2)}</div></div>
          <p class="small muted">z = [${z.map(v => v.toFixed(3)).join(', ')}] — this face is also shown as a
          <span style="color:#c98500;font-weight:700">★</span> in the 3-D feature plot.</p>`;
      }
    }
  }
  render3d();
}

/* ---------- boot ---------- */
async function boot() {
  const [mu0, mu1, trainIm, testIm] = await Promise.all(
    [IMG.mu0, IMG.mu1, IMG.trainSheet, IMG.testSheet].map(loadImage));
  state.imgs = { mu0, mu1 };
  state.gray.train = toGray(trainIm);
  state.gray.test = toGray(testIm);
  showDataTab('train');
  $('tabTrain').addEventListener('click', () => showDataTab('train'));
  $('tabTest').addEventListener('click', () => showDataTab('test'));
  createSelector({ canvas: 'selCanvas', chips: 'chips',
                   loadRef: 'loadRef', clearAll: 'clearAll' }, 2, false);
  createSelector({ canvas: 'selCanvas2', chips: 'chips2',
                   loadRef: 'loadRef2', clearAll: 'clearAll2' }, 3, false);
  createSelector({ canvas: 'selCanvas3', chips: 'chips3',
                   loadRef: 'loadRef3', clearAll: 'clearAll3' }, 8, false);
  createScatterView({ panel: 'scatter', legend: 'scatterLegend', empty: 'scatterEmptyP' }, 'first2');
  createScatterView({ panel: 'scatter2', legend: 'scatterLegend2', empty: 'scatterEmptyP2' }, 'all');
  createScatter3d({ canvas: 'scatter3d', wrap: 'scatter3dWrap',
                    empty: 'scatterEmpty', note: 'scatter3dNote' }, 'manual');
  createScatter3d({ canvas: 'scatter3d2', wrap: 'scatter3dWrap2',
                    empty: 'scatterEmpty2', note: 'scatter3dNote2' }, 'model', 430);
  startScatter3dSpin();
  if ($('mw0')) initManual();
  if ($('pw0')) initManual3();
  if ($('uploadInput')) initUpload();
  createTrainUI({ btn: 'trainBtn', stop: 'stopBtn', eta: 'eta', iters: 'iters',
                  note: 'trainNote', out: 'trainOut' });
  createTrainUI({ btn: 'trainBtn2', stop: 'stopBtn2', eta: 'eta2', iters: 'iters2',
                  note: 'trainNote2', out: 'trainOut2' });
  featuresChanged();
}
boot();
