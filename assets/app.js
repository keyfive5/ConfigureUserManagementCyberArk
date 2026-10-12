/* User Management Lab - app engine.
   Plain browser JS, no build step, no dependencies. Progress lives in localStorage,
   and syncs to the learner's account when they sign in (see sync.js). */

/* ───────────── state ───────────── */
const LSKEY = "umlab_v1";
let S = (() => { try { return JSON.parse(localStorage.getItem(LSKEY)) || {}; } catch (e) { return {}; } })();
/* A random id for this browser, so confidence counters from different devices can be
   merged without double counting. Kept outside S so syncing never overwrites it. */
const DEV = (() => { try { let d = localStorage.getItem("umlab_dev"); if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem("umlab_dev", d); } return d; } catch (e) { return "local"; } })();
function normalizeState() {
  S.f = S.f || {};            // per-family stats {n,c,box,lastTs,lastOk,okV:[],mis,lastV}
  S.lessons = S.lessons || {}; // {O1: timestamp}
  S.exams = S.exams || [];     // [{when,score,n,correct,byObj,cal}]
  S.lab = S.lab || {};         // {M1: timestamp}
  S.calDev = S.calDev || {};   // {deviceId: {sc,sw,uc,uw}} sure/unsure x correct/wrong
  if (S.cal) { S.calDev[DEV] = S.cal; delete S.cal; }   // migrate the old single counter
  S.calDev[DEV] = S.calDev[DEV] || { sc: 0, sw: 0, uc: 0, uw: 0 };
}
normalizeState();
const saveLocal = () => { try { localStorage.setItem(LSKEY, JSON.stringify(S)); } catch (e) {} };
const save = () => { saveLocal(); if (window.SYNC) SYNC.queue(); };

const FAM = {}; QB.forEach(f => FAM[f.id] = f);
const BYOBJ = {}; OBJECTIVES.forEach(o => BYOBJ[o.id] = QB.filter(f => f.o === o.id));
const OBJ = {}; OBJECTIVES.forEach(o => OBJ[o.id] = o);
const VARIANT_COUNT = QB.reduce((n, f) => n + f.v.length, 0);

const $ = s => document.querySelector(s);
const app = () => document.getElementById("app");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = x => Math.round(x * 100);
const now = () => Date.now();

/* ───────────── mastery model ─────────────
   A family is MASTERED when it has climbed to box 3 (three confident correct answers
   without a miss in between), was answered correctly in at least two different
   wordings (when it has two), and the latest answer was correct. Being sure and
   wrong marks a misconception, which gets top priority in the drill. */
function fstat(id) { return S.f[id] || { n: 0, c: 0, box: 0, lastTs: 0, lastOk: false, okV: [], mis: false, lastV: -1 }; }
function isMastered(id) {
  const s = fstat(id), f = FAM[id];
  return s.box >= 3 && s.lastOk && new Set(s.okV).size >= Math.min(2, f.v.length);
}
function famScore(id) {
  const s = fstat(id);
  if (isMastered(id)) return 1;
  return Math.min(s.box, 3) / 3 * 0.75;
}
function objScore(oid) { const fs = BYOBJ[oid]; return fs.reduce((a, f) => a + famScore(f.id), 0) / fs.length; }
function readiness() { return OBJECTIVES.reduce((a, o) => a + objScore(o.id), 0) / OBJECTIVES.length; }
function masteredCount() { return QB.filter(f => isMastered(f.id)).length; }
function record(id, vi, ok, sure) {
  const s = fstat(id);
  s.n++; s.lastTs = now(); s.lastV = vi; s.lastOk = ok;
  if (ok) {
    s.c++;
    if (!s.okV.includes(vi)) s.okV.push(vi);
    s.box = sure ? Math.min(4, s.box + 1) : Math.max(s.box, 1);
    if (sure) s.mis = false;
  } else {
    s.box = 0;
    if (sure) s.mis = true;
  }
  S.f[id] = s;
  S.calDev[DEV][(sure ? "s" : "u") + (ok ? "c" : "w")]++;
  save(); header();
}
function calibration() {
  const c = { sc: 0, sw: 0, uc: 0, uw: 0 };
  Object.values(S.calDev).forEach(d => { for (const k in c) c[k] += d[k] || 0; });
  const sure = c.sc + c.sw, uns = c.uc + c.uw;
  return { sure, uns, sureAcc: sure ? c.sc / sure : null, unsAcc: uns ? c.uc / uns : null, danger: c.sw };
}

/* ───────────── question objects ───────────── */
function pickVariant(f, avoid) {
  const s = fstat(f.id);
  const idx = f.v.map((_, i) => i).filter(i => i !== avoid || f.v.length === 1);
  const fresh = idx.filter(i => !s.okV.includes(i));
  const pool = fresh.length ? fresh : idx;
  return pool[Math.floor(Math.random() * pool.length)];
}
function makeQ(famId, vi) {
  const f = FAM[famId], v = f.v[vi];
  const q = { fam: famId, vi, v, y: v.y, sel: [], answered: false, ok: null, sure: true, cursor: 0, r: v.r || f.r, e: v.e || f.e };
  if (v.y === "mc" || v.y === "multi") {
    q.perm = shuffle(v.o.map((_, i) => i));          // display index -> source index
  } else if (v.y === "tf") {
    q.perm = [0, 1];                                   // True, False - fixed order
  } else if (v.y === "order") {
    let p; do { p = shuffle(v.o.map((_, i) => i)); } while (p.every((x, i) => x === i) && v.o.length > 1);
    q.order = p;
  } else if (v.y === "match") {
    q.rights = shuffle(v.p.map((_, i) => i));          // dropdown order
    q.match = v.p.map(() => -1);                        // chosen right index per left
  }
  return q;
}
function correctSet(q) {
  if (q.y === "tf") return [q.v.a ? 0 : 1];
  if (q.y === "order" || q.y === "match") return [];
  return q.v.a.slice().sort();
}
function grade(q) {
  if (q.y === "order") return q.order.every((x, i) => x === i);
  if (q.y === "match") return q.match.every((x, i) => x === i);
  const chosen = q.sel.map(d => q.perm[d]).sort();
  const want = correctSet(q);
  return chosen.length === want.length && chosen.every((x, i) => x === want[i]);
}
function answeredEnough(q) {
  if (q.y === "order") return true;
  if (q.y === "match") return q.match.every(x => x >= 0);
  if (q.y === "multi") return q.sel.length === q.v.a.length;
  return q.sel.length === 1;
}
function optLabel(q, d) { return q.y === "tf" ? (d === 0 ? "True" : "False") : q.v.o[q.perm[d]]; }
function refHtml(q) {
  const r = REF[q.r]; if (!r) return "";
  return `<div class="ref">📖 Official docs: <a href="${esc(r[1])}" target="_blank" rel="noopener noreferrer">${esc(r[0])}</a></div>`;
}
function typeHint(q) {
  if (q.y === "multi") return `Choose ${["", "one", "two", "three", "four", "five"][q.v.a.length]}`;
  if (q.y === "order") return "Put the steps in the correct order";
  if (q.y === "match") return "Match every item";
  if (q.y === "tf") return "True or false";
  return "Choose one";
}

/* Renders one question. ctx = {mode:'drill'|'lesson'|'exam', feedback:bool} */
function qHtml(q, ctx) {
  const fb = q.answered && ctx.feedback;
  const want = fb ? correctSet(q) : [];
  let body = "";
  if (q.y === "mc" || q.y === "multi" || q.y === "tf") {
    const n = q.y === "tf" ? 2 : q.v.o.length;
    body = `<div class="opts" role="${q.y === "multi" ? "group" : "radiogroup"}">` + Array.from({ length: n }, (_, d) => {
      const src = q.perm[d], on = q.sel.includes(d);
      let cls = "opt" + (on ? " on" : "") + (q.y === "multi" ? " multi" : "");
      if (fb) { if (want.includes(src)) cls += " good"; else if (on) cls += " bad"; }
      if (!q.answered && q.cursor === d) cls += " cur";
      const key = ctx.mode === "exam" && S.noLabels !== false ? "" : `<span class="k">${d + 1}</span>`;
      return `<button class="${cls}" data-act="pick" data-arg="${d}" ${q.answered ? "disabled" : ""} aria-pressed="${on}">${key}<span class="box"></span><span class="ot">${esc(optLabel(q, d))}</span></button>`;
    }).join("") + `</div>`;
  } else if (q.y === "order") {
    body = `<ol class="order">` + q.order.map((src, pos) => {
      let cls = "orow";
      if (fb) cls += src === pos ? " good" : " bad";
      if (!q.answered && q.cursor === pos) cls += " cur";
      return `<li class="${cls}" draggable="${!q.answered}" data-pos="${pos}"><span class="num">${pos + 1}</span><span class="ot">${esc(q.v.o[src])}</span>
        ${q.answered ? (fb && src !== pos ? `<span class="should">should be #${src + 1}</span>` : "") : `<span class="mv"><button data-act="mv" data-arg="${pos},-1" aria-label="Move up" ${pos === 0 ? "disabled" : ""}>▲</button><button data-act="mv" data-arg="${pos},1" aria-label="Move down" ${pos === q.order.length - 1 ? "disabled" : ""}>▼</button></span>`}</li>`;
    }).join("") + `</ol>`;
  } else if (q.y === "match") {
    body = `<div class="match">` + q.v.p.map((pair, i) => {
      let cls = "mrow";
      if (fb) cls += q.match[i] === i ? " good" : " bad";
      const opts = q.rights.map(ri => `<option value="${ri}" ${q.match[i] === ri ? "selected" : ""}>${esc(q.v.p[ri][1])}</option>`).join("");
      return `<div class="${cls}"><div class="ml">${esc(pair[0])}</div><select data-match="${i}" ${q.answered ? "disabled" : ""} aria-label="Match for ${esc(pair[0])}"><option value="-1">Choose…</option>${opts}</select>
        ${fb && q.match[i] !== i ? `<div class="should">✓ ${esc(pair[1])}</div>` : ""}</div>`;
    }).join("") + `</div>`;
  }
  let foot = "";
  if (!q.answered) {
    const ready = answeredEnough(q);
    foot = ctx.mode === "exam"
      ? ""
      : `<div class="submit"><button class="btn pri" data-act="submit" data-arg="1" ${ready ? "" : "disabled"}>Submit · I'm sure <kbd>Enter</kbd></button><button class="btn" data-act="submit" data-arg="0" ${ready ? "" : "disabled"}>Submit · not sure <kbd>⇧ Enter</kbd></button></div>`;
  } else if (fb) {
    const verdict = q.ok ? (q.sure ? "Correct" : "Correct, but you weren't sure. Read the why below.") : (q.sure ? "Wrong, and you were sure. That's a misconception. Read this carefully." : "Not quite");
    foot = `<div class="fb ${q.ok ? "ok" : "no"}"><b>${q.ok ? "✓" : "✗"} ${verdict}</b><p>${esc(q.e)}</p>${refHtml(q)}</div>`;
  }
  return `<div class="q" id="qcard"><div class="qmeta">${ctx.mode === "exam" ? "<span></span>" : `<span class="tag">${OBJ[FAM[q.fam].o].icon} ${esc(OBJ[FAM[q.fam].o].short)}</span>`}<span class="hint">${typeHint(q)}</span></div>
    <div class="qt">${esc(q.v.q)}</div>${body}${foot}</div>`;
}

/* ───────────── active question plumbing ───────────── */
let CUR = null; // {q, ctx, onSubmit, repaint}
function mountQ(q, ctx, el, onSubmit) {
  CUR = { q, ctx, el, onSubmit };
  paintQ();
}
function paintQ() {
  if (!CUR) return;
  CUR.el.innerHTML = qHtml(CUR.q, CUR.ctx);
  if (CUR.q.y === "order" && !CUR.q.answered) wireDrag();
  if (CUR.after) CUR.after();
}
function wireDrag() {
  let from = null;
  CUR.el.querySelectorAll(".orow").forEach(li => {
    li.addEventListener("dragstart", e => { from = +li.dataset.pos; li.classList.add("drag"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(from)); } catch (x) {} });
    li.addEventListener("dragend", () => li.classList.remove("drag"));
    li.addEventListener("dragover", e => { e.preventDefault(); li.classList.add("over"); });
    li.addEventListener("dragleave", () => li.classList.remove("over"));
    li.addEventListener("drop", e => {
      e.preventDefault(); const to = +li.dataset.pos; if (from === null || from === to) return;
      const o = CUR.q.order, [m] = o.splice(from, 1); o.splice(to, 0, m); CUR.q.cursor = to; paintQ();
    });
  });
}
function qPick(d) {
  const q = CUR.q; if (q.answered) return;
  d = +d; q.cursor = d;
  if (q.y === "multi") { q.sel = q.sel.includes(d) ? q.sel.filter(x => x !== d) : [...q.sel, d]; }
  else q.sel = [d];
  paintQ();
  if (CUR.ctx.mode === "exam" && CUR.onChange) CUR.onChange();
}
function qMove(pos, dir) {
  const q = CUR.q; if (q.answered) return;
  const o = q.order, to = pos + dir; if (to < 0 || to >= o.length) return;
  [o[pos], o[to]] = [o[to], o[pos]]; q.cursor = to; paintQ();
}
function qSubmit(sure) {
  const q = CUR.q; if (q.answered || !answeredEnough(q)) return;
  q.sure = !!sure; q.answered = true; q.ok = grade(q);
  if (CUR.onSubmit) CUR.onSubmit(q);
  paintQ();
  const fb = document.querySelector(".fb"); if (fb) fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ───────────── shell ───────────── */
function setTheme(t) {
  if (t) S.theme = t; save();
  document.documentElement.setAttribute("data-theme", S.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
}
function header() {
  const r = pct(readiness());
  $("#rpill").innerHTML = `<span class="rl">Readiness </span>${r}%`;
  $("#rpill").className = "pill " + (r >= 85 ? "ok" : r >= 50 ? "mid" : "");
}
function ring(v, size = 54, label) {
  const R = size / 2 - 5, C = 2 * Math.PI * R, off = C * (1 - v);
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-label="${label || pct(v) + "%"}"><circle cx="${size / 2}" cy="${size / 2}" r="${R}" class="rb"/><circle cx="${size / 2}" cy="${size / 2}" r="${R}" class="rf" style="stroke-dasharray:${C};stroke-dashoffset:${off}"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle">${pct(v)}</text></svg>`;
}
function bar(v) { return `<div class="bar"><i style="width:${Math.max(2, pct(v))}%"></i></div>`; }

/* ───────────── router ───────────── */
const routes = {};
function go(h) { if (location.hash === h) route(); else location.hash = h; }
function route() {
  CUR = null; clearInterval(EXAM.timer);
  const [, view, arg] = (location.hash || "#/home").split("/");
  (routes[view] || routes.home)(arg);
  header(); window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* ───────────── home ───────────── */
function nextStep() {
  const todo = OBJECTIVES.find(o => !S.lessons[o.id]);
  const weakest = OBJECTIVES.slice().sort((a, b) => objScore(a.id) - objScore(b.id))[0];
  const mis = QB.filter(f => fstat(f.id).mis).length;
  if (todo && Object.keys(S.lessons).length < 2) return { t: `Start with Lesson ${todo.id.slice(1)}: ${todo.name}`, d: "Teach first, test second. Each lesson ends with a quick check.", h: `#/learn/${todo.id}`, b: "Start lesson" };
  if (mis) return { t: `Fix ${mis} misconception${mis > 1 ? "s" : ""}`, d: "These are facts you were sure about but got wrong. They get top priority in the drill.", h: "#/drill/mis", b: "Drill misconceptions" };
  if (todo) return { t: `Next lesson: ${todo.name}`, d: `${OBJECTIVES.filter(o => S.lessons[o.id]).length} of 10 lessons done.`, h: `#/learn/${todo.id}`, b: "Continue" };
  if (readiness() < 0.85) return { t: `Raise your weakest area: ${weakest.name} (${pct(objScore(weakest.id))}%)`, d: "The smart drill rotates wordings, so you prove understanding instead of recognition.", h: `#/drill/${weakest.id}`, b: "Drill it" };
  return { t: "You look ready. Prove it under exam conditions.", d: "Pass the Ace Check at 85%+ twice and you're exam-ready on this domain.", h: "#/exam", b: "Take the Ace Check" };
}
routes.home = () => {
  const r = readiness(), ns = nextStep(), cal = calibration();
  const best = S.exams.length ? Math.max(...S.exams.map(e => e.score)) : null;
  const aces = S.exams.filter(e => e.score >= 85).length;
  app().innerHTML = `
  <section class="hero">
    <div class="hl">
      <div class="eyebrow">CyberArk PAM-DEF · Configure User Management</div>
      <h1>From 0% to exam-ready on User Management.</h1>
      <p class="sub">10 lessons, ${QB.length} facts tested in ${VARIANT_COUNT} different wordings, 12 hands-on lab missions in simulated PrivateArk and PVWA screens, and an exam simulator. Every answer is checked against the official CyberArk docs.</p>
    </div>
    <div class="hr">${ring(r, 112, "Overall readiness")}<div class="mut sm">overall readiness</div></div>
  </section>
  ${syncCard()}
  <div class="card next"><div><div class="eyebrow">Your next best step</div><b>${esc(ns.t)}</b><div class="mut sm">${esc(ns.d)}</div></div><a class="btn pri" href="${ns.h}">${esc(ns.b)} →</a></div>
  <div class="modes">
    <a class="mode" href="#/learn"><span class="ic">📘</span><b>Learn</b><small>${Object.keys(S.lessons).length}/10 lessons · teach first, then check</small></a>
    <a class="mode" href="#/drill"><span class="ic">🎯</span><b>Smart Drill</b><small>${masteredCount()}/${QB.length} facts mastered · wording rotates</small></a>
    <a class="mode" href="#/lab"><span class="ic">🧪</span><b>Lab Missions</b><small>${Object.keys(S.lab).length}/${MISSIONS.length} done · click through simulated PrivateArk & PVWA</small></a>
    <a class="mode" href="#/exam"><span class="ic">🏁</span><b>Ace Check</b><small>${best === null ? "30 Q · 40 min · no hints" : `best ${best}% · ${aces}/2 aces toward exam-ready`}</small></a>
  </div>
  <div class="card"><div class="ch"><h2>Mastery map</h2><a class="lnk" href="#/sheet">Cheat sheet →</a></div>
    ${OBJECTIVES.map(o => {
      const sc = objScore(o.id), done = S.lessons[o.id], m = BYOBJ[o.id].filter(f => isMastered(f.id)).length;
      return `<div class="trow"><span class="oic">${o.icon}</span><div class="tname"><b>${esc(o.name)}</b><div class="mut xs">${done ? "Lesson done" : "Lesson not started"} · ${m}/${BYOBJ[o.id].length} facts mastered</div>${bar(sc)}</div>
      <span class="tp">${pct(sc)}%</span><a class="tbtn" href="#/learn/${o.id}">${done ? "Review" : "Learn"}</a><a class="tbtn" href="#/drill/${o.id}">Drill</a></div>`;
    }).join("")}
  </div>
  <div class="grid2">
    <div class="card"><h2>Confidence check</h2>${cal.sure + cal.uns < 5 ? `<p class="mut">Answer a few questions first. Every answer asks whether you're sure, so you'll learn whether your confidence is earned.</p>` :
      `<div class="calrow"><span>When you're <b>sure</b></span>${bar(cal.sureAcc || 0)}<b>${cal.sureAcc === null ? "–" : pct(cal.sureAcc) + "%"}</b></div>
       <div class="calrow"><span>When you're <b>not sure</b></span>${bar(cal.unsAcc || 0)}<b>${cal.unsAcc === null ? "–" : pct(cal.unsAcc) + "%"}</b></div>
       <p class="mut sm">${cal.sureAcc !== null && cal.sureAcc >= 0.9 ? "Your confidence is earned. When you're sure, trust it on exam day." : "Aim for 90%+ when you're sure. Each \"sure but wrong\" answer is a misconception the drill will chase down."}</p>`}</div>
    <div class="card"><h2>How mastery works</h2><p class="mut sm">A fact counts as <b>mastered</b> after three confident correct answers in a row, in at least <b>two different wordings</b>. That's what beats paraphrased exam questions. A miss drops it back to zero, and the drill brings it back in new words a few questions later.</p></div>
  </div>`;
};

function syncCard() {
  if (!window.SYNC || !SYNC.ready) return "";
  if (SYNC.user) return `<div class="syncline"><span>☁</span><span data-sync-status>${esc(SYNC.statusText())}</span></div>`;
  const has = Object.keys(S.f).length + Object.keys(S.lessons).length + Object.keys(S.lab).length + S.exams.length;
  return `<div class="card signin"><div><b>${has ? "Don't lose your progress" : "Keep your progress on every device"}</b>
    <div class="mut sm">Sign in with a free Puter account (the same one the PAM-DEF Trainer uses) and your lessons, mastery and exam history follow you to your phone and any computer. ${has ? "Everything you've done on this device so far is kept and uploaded." : ""}</div></div>
    <button class="btn pri" data-act="acct">Sign in to save progress</button></div>`;
}

/* ───────────── learn ───────────── */
routes.learn = (oid) => { if (oid && LESSONS[oid]) return lesson(oid); learnIndex(); };
function learnIndex() {
  app().innerHTML = `<div class="crumb"><a href="#/home">Home</a> › Learn</div><h1>Lessons</h1><p class="sub">Each lesson teaches first: concept cards, exam traps, a say-it-out-loud prompt, then a short check. About 70 minutes for all ten.</p>
  <div class="lessons">${OBJECTIVES.map((o, i) => `<a class="lcard ${S.lessons[o.id] ? "done" : ""}" href="#/learn/${o.id}"><span class="ln">${i + 1}</span><span class="li">${o.icon}</span><b>${esc(o.name)}</b><small>${LESSONS[o.id].mins} min · ${LESSONS[o.id].cards.length} cards ${S.lessons[o.id] ? "· ✓ done" : ""}</small></a>`).join("")}</div>`;
}
let L = null; // lesson runner
function lesson(oid) {
  const Ls = LESSONS[oid];
  const fams = shuffle(BYOBJ[oid]).slice(0, 3);
  L = { oid, steps: [], i: 0, checks: [], score: 0 };
  Ls.cards.forEach(c => L.steps.push({ k: "card", c }));
  L.steps.push({ k: "traps" });
  Ls.say.forEach(s => L.steps.push({ k: "say", s, open: false }));
  fams.forEach(f => L.steps.push({ k: "check", fam: f.id }));
  L.steps.push({ k: "done" });
  paintLesson();
}
function paintLesson() {
  const o = OBJ[L.oid], Ls = LESSONS[L.oid], st = L.steps[L.i], n = L.steps.length;
  const dots = L.steps.map((s, i) => `<i class="${i < L.i ? "p" : i === L.i ? "c" : ""} k-${s.k}"></i>`).join("");
  let body = "", nav = "";
  if (st.k === "card") {
    body = `${L.i === 0 ? `<p class="intro">${Ls.intro}</p>` : ""}<div class="card lesson"><h2>${esc(st.c.h)}</h2><div class="lc">${st.c.html}</div></div>`;
  } else if (st.k === "traps") {
    body = `<div class="card lesson trapcard"><h2>⚠️ Exam traps</h2><ul class="traps">${Ls.traps.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>`;
  } else if (st.k === "say") {
    body = `<div class="card lesson"><div class="eyebrow">Say it out loud</div><h2>${esc(st.s.q)}</h2><p class="mut sm">Explain it out loud as if teaching a colleague, then reveal the model answer. Explaining builds far stronger recall than re-reading.</p>
      ${st.open ? `<div class="model"><b>Model answer</b><p>${esc(st.s.a)}</p></div>` : `<button class="btn" data-act="reveal">Reveal model answer</button>`}</div>`;
  } else if (st.k === "check") {
    const ci = L.steps.slice(0, L.i).filter(s => s.k === "check").length + 1;
    body = `<div class="eyebrow">Quick check ${ci}/3</div><div id="lq"></div>`;
  } else {
    const nC = L.steps.filter(s => s.k === "check").length;
    body = `<div class="card lesson donecard"><div class="big">🎉</div><h2>Lesson complete: ${esc(o.name)}</h2><p class="mut">Quick check: ${L.score}/${nC}. These facts are now in your drill rotation.</p>
      <h3>Key points</h3><ul class="keys">${Ls.key.map(k => `<li>${esc(k)}</li>`).join("")}</ul>
      <div class="row"><a class="btn pri" href="#/drill/${L.oid}">Drill this topic →</a>${nextLessonBtn()}</div></div>`;
    if (!S.lessons[L.oid]) { S.lessons[L.oid] = now(); save(); }
  }
  if (st.k !== "done") {
    const blocked = st.k === "check" && !(L.steps[L.i].q && L.steps[L.i].q.answered);
    nav = `<div class="lnav"><button class="btn" data-act="lprev" ${L.i === 0 ? "disabled" : ""}>← Back</button><button class="btn pri" data-act="lnext" ${blocked ? "disabled" : ""}>${st.k === "check" ? "Continue" : "Next"} <kbd>Enter</kbd></button></div>`;
  }
  app().innerHTML = `<div class="crumb"><a href="#/home">Home</a> › <a href="#/learn">Learn</a> › Lesson ${L.oid.slice(1)}</div>
    <div class="lhead"><h1>${o.icon} ${esc(o.name)}</h1><div class="dots" aria-label="Step ${L.i + 1} of ${n}">${dots}</div></div>${body}${nav}`;
  if (st.k === "check") {
    if (!st.q) st.q = makeQ(st.fam, 0);
    mountQ(st.q, { mode: "lesson", feedback: true }, $("#lq"), q => { record(q.fam, q.vi, q.ok, q.sure); if (q.ok) L.score++; const b = $('[data-act="lnext"]'); if (b) b.disabled = false; });
    CUR.after = () => { const b = $('[data-act="lnext"]'); if (b) b.disabled = !st.q.answered; };
  }
}
function nextLessonBtn() {
  const i = OBJECTIVES.findIndex(o => o.id === L.oid), nx = OBJECTIVES[i + 1];
  return nx ? `<a class="btn" href="#/learn/${nx.id}">Next lesson: ${esc(nx.short)} →</a>` : `<a class="btn" href="#/exam">Take the Ace Check →</a>`;
}

/* ───────────── drill ───────────── */
let D = null;
routes.drill = (arg) => {
  D = { filter: arg || "all", n: 0, ok: 0, recent: [], requeue: [], q: null, size: 12, misses: [] };
  drillNext();
};
function drillPool() {
  if (D.filter === "mis") { const m = QB.filter(f => fstat(f.id).mis); return m.length ? m : QB; }
  if (OBJ[D.filter]) return BYOBJ[D.filter];
  return QB;
}
function drillPick() {
  const due = D.requeue.find(r => r.at <= D.n);
  if (due) { D.requeue = D.requeue.filter(r => r !== due); return { id: due.id, avoid: due.vi }; }
  const pool = drillPool();
  const t = now();
  const scored = pool.filter(f => !D.recent.includes(f.id) || pool.length <= D.recent.length).map(f => {
    const s = fstat(f.id);
    let w = Math.random() * 1.5;
    if (s.n === 0) w += 3;
    if (s.mis) w += 5;
    w += (3 - Math.min(s.box, 3)) * 1.6;
    if (isMastered(f.id)) w -= 2.5;
    w += Math.min(3, (t - s.lastTs) / 36e5 / 8);     // up to +3 for ~a day unseen
    return { f, w };
  }).sort((a, b) => b.w - a.w);
  const f = (scored[0] || { f: pool[0] }).f;
  return { id: f.id, avoid: fstat(f.id).lastV };
}
function drillNext() {
  if (D.n >= D.size) return drillSummary();
  const p = drillPick(), f = FAM[p.id];
  D.q = makeQ(p.id, pickVariant(f, p.avoid));
  D.recent = [p.id, ...D.recent].slice(0, 5);
  const label = D.filter === "all" ? "All topics" : D.filter === "mis" ? "Misconceptions" : OBJ[D.filter].name;
  app().innerHTML = `<div class="crumb"><a href="#/home">Home</a> › Smart Drill</div>
    <div class="dhead"><div><h1>Smart Drill</h1><div class="mut sm">${esc(label)} · question ${D.n + 1} of ${D.size} · ${D.ok} correct</div></div>
    <select id="dfilter" aria-label="Drill topic"><option value="all">All topics</option><option value="mis">Misconceptions only</option>${OBJECTIVES.map(o => `<option value="${o.id}" ${D.filter === o.id ? "selected" : ""}>${o.icon} ${esc(o.name)}</option>`).join("")}</select></div>
    ${bar(D.n / D.size)}<div id="dq"></div><div class="lnav" id="dnav" hidden><span class="mut sm" id="dmsg"></span><button class="btn pri" data-act="dnext">Next question <kbd>Enter</kbd></button></div>`;
  const sel = $("#dfilter"); if (D.filter === "mis") sel.value = "mis";
  sel.onchange = () => go("#/drill/" + sel.value);
  mountQ(D.q, { mode: "drill", feedback: true }, $("#dq"), q => {
    record(q.fam, q.vi, q.ok, q.sure);
    D.n++; if (q.ok) D.ok++;
    if (!q.ok) {
      D.misses.push(q.fam);
      D.requeue.push({ id: q.fam, vi: q.vi, at: D.n + 3 });
      if (D.size - D.n < 4) D.size = Math.min(D.size + 2, 20);
    }
    $("#dnav").hidden = false;
    $("#dmsg").textContent = !q.ok ? "This fact comes back in different words in a few questions." : isMastered(q.fam) ? "★ Mastered." : "";
  });
}
function drillSummary() {
  const acc = D.n ? D.ok / D.n : 0;
  app().innerHTML = `<div class="crumb"><a href="#/home">Home</a> › Smart Drill</div><div class="card lesson donecard"><div class="big">${acc >= 0.85 ? "🔥" : acc >= 0.6 ? "💪" : "🧠"}</div>
    <h2>Round complete: ${D.ok}/${D.n} (${pct(acc)}%)</h2><p class="mut">Overall readiness is now <b>${pct(readiness())}%</b>, with ${masteredCount()}/${QB.length} facts mastered.</p>
    ${D.misses.length ? `<h3>Review these</h3><ul class="keys">${[...new Set(D.misses)].map(id => `<li>${esc(FAM[id].e)}</li>`).join("")}</ul>` : ""}
    <div class="row"><button class="btn pri" data-act="dagain">Another round →</button><a class="btn" href="#/home">Home</a></div></div>`;
}

/* ───────────── exam (Ace Check) ───────────── */
const EXAM = { timer: null };
routes.exam = (arg) => { if (arg === "run" && EXAM.qs) return examPaint(); examSetup(); };
function examSetup() {
  const hist = S.exams.slice(-5).reverse();
  app().innerHTML = `<div class="crumb"><a href="#/home">Home</a> › Ace Check</div><h1>🏁 Ace Check</h1>
  <p class="sub">Exam conditions: <b>30 questions</b>, <b>40 minutes</b> (the real exam's pace), 3 per topic, no feedback until the end. Wording is drawn at random from ${VARIANT_COUNT} variants, so memorized wording won't help.</p>
  <div class="card"><label class="chk"><input type="checkbox" id="nolab" ${S.noLabels !== false ? "checked" : ""}> Hide answer numbers (removes position cues)</label>
  <label class="chk"><input type="checkbox" id="timed" ${S.untimed ? "" : "checked"}> Timed (40 min)</label>
  <p class="mut sm">Pass line 70%. <b>Ace = 85%+</b>. Two aces mark you exam-ready on this domain.</p><button class="btn pri" data-act="estart">Start the Ace Check →</button></div>
  ${hist.length ? `<div class="card"><h2>Recent attempts</h2>${hist.map(e => `<div class="trow"><div class="tname"><b>${e.score}%</b> <span class="mut xs">${new Date(e.when).toLocaleString()}</span>${bar(e.score / 100)}</div><span class="tag">${e.score >= 85 ? "ACE" : e.score >= 70 ? "PASS" : "FAIL"}</span></div>`).join("")}</div>` : ""}`;
}
function examStart() {
  S.noLabels = $("#nolab").checked; S.untimed = !$("#timed").checked; save();
  const qs = [];
  OBJECTIVES.forEach(o => shuffle(BYOBJ[o.id]).slice(0, 3).forEach(f => qs.push(makeQ(f.id, Math.floor(Math.random() * f.v.length)))));
  EXAM.qs = shuffle(qs); EXAM.i = 0; EXAM.flag = {}; EXAM.end = S.untimed ? null : now() + 40 * 60 * 1000; EXAM.done = false;
  go("#/exam/run");
}
function examPaint() {
  const q = EXAM.qs[EXAM.i], n = EXAM.qs.length;
  const answered = EXAM.qs.filter(x => answeredEnough(x) && x.touched).length;
  app().innerHTML = `<div class="ehead"><div><b>Question ${EXAM.i + 1} / ${n}</b> <span class="mut sm">· ${answered} answered</span></div><div class="timer" id="etimer">${EXAM.end ? "" : "untimed"}</div></div>
  ${bar((EXAM.i + 1) / n)}<div id="eq"></div>
  <div class="conf"><span class="mut sm">How sure are you?</span><button class="seg ${q.sure !== false ? "on" : ""}" data-act="esure" data-arg="1">Sure</button><button class="seg ${q.sure === false ? "on" : ""}" data-act="esure" data-arg="0">Not sure</button>
  <label class="chk sm"><input type="checkbox" id="eflag" ${EXAM.flag[EXAM.i] ? "checked" : ""}> Flag for review</label></div>
  <div class="lnav"><button class="btn" data-act="eprev" ${EXAM.i === 0 ? "disabled" : ""}>← Prev</button><button class="btn pri" data-act="enext">${EXAM.i === n - 1 ? "Review & finish" : "Next →"}</button></div>
  <div class="pal">${EXAM.qs.map((x, i) => `<button class="pq ${i === EXAM.i ? "c" : ""} ${answeredEnough(x) && x.touched ? "a" : ""} ${EXAM.flag[i] ? "f" : ""}" data-act="ejump" data-arg="${i}">${i + 1}</button>`).join("")}</div>`;
  mountQ(q, { mode: "exam", feedback: false }, $("#eq"), null);
  CUR.onChange = () => { q.touched = true; };
  CUR.after = () => { if (q.y !== "mc" && q.y !== "multi" && q.y !== "tf") q.touched = true; };
  $("#eflag").onchange = e => { EXAM.flag[EXAM.i] = e.target.checked; };
  tick(); clearInterval(EXAM.timer); EXAM.timer = setInterval(tick, 1000);
}
function tick() {
  if (!EXAM.end) return;
  const left = Math.max(0, EXAM.end - now()), m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
  const el = $("#etimer"); if (el) { el.textContent = `${m}:${String(s).padStart(2, "0")} left`; el.classList.toggle("low", left < 5 * 60000); }
  if (left <= 0) examFinish(true);
}
function examReview() {
  const un = EXAM.qs.map((x, i) => (!answeredEnough(x) || !x.touched) ? i + 1 : null).filter(Boolean);
  const fl = Object.keys(EXAM.flag).filter(k => EXAM.flag[k]).map(k => +k + 1);
  app().innerHTML = `<div class="card lesson"><h2>Ready to submit?</h2>
  <p>${un.length ? `<b>${un.length} unanswered:</b> ${un.join(", ")}` : "All questions answered."}</p>${fl.length ? `<p>Flagged: ${fl.join(", ")}</p>` : ""}
  <div class="pal">${EXAM.qs.map((x, i) => `<button class="pq ${answeredEnough(x) && x.touched ? "a" : ""} ${EXAM.flag[i] ? "f" : ""}" data-act="ejump" data-arg="${i}">${i + 1}</button>`).join("")}</div>
  <div class="row"><button class="btn" data-act="ejump" data-arg="${un.length ? un[0] - 1 : 0}">Keep reviewing</button><button class="btn pri" data-act="efinish">Submit Ace Check</button></div></div>`;
}
function examFinish(timeout) {
  if (EXAM.done) return; EXAM.done = true; clearInterval(EXAM.timer);
  const qs = EXAM.qs, byObj = {};
  let correct = 0; const cal = { sc: 0, sw: 0, uc: 0, uw: 0 };
  qs.forEach(q => {
    const taken = answeredEnough(q) && q.touched;
    q.answered = true; q.ok = taken ? grade(q) : false; if (q.sure === undefined) q.sure = true;
    if (q.ok) correct++;
    const o = FAM[q.fam].o; byObj[o] = byObj[o] || { c: 0, n: 0 }; byObj[o].n++; if (q.ok) byObj[o].c++;
    if (taken) { record(q.fam, q.vi, q.ok, q.sure !== false); cal[(q.sure !== false ? "s" : "u") + (q.ok ? "c" : "w")]++; }
  });
  const score = Math.round(correct / qs.length * 100);
  S.exams.push({ when: now(), score, n: qs.length, correct, byObj, cal, timeout: !!timeout }); save();
  const aces = S.exams.filter(e => e.score >= 85).length;
  const surePct = (cal.sc + cal.sw) ? pct(cal.sc / (cal.sc + cal.sw)) : null;
  app().innerHTML = `<div class="crumb"><a href="#/home">Home</a> › Ace Check results</div>
  <div class="card lesson donecard"><div class="big">${score >= 85 ? "🏆" : score >= 70 ? "✅" : "📚"}</div><h2>${score}% · ${correct}/${qs.length}${timeout ? " (time ran out)" : ""}</h2>
  <p class="mut">${score >= 85 ? `Ace! ${aces >= 2 ? "That's two aces. You're exam-ready on User Management. Keep it fresh with a drill round every few days." : "One more ace marks you exam-ready."}` : score >= 70 ? "That's a pass, but aim for 85% so exam-day nerves can't sink you." : "Not yet. Drill the weakest topics below, then try again. Each attempt uses new wordings."}</p>
  ${surePct !== null ? `<p class="mut sm">When you said <b>sure</b>, you were right <b>${surePct}%</b> of the time.${cal.sw ? ` ${cal.sw} sure-but-wrong answer${cal.sw > 1 ? "s" : ""} added to your misconceptions drill.` : ""}</p>` : ""}</div>
  <div class="card"><h2>By topic</h2>${OBJECTIVES.map(o => { const b = byObj[o.id] || { c: 0, n: 0 }; return `<div class="trow"><span class="oic">${o.icon}</span><div class="tname"><b>${esc(o.name)}</b>${bar(b.n ? b.c / b.n : 0)}</div><span class="tp">${b.c}/${b.n}</span>${b.c < b.n ? `<a class="tbtn" href="#/drill/${o.id}">Drill</a>` : ""}</div>`; }).join("")}</div>
  <div class="card"><h2>Answer review</h2><div id="erev"></div></div>`;
  const wrap = $("#erev");
  wrap.innerHTML = qs.map((q, i) => `<div class="rev ${q.ok ? "ok" : "no"}"><div class="mut xs">Q${i + 1} · ${q.ok ? "✓ correct" : "✗ missed"}${q.sure === false ? " · not sure" : ""}</div>${qHtml(q, { mode: "review", feedback: true })}</div>`).join("");
}

/* ───────────── cheat sheet ───────────── */
routes.sheet = () => {
  app().innerHTML = `<div class="crumb noprint"><a href="#/home">Home</a> › Cheat sheet</div>
  <div class="sheethead"><h1>User Management: the one-page cheat sheet</h1><button class="btn noprint" data-act="print">🖨 Print / save PDF</button></div>
  <p class="sub">Every key point from the ten lessons. Read it the night before and again in the morning.</p>
  <div class="sheet">${OBJECTIVES.map(o => `<div class="scard"><h3>${o.icon} ${esc(o.name)}</h3><ul>${LESSONS[o.id].key.map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>`).join("")}</div>
  <div class="card lesson">${LESSONS.O3.cards[1].html}</div>`;
};

/* ───────────── lab routes (engine in lab.js) ───────────── */
routes.lab = (mid) => { if (mid) return LAB.open(mid); LAB.index(); };

/* ───────────── about / reset ───────────── */
routes.about = () => {
  app().innerHTML = `<div class="crumb"><a href="#/home">Home</a> › About</div><h1>About this lab</h1>
  <div class="card lesson"><p>Built by <b>M. Hasan Zafar</b> to master the <b>Configure User Management</b> content area of the CyberArk Defender – PAM (PAM-DEF) exam.</p>
  <p>Every fact was checked against the official <a href="https://docs.cyberark.com/pam-self-hosted/latest/en/content/landing%20pages/lpusermanagement.htm" target="_blank" rel="noopener">PAM Self-Hosted documentation</a>. Each question links to the page that proves its answer. The lab screens are simplified simulations modeled on the documented PrivateArk Client and PVWA screens. They aren't CyberArk software.</p>
  <p>This is an independent study aid, not affiliated with or endorsed by CyberArk.</p>
  <p class="mut sm">${QB.length} fact families · ${VARIANT_COUNT} question variants · ${MISSIONS.length} lab missions.</p></div>
  <div class="card lesson"><h2>Your progress</h2><p data-sync-status>${esc(window.SYNC ? SYNC.statusText() : "Progress is saved on this device.")}</p>
  ${window.SYNC && SYNC.ready ? `<div class="row"><button class="btn ${SYNC.user ? "" : "pri"}" data-act="acct">${SYNC.user ? "Sign out" : "Sign in to sync"}</button>${SYNC.user ? `<button class="btn" data-act="syncnow">Sync now</button>` : ""}</div>` : `<p class="mut sm">Sign-in isn't available right now (offline or blocked). Use Export to keep a backup.</p>`}
  <div class="row"><button class="btn" data-act="export">Export progress</button><button class="btn" data-act="import">Import progress</button><button class="btn danger" data-act="reset">Reset all progress</button></div></div>`;
};

/* ───────────── actions ───────────── */
const ACT = {
  pick: a => qPick(a),
  mv: a => { const [p, d] = a.split(",").map(Number); qMove(p, d); },
  submit: a => qSubmit(a === "1"),
  reveal: () => { L.steps[L.i].open = true; paintLesson(); },
  lnext: () => { const st = L.steps[L.i]; if (st.k === "check" && !(st.q && st.q.answered)) return; L.i = Math.min(L.steps.length - 1, L.i + 1); CUR = null; paintLesson(); window.scrollTo(0, 0); },
  lprev: () => { L.i = Math.max(0, L.i - 1); CUR = null; paintLesson(); },
  dnext: () => drillNext(),
  dagain: () => routes.drill(D.filter),
  estart: () => examStart(),
  esure: a => { EXAM.qs[EXAM.i].sure = a === "1"; document.querySelectorAll(".seg").forEach(b => b.classList.toggle("on", b.dataset.arg === a)); },
  enext: () => { if (EXAM.i === EXAM.qs.length - 1) return examReview(); EXAM.i++; examPaint(); },
  eprev: () => { EXAM.i = Math.max(0, EXAM.i - 1); examPaint(); },
  ejump: a => { EXAM.i = +a; examPaint(); },
  efinish: () => examFinish(false),
  print: () => window.print(),
  theme: () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"),
  acct: () => { if (!window.SYNC) return; SYNC.user ? SYNC.signOut() : SYNC.signIn(); },
  syncnow: () => { SYNC.syncNow().then(() => SYNC.paint()); },
  reset: async () => {
    const signed = window.SYNC && SYNC.user;
    if (!confirm(signed ? "Erase all progress on this device AND in your account? This cannot be undone." : "Erase all progress in this browser? This cannot be undone.")) return;
    if (signed) await SYNC.wipe();
    localStorage.removeItem(LSKEY); location.hash = "#/home"; location.reload();
  },
  export: () => {
    const blob = new Blob([JSON.stringify(S)], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "user-management-lab-progress.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  import: () => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json,.json";
    inp.onchange = () => { const fr = new FileReader(); fr.onload = () => { try { const d = JSON.parse(fr.result); if (!d || typeof d !== "object" || !d.f) throw 0; S = mergeProgress(S, d); normalizeState(); save(); alert("Progress imported and merged with this device."); go("#/home"); } catch (e) { alert("That file isn't a progress export."); } }; fr.readAsText(inp.files[0]); };
    inp.click();
  }
};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act] || (window.LAB && LAB.act[el.dataset.act]);
  if (fn) { if (el.tagName !== "INPUT") e.preventDefault(); fn(el.dataset.arg, el, e); }
});
document.addEventListener("change", e => {
  const s = e.target.closest("select[data-match]"); if (!s || !CUR) return;
  CUR.q.match[+s.dataset.match] = +s.value; CUR.q.touched = true;
  const ready = answeredEnough(CUR.q); document.querySelectorAll('[data-act="submit"]').forEach(b => b.disabled = !ready);
});

/* Keyboard: digits pick, arrows move the cursor, space toggles, Enter submits as sure,
   Shift+Enter submits as not sure, Enter again moves on. Buttons with focus keep
   their native behavior so a keypress never fires twice. */
document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target.tagName || "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (tag === "SELECT" && e.key !== "Enter") return;
  if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
  if (window.LAB && LAB.active && LAB.key(e)) return;
  const q = CUR && CUR.q;
  if (q && !q.answered) {
    const n = q.y === "tf" ? 2 : q.y === "order" ? q.order.length : q.y === "match" ? 0 : q.v.o.length;
    if (/^[1-9]$/.test(e.key) && +e.key <= n && q.y !== "order") { e.preventDefault(); qPick(+e.key - 1); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!n) return; e.preventDefault(); q.cursor = (q.cursor + (e.key === "ArrowDown" ? 1 : n - 1)) % n; paintQ(); return;
    }
    if (e.key === " " && q.y !== "order" && q.y !== "match") { e.preventDefault(); qPick(q.cursor); return; }
    if (e.key === "Enter" && CUR.ctx.mode !== "exam") { e.preventDefault(); qSubmit(!e.shiftKey); return; }
    if (e.key === "Enter" && CUR.ctx.mode === "exam") { e.preventDefault(); ACT.enext(); return; }
  }
  if (e.key === "Enter" || e.key === "ArrowRight") {
    const nx = $('[data-act="lnext"]') || $('[data-act="dnext"]');
    if (nx && !nx.disabled && (!$("#dnav") || !$("#dnav").hidden || nx.dataset.act === "lnext")) { e.preventDefault(); nx.click(); }
  }
  if (e.key === "ArrowLeft") { const pv = $('[data-act="lprev"]'); if (pv && !pv.disabled) { e.preventDefault(); pv.click(); } }
});

/* ───────────── boot ───────────── */
setTheme();
route();
if (window.SYNC) SYNC.init();
