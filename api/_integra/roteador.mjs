// ARQUIVO GERADO por scripts/sincronizar-integra.mjs a partir do Indaiatuba Integra. Não edite.

// ../indaiatuba-integra/indaiatuba-integra/server/src/grafo.ts
import fs2 from "node:fs";
import path2 from "node:path";

// scripts/integra/dados-shim.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var DATA_DIR = [
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data"),
  path.resolve(process.cwd(), "api/_integra/data")
].find((d) => fs.existsSync(path.join(d, "viario.json")));
var config = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "config.json"), "utf8"));

// ../indaiatuba-integra/indaiatuba-integra/server/src/geo.ts
var R = 6371e3;
var rad = (d) => d * Math.PI / 180;
function dist(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// ../indaiatuba-integra/indaiatuba-integra/server/src/grafo.ts
var FATORES = { ciclovia: 0.55, ciclofaixa: 0.7, compartilhada: 1, sem: 1.8 };
var VEL_ONIBUS = {
  motorway: 70,
  trunk: 55,
  primary: 45,
  secondary: 40,
  tertiary: 35,
  unclassified: 28,
  residential: 25,
  living_street: 12,
  service: 10,
  motorway_link: 40,
  trunk_link: 35,
  primary_link: 35,
  secondary_link: 30,
  tertiary_link: 28
};
var BIT = { onibus: 1, micro: 2, caminhada: 4 };
var viario = JSON.parse(fs2.readFileSync(path2.join(DATA_DIR, "viario.json"), "utf8"));
var lat = [];
var lon = [];
var adj = [];
for (let k = 0; k < viario.nos.length; k += 2) {
  lat.push(viario.nos[k]);
  lon.push(viario.nos[k + 1]);
  adj.push([]);
}
var pos = (n) => [lat[n], lon[n]];
var segs = [];
var naZonaIndustrial = (p) => config.zonasIndustriais.some((z) => dist(p, [z.lat, z.lon]) <= z.raioM);
for (const v of viario.vias) {
  const carro = v.m.includes("c"), bike = v.m.includes("b"), pe = v.m.includes("p");
  const vel = VEL_ONIBUS[v.h] ?? 20;
  for (let k = 0; k < v.v.length - 1; k++) {
    const a = v.v[k], b = v.v[k + 1];
    if (a === b) continue;
    const len = dist(pos(a), pos(b));
    const infra = v.i === "compartilhada" && naZonaIndustrial([(lat[a] + lat[b]) / 2, (lon[a] + lon[b]) / 2]) ? "sem" : v.i;
    let ida = 0, volta = 0;
    if (carro) {
      if (v.o >= 0) ida |= 1;
      if (v.o <= 0) volta |= 1;
    }
    if (bike) {
      const o = v.ob ? v.o : 0;
      if (o >= 0) ida |= 2;
      if (o <= 0) volta |= 2;
    }
    if (pe) {
      ida |= 4;
      volta |= 4;
    }
    if (ida) adj[a].push({ para: b, len, infra, mask: ida, vel });
    if (volta) adj[b].push({ para: a, len, infra, mask: volta, vel });
    segs.push({ a, b, len, infra, ida, volta, vel });
  }
}
var naRede = { caminhada: new Uint8Array(lat.length), micro: new Uint8Array(lat.length), onibus: new Uint8Array(lat.length) };
for (const perfil of Object.keys(BIT)) {
  const bit = BIT[perfil];
  const viz = adj.map(() => []);
  adj.forEach((es, u) => es.forEach((e) => {
    if (e.mask & bit) {
      viz[u].push(e.para);
      viz[e.para].push(u);
    }
  }));
  const comp = new Int32Array(lat.length).fill(-1);
  const tamanhos = [];
  for (let s = 0; s < lat.length; s++) {
    if (comp[s] >= 0 || !viz[s].length) continue;
    const c = tamanhos.length;
    let n = 0;
    const pilha = [s];
    comp[s] = c;
    while (pilha.length) {
      const u = pilha.pop();
      n++;
      for (const w of viz[u]) if (comp[w] < 0) {
        comp[w] = c;
        pilha.push(w);
      }
    }
    tamanhos.push(n);
  }
  const maior = tamanhos.indexOf(Math.max(...tamanhos));
  for (let n = 0; n < lat.length; n++) if (comp[n] === maior) naRede[perfil][n] = 1;
}
var CELULA = 2e-3;
var grade = /* @__PURE__ */ new Map();
var chave = (i, j) => `${i},${j}`;
segs.forEach((s, k) => {
  const i0 = Math.floor(Math.min(lat[s.a], lat[s.b]) / CELULA), i1 = Math.floor(Math.max(lat[s.a], lat[s.b]) / CELULA);
  const j0 = Math.floor(Math.min(lon[s.a], lon[s.b]) / CELULA), j1 = Math.floor(Math.max(lon[s.a], lon[s.b]) / CELULA);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const c = chave(i, j);
    const l = grade.get(c);
    if (l) l.push(k);
    else grade.set(c, [k]);
  }
});
console.log(`[grafo] vi\xE1rio real (OSM): ${lat.length} n\xF3s, ${segs.length} segmentos`);
function encaixar(p, perfil) {
  const bit = BIT[perfil];
  const ci = Math.floor(p[0] / CELULA), cj = Math.floor(p[1] / CELULA);
  let melhor = null;
  const kx = Math.cos(p[0] * Math.PI / 180);
  for (let raio = 0; raio <= 12; raio++) {
    for (let i = ci - raio; i <= ci + raio; i++)
      for (let j = cj - raio; j <= cj + raio; j++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== raio) continue;
        for (const k of grade.get(chave(i, j)) ?? []) {
          const s = segs[k];
          if (!((s.ida | s.volta) & bit) || !naRede[perfil][s.a] || !naRede[perfil][s.b]) continue;
          if (perfil === "onibus" && s.vel <= 12) continue;
          const bx = (lon[s.b] - lon[s.a]) * kx, by = lat[s.b] - lat[s.a];
          const px = (p[1] - lon[s.a]) * kx, py = p[0] - lat[s.a];
          const t = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by || 1e-12)));
          const q = [lat[s.a] + (lat[s.b] - lat[s.a]) * t, lon[s.a] + (lon[s.b] - lon[s.a]) * t];
          const off = dist(p, q);
          if (!melhor || off < melhor.off) melhor = { seg: s, t, q, off };
        }
      }
    if (melhor && melhor.off < raio * CELULA * 111320 * kx) break;
  }
  return melhor;
}
var Heap = class {
  a = [];
  get tamanho() {
    return this.a.length;
  }
  push(n, f) {
    const a = this.a;
    a.push([f, n]);
    let i = a.length - 1;
    while (i > 0) {
      const p = i - 1 >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const topo = a[0][1];
    const ult = a.pop();
    if (a.length) {
      a[0] = ult;
      let i = 0;
      for (; ; ) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return topo;
  }
};
var custoAresta = (len, infra, vel, perfil) => perfil === "onibus" ? len / vel : perfil === "micro" ? len * FATORES[infra] : len;
var CUSTO_MIN = { onibus: 1 / 70, micro: FATORES.ciclovia, caminhada: 1 };
function rotaReta(a, b) {
  const d = dist(a, b);
  return { pontos: [a, b], segmentos: [{ pontos: [a, b], infra: "compartilhada", distanciaM: d }], distanciaM: d, percentualCiclovia: 0 };
}
function rotear(a, b, perfil) {
  const bit = BIT[perfil];
  const ea = encaixar(a, perfil);
  const eb = encaixar(b, perfil);
  if (!ea || !eb) return rotaReta(a, b);
  const S = lat.length, T = lat.length + 1;
  const extra = /* @__PURE__ */ new Map([[S, []], [T, []]]);
  const arestas = (u) => u >= S ? extra.get(u) : adj[u];
  const temporarias = [];
  const ligarT = (u, e) => {
    adj[u].push(e);
    temporarias.push([u, e]);
  };
  const posV = (n) => n === S ? ea.q : n === T ? eb.q : pos(n);
  {
    const s = ea.seg;
    if (s.volta & bit) extra.get(S).push({ para: s.a, len: s.len * ea.t, infra: s.infra, mask: bit, vel: s.vel });
    if (s.ida & bit) extra.get(S).push({ para: s.b, len: s.len * (1 - ea.t), infra: s.infra, mask: bit, vel: s.vel });
  }
  {
    const s = eb.seg;
    if (s.ida & bit) ligarT(s.a, { para: T, len: s.len * eb.t, infra: s.infra, mask: bit, vel: s.vel });
    if (s.volta & bit) ligarT(s.b, { para: T, len: s.len * (1 - eb.t), infra: s.infra, mask: bit, vel: s.vel });
  }
  if (ea.seg === eb.seg) {
    const s = ea.seg;
    const frente = eb.t >= ea.t;
    if ((frente ? s.ida : s.volta) & bit)
      extra.get(S).push({ para: T, len: s.len * Math.abs(eb.t - ea.t), infra: s.infra, mask: bit, vel: s.vel });
  }
  const g = /* @__PURE__ */ new Map([[S, 0]]);
  const veio = /* @__PURE__ */ new Map();
  const fechado = /* @__PURE__ */ new Set();
  const heap = new Heap();
  const h = (n) => dist(posV(n), eb.q) * CUSTO_MIN[perfil];
  heap.push(S, h(S));
  try {
    while (heap.tamanho) {
      const u = heap.pop();
      if (u === T) break;
      if (fechado.has(u)) continue;
      fechado.add(u);
      const gu = g.get(u);
      for (const e of arestas(u)) {
        if (!(e.mask & bit)) continue;
        const custo = gu + custoAresta(e.len, e.infra, e.vel, perfil);
        if (custo < (g.get(e.para) ?? Infinity)) {
          g.set(e.para, custo);
          veio.set(e.para, { de: u, infra: e.infra });
          heap.push(e.para, custo + h(e.para));
        }
      }
    }
  } finally {
    for (const [u, e] of temporarias) adj[u].splice(adj[u].indexOf(e), 1);
  }
  if (!veio.has(T)) return rotaReta(a, b);
  const nos = [T];
  const infras = [];
  let cur = T;
  while (cur !== S) {
    const v = veio.get(cur);
    infras.unshift(v.infra);
    nos.unshift(v.de);
    cur = v.de;
  }
  const pontos = [a, ...nos.map(posV), b];
  const infraPorAresta = ["compartilhada", ...infras, "compartilhada"];
  const segmentos = [];
  for (let i = 0; i < pontos.length - 1; i++) {
    const d = dist(pontos[i], pontos[i + 1]);
    if (d < 0.5) continue;
    const inf = infraPorAresta[i];
    const ult = segmentos[segmentos.length - 1];
    if (ult && ult.infra === inf) {
      ult.pontos.push(pontos[i + 1]);
      ult.distanciaM += d;
    } else segmentos.push({ pontos: [pontos[i], pontos[i + 1]], infra: inf, distanciaM: d });
  }
  const distanciaM = segmentos.reduce((s2, x) => s2 + x.distanciaM, 0);
  const ciclo = segmentos.filter((x) => x.infra === "ciclovia" || x.infra === "ciclofaixa").reduce((s2, x) => s2 + x.distanciaM, 0);
  return {
    pontos: pontos.filter((p, i) => i === 0 || dist(p, pontos[i - 1]) >= 0.5),
    segmentos,
    distanciaM,
    percentualCiclovia: distanciaM > 0 ? Math.round(ciclo / distanciaM * 100) : 0
  };
}
function pontoNaVia(p, perfil) {
  return encaixar(p, perfil)?.q ?? p;
}
export {
  pontoNaVia,
  rotear
};
