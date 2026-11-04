/* ================= CORE (pure math — unit-tested in Node) ================= */
/** Mean grey level of each rect in each tile of a spritesheet.
 *  gray: Float64Array (sheetW*sheetH), rects: [[x0,y0,x1,y1],...] inclusive. */
function rectFeats(gray, sheetW, n, cols, size, rects) {
  const X = rects.map(() => new Float64Array(n));
  for (let k = 0; k < n; k++) {
    const bx = (k % cols) * size, by = Math.floor(k / cols) * size;
    for (let f = 0; f < rects.length; f++) {
      const [x0, y0, x1, y1] = rects[f];
      let s = 0;
      for (let y = y0; y <= y1; y++) {
        const rowOff = (by + y) * sheetW + bx;
        for (let x = x0; x <= x1; x++) s += gray[rowOff + x];
      }
      X[f][k] = s / ((x1 - x0 + 1) * (y1 - y0 + 1));
    }
  }
  return X;
}

/** One gradient-descent iteration on 0.5*sum((t - sigmoid(w'x))^2), updating w
 *  in place. X: array of nf rows. Returns the pre-update sse. */
function sigmoidStep(X, t, eta, w) {
  const nf = X.length, n = t.length;
  const grad = new Float64Array(nf + 1);
  let sse = 0;
  for (let k = 0; k < n; k++) {
    let a = w[nf];
    for (let f = 0; f < nf; f++) a += w[f] * X[f][k];
    const q = 1 / (1 + Math.exp(-a));
    const delta = t[k] - q;
    sse += 0.5 * delta * delta;
    const deda = delta * q * (1 - q);
    for (let f = 0; f < nf; f++) grad[f] -= X[f][k] * deda;
    grad[nf] -= deda;
  }
  for (let i = 0; i <= nf; i++) w[i] -= eta * grad[i];
  return sse;
}

/** Full gradient-descent run (reference implementation built on sigmoidStep).
 *  randn: () => standard-normal sample. Returns {w, history:[[iter,sse],...]}. */
function sigmoidLearn(X, t, eta, iters, randn) {
  const w = new Float64Array(X.length + 1);
  for (let i = 0; i < w.length; i++) w[i] = randn();
  const history = [];
  const step = Math.max(Math.floor(iters / 20), 1);
  for (let iter = 1; iter <= iters; iter++) {
    const sse = sigmoidStep(X, t, eta, w);
    if (iter % step === 0) history.push([iter, sse]);
  }
  return { w, history };
}

/** Threshold the linear discriminant at zero. Returns Uint8Array of 0/1. */
function classify(X, w) {
  const nf = X.length, n = X[0].length, q = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    let a = w[nf];
    for (let f = 0; f < nf; f++) a += w[f] * X[f][k];
    q[k] = a > 0 ? 1 : 0;
  }
  return q;
}

/** conf[i][j] = count(true class i, predicted j). */
function confusion(C, q) {
  const m = [[0, 0], [0, 0]];
  for (let k = 0; k < C.length; k++) m[C[k]][q[k]]++;
  return m;
}

/** Intersection polygon of the plane w·p + b = 0 with the box [lo,hi]^3.
 *  Returns vertices ordered around the polygon, or null if no intersection. */
function planeBoxPolygon(w, b, lo, hi) {
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const cross = (p, q) => [p[1] * q[2] - p[2] * q[1],
                           p[2] * q[0] - p[0] * q[2],
                           p[0] * q[1] - p[1] * q[0]];
  const pts = [];
  for (let a = 0; a < 3; a++) {              // edges parallel to axis a
    if (Math.abs(w[a]) < 1e-12) continue;
    const [u, v] = [0, 1, 2].filter(i => i !== a);
    for (const cu of [lo[u], hi[u]]) for (const cv of [lo[v], hi[v]]) {
      const s = -(b + w[u] * cu + w[v] * cv) / w[a];
      if (s >= lo[a] - 1e-9 && s <= hi[a] + 1e-9) {
        const p = [0, 0, 0]; p[u] = cu; p[v] = cv; p[a] = s;
        if (!pts.some(q => dot(sub(p, q), sub(p, q)) < 1e-16)) pts.push(p);
      }
    }
  }
  if (pts.length < 3) return null;
  const c = [0, 1, 2].map(i => pts.reduce((s, p) => s + p[i], 0) / pts.length);
  const nl = Math.hypot(w[0], w[1], w[2]);
  const n = [w[0] / nl, w[1] / nl, w[2] / nl];
  let e1 = cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]);
  const l1 = Math.hypot(...e1); e1 = e1.map(x => x / l1);
  const e2 = cross(n, e1);
  return pts.sort((p, q) =>
    Math.atan2(dot(sub(p, c), e2), dot(sub(p, c), e1)) -
    Math.atan2(dot(sub(q, c), e2), dot(sub(q, c), e1)));
}
/** Least-squares similarity transform (rotation+scale+translation) mapping
 *  src[i] -> dst[i]. Returns {a,b,tx,ty}: u = a*x - b*y + tx, v = b*x + a*y + ty. */
function similarityTransform(src, dst) {
  const n = src.length;
  let mx = 0, my = 0, mu = 0, mv = 0;
  for (let i = 0; i < n; i++) {
    mx += src[i][0]; my += src[i][1]; mu += dst[i][0]; mv += dst[i][1];
  }
  mx /= n; my /= n; mu /= n; mv /= n;
  let sxx = 0, sxy = 0, nrm = 0;
  for (let i = 0; i < n; i++) {
    const x = src[i][0] - mx, y = src[i][1] - my;
    const u = dst[i][0] - mu, v = dst[i][1] - mv;
    sxx += x * u + y * v;
    sxy += x * v - y * u;
    nrm += x * x + y * y;
  }
  const a = sxx / nrm, b = sxy / nrm;
  return { a, b, tx: mu - (a * mx - b * my), ty: mv - (b * mx + a * my) };
}

/** Inverse-warp a grayscale image through a similarity transform with bilinear
 *  sampling: output pixel (ox,oy) samples the source at T^-1 (ox,oy).
 *  gray: Float64Array (w*h). Returns a size*size Float64Array. */
function warpSimilarity(gray, w, h, T, size) {
  const { a, b, tx, ty } = T;
  const det = a * a + b * b;
  const out = new Float64Array(size * size);
  for (let oy = 0; oy < size; oy++) for (let ox = 0; ox < size; ox++) {
    const dx = ox - tx, dy = oy - ty;
    const sx = (a * dx + b * dy) / det;
    const sy = (-b * dx + a * dy) / det;
    const x0 = Math.floor(sx), y0 = Math.floor(sy);
    let v = 0.5;                                  // out-of-frame -> mid grey
    if (x0 >= 0 && y0 >= 0 && x0 < w - 1 && y0 < h - 1) {
      const fx = sx - x0, fy = sy - y0;
      v = gray[y0 * w + x0] * (1 - fx) * (1 - fy)
        + gray[y0 * w + x0 + 1] * fx * (1 - fy)
        + gray[(y0 + 1) * w + x0] * (1 - fx) * fy
        + gray[(y0 + 1) * w + x0 + 1] * fx * fy;
    }
    out[oy * size + ox] = v;
  }
  return out;
}
/* =============== END CORE =============== */
