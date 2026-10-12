/* Optional sign-in + cross-device progress sync, using Puter (free accounts, no
   server of our own). The SDK loads in the background; if it can't load (offline,
   blocked), the sign-in button stays hidden and the app keeps working local-only.

   Sync is merge-based, never overwrite-based: on sign-in and whenever the tab comes
   back into focus we read the cloud copy, merge it with this device, save locally and
   upload the merged result. Nothing either device learned is ever thrown away. */

const SYNC_KEY = "umlab_state_v1";

/* Merge two progress objects. Pure function: safe to unit-test, order-independent
   for everything that matters.
   - facts (f): the record with the most recent answer wins (it holds the current
     streak), but correct-wording history is unioned and counters take the max
   - lessons / lab: union, keeping the earliest completion time
   - exams: union by start time
   - confidence counters: one counter set per device, each only ever grows, so the
     merge is a per-device max (a grow-only counter) and totals are the sum */
function mergeProgress(a, b) {
  a = a || {}; b = b || {};
  const out = Object.assign({}, b, a);           // device-local settings (theme...) come from a
  out.f = {};
  for (const id of new Set([...Object.keys(a.f || {}), ...Object.keys(b.f || {})])) {
    const x = (a.f || {})[id], y = (b.f || {})[id];
    if (!x || !y) { out.f[id] = JSON.parse(JSON.stringify(x || y)); continue; }
    const win = (y.lastTs || 0) > (x.lastTs || 0) ? y : x;
    out.f[id] = Object.assign({}, win, {
      n: Math.max(x.n || 0, y.n || 0), c: Math.max(x.c || 0, y.c || 0),
      okV: [...new Set([...(x.okV || []), ...(y.okV || [])])].sort((p, q) => p - q)
    });
  }
  const unionMin = (p, q) => { const r = Object.assign({}, q || {}); for (const k in p || {}) r[k] = r[k] ? Math.min(r[k], p[k]) : p[k]; return r; };
  out.lessons = unionMin(a.lessons, b.lessons);
  out.lab = unionMin(a.lab, b.lab);
  const ex = new Map();
  [...(b.exams || []), ...(a.exams || [])].forEach(e => { if (e && e.when) ex.set(e.when, e); });
  out.exams = [...ex.values()].sort((p, q) => p.when - q.when).slice(-100);
  out.calDev = {};
  for (const d of new Set([...Object.keys(a.calDev || {}), ...Object.keys(b.calDev || {})])) {
    const x = (a.calDev || {})[d] || {}, y = (b.calDev || {})[d] || {};
    out.calDev[d] = { sc: Math.max(x.sc || 0, y.sc || 0), sw: Math.max(x.sw || 0, y.sw || 0), uc: Math.max(x.uc || 0, y.uc || 0), uw: Math.max(x.uw || 0, y.uw || 0) };
  }
  for (const k of ["f", "lessons", "lab", "calDev"]) out[k] = sortKeys(out[k]);
  return out;
}
const sortKeys = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});

const SYNC = (() => {
  let ready = false, user = null, timer = null, status = "local", lastAt = 0, pulledOK = false;
  const LOCAL_ONLY = ["theme"];                    // never uploaded: per-device preference

  function loadSdk() {
    return new Promise(res => {
      if (window.puter) return res(true);
      const s = document.createElement("script");
      s.src = "https://js.puter.com/v2/";
      s.onload = () => res(!!window.puter);
      s.onerror = () => res(false);
      document.head.appendChild(s);
      setTimeout(() => res(!!window.puter), 10000);
    });
  }
  function sharable() { const o = JSON.parse(JSON.stringify(S)); LOCAL_ONLY.forEach(k => delete o[k]); return o; }
  async function pull() {
    const raw = await puter.kv.get(SYNC_KEY);
    if (raw) {
      const remote = typeof raw === "string" ? JSON.parse(raw) : raw;
      S = mergeProgress(S, remote);
      normalizeState();
      saveLocal();
    }
    pulledOK = true;
  }
  async function push() {
    if (!user || !pulledOK) return;               // never upload before we've read the cloud copy
    status = "saving"; paint();
    try { await puter.kv.set(SYNC_KEY, JSON.stringify(sharable())); status = "synced"; lastAt = Date.now(); }
    catch (e) { status = "error"; }
    paint();
  }
  async function syncNow() {
    if (!user) return;
    try { await pull(); } catch (e) { status = "error"; paint(); return; }
    await push();
  }
  /* Called by save(): batch rapid answers into one upload. */
  function queue() {
    if (!user) return;
    clearTimeout(timer); status = "saving"; paint();
    timer = setTimeout(push, 1500);
  }
  function flush() { clearTimeout(timer); return push(); }
  /* After a merge, refresh what's on screen, but never yank the learner out of a
     question, lesson, exam or lab mission they're in the middle of. */
  function refreshView() {
    const parts = (location.hash || "#/home").split("/"), view = parts[1] || "home", deep = !!parts[2];
    if (["home", "about", "sheet"].includes(view) || (["learn", "lab"].includes(view) && !deep)) route(); else header();
  }
  async function init() {
    ready = await loadSdk();
    paint();
    if (!ready) return;
    try {
      if (puter.auth.isSignedIn()) {
        user = await puter.auth.getUser();
        await syncNow();
      }
    } catch (e) { status = "error"; }
    refreshView();                                  // shows the sign-in card / synced line now that we know
    paint();
  }
  async function signIn() {
    if (!ready) return;
    try {
      await puter.auth.signIn();                   // opens Puter's sign-in / create-account popup
      user = await puter.auth.getUser();
      await syncNow();
      refreshView();
    } catch (e) { /* popup closed or blocked */ }
    paint();
  }
  async function signOut() {
    if (!confirm("Sign out? Your progress stays saved in your account and on this device.")) return;
    await flush();
    try { puter.auth.signOut(); } catch (e) {}
    user = null; pulledOK = false; status = "local"; paint(); refreshView();
  }
  async function wipe() { clearTimeout(timer); try { await puter.kv.set(SYNC_KEY, "{}"); } catch (e) {} }
  function statusText() {
    if (!ready) return "Progress is saved on this device.";
    if (!user) return "Not signed in: progress is saved on this device only.";
    if (status === "saving") return `Saving to ${user.username}'s account…`;
    if (status === "error") return "Couldn't reach your account just now. Progress is safe on this device and will sync next time.";
    return `Synced to ${user.username}'s account${lastAt ? " · " + new Date(lastAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}.`;
  }
  function paint() {
    const b = document.getElementById("acct");
    if (b) {
      b.hidden = !ready;
      b.classList.toggle("on", !!user);
      b.innerHTML = user ? `<span class="ai">☁</span><span class="at">${esc(user.username)}</span>` : `<span class="ai">👤</span><span class="at">Sign in</span>`;
      b.title = user ? statusText() + " Click to sign out." : "Sign in (free) to keep your progress on every device";
    }
    document.querySelectorAll("[data-sync-status]").forEach(el => { el.textContent = statusText(); });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && user) syncNow().then(refreshView);
    if (document.visibilityState === "hidden" && user && timer) flush();
  });
  return { init, signIn, signOut, queue, flush, syncNow, wipe, statusText, paint, get ready() { return ready; }, get user() { return user; } };
})();
window.SYNC = SYNC;   // top-level const isn't a window property; app.js looks for window.SYNC
