// Content + engine + sync checks for the User Management Lab. Zero dependencies.
//   node tests/check.mjs          -> validates everything, exits 1 on any error
//   node tests/check.mjs --shape  -> also prints the answer-length audit per question
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const noop = () => {};
const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON, Set,
  document: { addEventListener: noop, querySelector: () => null, getElementById: () => null, querySelectorAll: () => [] },
  addEventListener: noop, location: { hash: "" } };
ctx.window = ctx;
vm.createContext(ctx);
// Classic scripts share one global scope in the browser; join them so const/let carry across.
const src = ["lessons.js", "questions.js", "lab.js"].map(f => fs.readFileSync(path.join(root, "assets", f), "utf8")).join("\n;\n");
vm.runInContext(src + "\n;globalThis.__X={DOCS,REF,OBJECTIVES,LESSONS,QB,MISSIONS,baseState,AUTHS,UTYPES};", ctx);
const { REF, OBJECTIVES, LESSONS, QB, MISSIONS, baseState, AUTHS } = ctx.__X;

const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);
const objIds = new Set(OBJECTIVES.map(o => o.id));

/* ── objectives & lessons ── */
for (const o of OBJECTIVES) {
  const L = LESSONS[o.id];
  if (!L) { err(`lesson missing for ${o.id}`); continue; }
  if (!L.cards?.length) err(`${o.id}: no cards`);
  if (!L.traps?.length) err(`${o.id}: no traps`);
  if (!L.say?.length) err(`${o.id}: no say-it-out-loud prompt`);
  if (!L.key?.length) err(`${o.id}: no key points`);
  const fams = QB.filter(f => f.o === o.id);
  if (fams.length < 3) err(`${o.id}: needs >=3 fact families for the lesson check and exam draw (has ${fams.length})`);
}

/* ── question bank ── */
const ids = new Set();
let nVar = 0;
const shape = [];
for (const f of QB) {
  if (ids.has(f.id)) err(`duplicate family id ${f.id}`); ids.add(f.id);
  if (!objIds.has(f.o)) err(`${f.id}: unknown objective ${f.o}`);
  if (!REF[f.r]) err(`${f.id}: unknown ref ${f.r}`);
  if (!f.e || f.e.length < 30) err(`${f.id}: explanation missing/too short`);
  if (!f.v?.length) err(`${f.id}: no variants`);
  f.v.forEach((v, i) => {
    nVar++;
    const tag = `${f.id}#${i}`;
    if (!v.q || v.q.length < 12) err(`${tag}: question text missing`);
    if (v.r && !REF[v.r]) err(`${tag}: unknown variant ref ${v.r}`);
    if (v.y === "mc" || v.y === "multi") {
      if (!Array.isArray(v.o) || v.o.length < 3) err(`${tag}: needs >=3 options`);
      if (new Set(v.o).size !== v.o.length) err(`${tag}: duplicate options`);
      if (!Array.isArray(v.a) || !v.a.length) err(`${tag}: no answer`);
      if (v.a.some(x => x < 0 || x >= v.o.length)) err(`${tag}: answer index out of range`);
      if (v.y === "mc" && v.a.length !== 1) err(`${tag}: mc must have exactly one answer`);
      if (v.y === "multi" && (v.a.length < 2 || v.a.length >= v.o.length)) err(`${tag}: multi must have 2..n-1 answers`);
      if (/choose (two|three|four)/i.test(v.q)) {
        const want = { two: 2, three: 3, four: 4 }[v.q.match(/choose (two|three|four)/i)[1].toLowerCase()];
        if (want !== v.a.length) err(`${tag}: says choose ${want} but has ${v.a.length} answers`);
      }
      // answer-shape audit: the key must not stand out by length
      const len = v.o.map(s => s.length), keyLens = v.a.map(i => len[i]);
      const others = len.filter((_, i) => !v.a.includes(i));
      const maxO = Math.max(...others), minO = Math.min(...others);
      const keyMax = Math.max(...keyLens), keyMin = Math.min(...keyLens);
      const longest = keyMin > maxO, ratio = keyMax / maxO;
      shape.push({ tag, y: v.y, longest, shortest: keyMax < minO, ratio });
      if (v.y === "mc" && longest && ratio > 1.25) warn(`${tag}: correct option is ${Math.round((ratio - 1) * 100)}% longer than every distractor`);
    } else if (v.y === "tf") {
      if (typeof v.a !== "boolean") err(`${tag}: tf answer must be boolean`);
    } else if (v.y === "order") {
      if (!Array.isArray(v.o) || v.o.length < 3) err(`${tag}: order needs >=3 steps`);
    } else if (v.y === "match") {
      if (!Array.isArray(v.p) || v.p.length < 3) err(`${tag}: match needs >=3 pairs`);
      else {
        if (new Set(v.p.map(p => p[1])).size !== v.p.length) err(`${tag}: match right-hand values must be unique`);
        if (new Set(v.p.map(p => p[0])).size !== v.p.length) err(`${tag}: match left-hand values must be unique`);
      }
    } else err(`${tag}: unknown type ${v.y}`);
  });
}

/* ── REF urls ── */
for (const [k, [label, url]] of Object.entries(REF)) {
  if (!/^https:\/\/docs\.cyberark\.com\/pam-self-hosted\/latest\/en\/content\//.test(url)) err(`REF ${k}: not a docs.cyberark.com PAM self-hosted URL`);
  if (/\s/.test(url)) err(`REF ${k}: url has a raw space`);
  if (!label) err(`REF ${k}: no label`);
}

/* ── lab missions: fresh state must FAIL, a scripted solution must PASS ── */
const solve = {
  M1: s => { const u = s.users.find(x => x.name === "bob"); u.tna.forEach(t => { t.active = true; t.viol = 0; }); },
  M2: s => { s.users.find(x => x.name === "hd_jane").auths = ["AuditUsers", "ActivateUsers"]; },
  M3: s => { s.users.find(x => x.name === "ali_contractor").ifaces = ["PVWA"]; },
  M4: s => { Object.assign(s.users.find(x => x.name === "vendor_x"), { logonAny: false, from: "8", to: "18", expires: "2026-12-31" }); },
  M5: s => { Object.assign(s.users.find(x => x.name === "Auditor"), { disabled: false, pwSet: true }); },
  M6: s => { s.groups.find(g => g.name === "DB-Admins").members.push({ k: "lg", n: "DBA-Team" }); },
  M7: s => { s.maps.find(m => m.name === "Vault Auditors Mapping").auths = ["AuditUsers"]; },
  M8: s => { const a = s.maps.findIndex(m => m.name === "Vault Admins Mapping"); const [m] = s.maps.splice(a, 1); s.maps.unshift(m); },
  M9: s => { s.maps.unshift({ name: "ServiceDesk Mapping", ldap: "ServiceDesk", match: "Exact", type: "EPVUser", auth: "LDAP Authentication", auths: ["ActivateUsers", "AuditUsers"], loc: "\\" }); },
  M10: s => { s.pv.radius.Enabled = "Yes"; s.users.find(x => x.name === "mike").auth = "RADIUS Authentication"; },
  M11: s => { s.users.push({ name: "svc_reports", loc: "\\", src: "CyberArk", type: "EPVUser", pwSet: true, mustChange: false, neverExpires: true, auths: [], tna: [] }); },
  M12: s => { s.nets.push({ name: "SOC", level: "Low", gw: false, addrs: [{ kind: "Mask", ip: "10.20.30.0", mask: 24 }] }); }
};
const mids = new Set();
for (const m of MISSIONS) {
  if (mids.has(m.id)) err(`duplicate mission ${m.id}`); mids.add(m.id);
  if (!objIds.has(m.o)) err(`${m.id}: unknown objective`);
  if (!REF[m.r]) err(`${m.id}: unknown ref ${m.r}`);
  const fresh = baseState(); if (m.who) fresh.who = m.who; if (m.setup) m.setup(fresh);
  const c0 = m.check(fresh);
  if (c0.every(c => c.ok)) err(`${m.id}: already passes before the learner does anything`);
  if (!solve[m.id]) { err(`${m.id}: no scripted solution in tests`); continue; }
  const st = baseState(); if (m.who) st.who = m.who; if (m.setup) m.setup(st); solve[m.id](st);
  const c1 = m.check(st);
  if (!c1.every(c => c.ok)) err(`${m.id}: scripted solution fails: ${c1.filter(c => !c.ok).map(c => c.m).join("; ")}`);
}
if (AUTHS.length !== 10) err(`expected 10 Vault authorizations, found ${AUTHS.length}`);

/* ── a tiny fake browser: just enough DOM plus a fake Puter SDK to run the real app ── */
function makeBrowser({ local = {}, cloud = {}, signedIn = false } = {}) {
  const el = () => ({ innerHTML: "", textContent: "", className: "", hidden: false, value: "", disabled: false, style: {}, dataset: {},
    classList: { toggle: noop, add: noop, remove: noop }, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [],
    setAttribute: noop, getAttribute: () => "dark", scrollIntoView: noop, onchange: null, click: noop, appendChild: noop });
  const store = Object.assign({}, local);
  const fake = { signedIn, cloud, sets: 0, failGet: false };
  const puter = {
    auth: { isSignedIn: () => fake.signedIn, signIn: async () => { fake.signedIn = true; }, getUser: async () => ({ username: "hasan" }), signOut: () => { fake.signedIn = false; } },
    kv: { get: async k => { if (fake.failGet) throw new Error("offline"); return fake.cloud[k] ?? null; }, set: async (k, v) => { fake.sets++; fake.cloud[k] = v; return true; } }
  };
  const w = { console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: noop, Date, Math, JSON, Set, Map, Promise, Blob: class {}, URL: {},
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    matchMedia: () => ({ matches: false }), scrollTo: noop, confirm: () => true, alert: noop, addEventListener: noop, location: { hash: "#/home" }, puter,
    document: { addEventListener: noop, visibilityState: "visible", head: el(), documentElement: el(), getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], createElement: el } };
  w.window = w;
  vm.createContext(w);
  const all = ["lessons.js", "questions.js", "lab.js", "sync.js", "app.js"].map(f => fs.readFileSync(path.join(root, "assets", f), "utf8")).join("\n;\n");
  vm.runInContext(all + "\n;globalThis.__app = { get S() { return S; }, record, calibration, mergeProgress, SYNC, route, makeQ, qHtml, grade, answeredEnough, location };", w, { filename: "app-bundle.js" });
  return { A: w.__app, fake, store };
}
const settle = () => new Promise(r => setTimeout(r, 5));

/* ── engine: render + grade every variant with a correct and a wrong answer, walk every route ── */
try {
  const { A } = makeBrowser();
  const { makeQ, qHtml, grade, answeredEnough, route, location } = A;
  for (const f of QB) f.v.forEach((v, i) => {
    const tag = f.id + "#" + i;
    try {
      const q = makeQ(f.id, i); qHtml(q, { mode: "drill", feedback: true });
      if (q.y === "mc" || q.y === "multi") q.sel = q.perm.map((s, d) => v.a.includes(s) ? d : -1).filter(d => d >= 0);
      else if (q.y === "tf") q.sel = [v.a ? 0 : 1];
      else if (q.y === "order") q.order = v.o.map((_, k) => k);
      else q.match = v.p.map((_, k) => k);
      if (!answeredEnough(q) || !grade(q)) err(`engine: ${tag}: correct answer not accepted`);
      q.answered = true; q.ok = true; qHtml(q, { mode: "drill", feedback: true });
      const w = makeQ(f.id, i);
      if (w.y === "mc" || w.y === "tf") w.sel = [w.perm.findIndex(s => w.y === "tf" ? s !== (v.a ? 0 : 1) : !v.a.includes(s))];
      if (w.y === "multi") w.sel = [w.perm.findIndex(s => !v.a.includes(s))];
      if (w.y === "match") w.match = v.p.map((_, k) => (k + 1) % v.p.length);
      if (grade(w)) err(`engine: ${tag}: a wrong answer was accepted`);
      w.answered = true; w.ok = false; qHtml(w, { mode: "review", feedback: true });
    } catch (e) { err(`engine: ${tag}: ${e.message}`); }
  });
  for (const h of ["#/home", "#/learn", "#/drill", "#/drill/O3", "#/drill/mis", "#/exam", "#/sheet", "#/about", "#/lab"].concat(OBJECTIVES.map(o => "#/learn/" + o.id), MISSIONS.map(m => "#/lab/" + m.id))) {
    try { location.hash = h; route(); } catch (e) { err(`engine: route ${h}: ${e.message}`); }
  }
} catch (e) { err("app load/engine: " + e.message); }

/* ── sign-in sync: two devices' progress must merge, never overwrite ── */
try {
  const fam = QB.map(f => f.id);
  const phone = { f: { [fam[0]]: { n: 4, c: 4, box: 3, lastTs: 2000, lastOk: true, okV: [1], mis: false, lastV: 1 } },
    lessons: { O1: 500 }, lab: { M1: 600 }, exams: [{ when: 1000, score: 80, n: 30, correct: 24 }], calDev: { phone1: { sc: 5, sw: 1, uc: 0, uw: 0 } } };
  const laptop = { f: { [fam[0]]: { n: 2, c: 1, box: 1, lastTs: 1000, lastOk: true, okV: [0], mis: false, lastV: 0 }, [fam[1]]: { n: 1, c: 1, box: 1, lastTs: 1500, lastOk: true, okV: [0], mis: false, lastV: 0 } },
    lessons: { O2: 700 }, exams: [{ when: 3000, score: 90, n: 30, correct: 27 }], calDev: {}, theme: "light" };
  const cloud = { umlab_state_v1: JSON.stringify(phone) };
  const { A, fake } = makeBrowser({ local: { umlab_v1: JSON.stringify(laptop), umlab_dev: "laptop1" }, cloud });
  await settle();
  if (A.SYNC.user) err("sync: should start signed out");
  if (fake.sets) err("sync: uploaded something before sign-in");
  await A.SYNC.signIn();
  const S1 = A.S;
  if (!A.SYNC.user) err("sync: sign-in didn't take");
  if (!(S1.lessons.O1 && S1.lessons.O2)) err("sync: lessons from both devices should survive the merge");
  if (!S1.lab.M1) err("sync: lab missions from the cloud copy were lost");
  if (S1.exams.length !== 2) err(`sync: expected 2 exams after merge, got ${S1.exams.length}`);
  const m0 = S1.f[fam[0]];
  if (!m0 || m0.box !== 3 || m0.lastTs !== 2000) err("sync: the most recent answer's streak should win for a shared fact");
  if (!m0 || m0.okV.join() !== "0,1") err("sync: correct-wording history should be unioned");
  if (!S1.f[fam[1]]) err("sync: a fact only answered on this device was lost");
  if (!S1.calDev.phone1 || !S1.calDev.laptop1) err("sync: confidence counters from both devices should be kept");
  if (S1.theme !== "light") err("sync: device-local theme should be kept");
  const cloud1 = JSON.parse(cloud.umlab_state_v1);
  if (!(cloud1.lessons.O1 && cloud1.lessons.O2) || cloud1.exams.length !== 2) err("sync: merged progress wasn't uploaded");
  if ("theme" in cloud1) err("sync: device-local theme leaked into the cloud copy");
  A.record(fam[2], 0, true, true);
  await A.SYNC.flush();
  if (!JSON.parse(cloud.umlab_state_v1).f[fam[2]]) err("sync: a new answer wasn't uploaded");
  const cal = A.calibration();
  if (cal.sure !== 7) err(`sync: calibration should add both devices' sure answers (expected 7, got ${cal.sure})`);
  const before = fake.sets; fake.failGet = true;
  await A.SYNC.syncNow();
  if (fake.sets !== before) err("sync: uploaded even though reading the cloud copy failed (could overwrite data)");
  fake.failGet = false;
  // a second device that is already signed in picks everything up on load
  const { A: B } = makeBrowser({ local: { umlab_dev: "tablet1" }, cloud, signedIn: true });
  await settle(); await settle();
  if (!B.SYNC.user) err("sync: an already-signed-in session wasn't restored on load");
  if (!B.S.lessons.O1 || !B.S.f[fam[2]]) err("sync: a fresh device didn't receive the account's progress");
  // reset while signed in also clears the cloud copy
  await B.SYNC.wipe();
  if (cloud.umlab_state_v1 !== "{}") err("sync: wipe didn't clear the cloud copy");
  // merge laws
  const M = A.mergeProgress, mm = M(phone, laptop), mm2 = M(laptop, phone);
  const core = o => JSON.stringify({ f: o.f, lessons: o.lessons, lab: o.lab, exams: o.exams, calDev: o.calDev });
  if (core(mm) !== core(mm2)) err("sync: merge isn't order-independent");
  if (core(M(mm, mm)) !== core(mm)) err("sync: merging a state with itself changed it");
  // a user with old-format progress (single S.cal counter) keeps it after the upgrade
  const { A: C } = makeBrowser({ local: { umlab_v1: JSON.stringify({ f: {}, cal: { sc: 3, sw: 1, uc: 2, uw: 0 } }), umlab_dev: "old1" } });
  const cc = C.calibration();
  if (cc.sure !== 4 || cc.uns !== 2) err("sync: old confidence counters were lost in the upgrade");
} catch (e) { err("sync test crashed: " + e.message); }

/* ── report ── */
const mcs = shape.filter(s => s.y === "mc");
const pctLongest = Math.round(mcs.filter(s => s.longest).length / mcs.length * 100);
const pctShortest = Math.round(mcs.filter(s => s.shortest).length / mcs.length * 100);
if (process.argv.includes("--shape")) shape.forEach(s => console.log(`${s.tag.padEnd(26)} ${s.y.padEnd(5)} ${s.longest ? "LONGEST" : s.shortest ? "shortest" : "mid"} x${s.ratio.toFixed(2)}`));
console.log(`families: ${QB.length} · variants: ${nVar} · missions: ${MISSIONS.length} · refs: ${Object.keys(REF).length}`);
console.log(`answer shape (single-answer mc, n=${mcs.length}): key is longest in ${pctLongest}% · shortest in ${pctShortest}%  (chance with 4 options ≈ 25%)`);
if (pctLongest > 40) err(`correct answer is the longest option in ${pctLongest}% of mc questions - guessable by length`);
warns.forEach(w => console.log("warn  " + w));
errors.forEach(e => console.log("ERROR " + e));
console.log(errors.length ? `\n${errors.length} error(s)` : "\nall checks passed");
process.exit(errors.length ? 1 : 0);
