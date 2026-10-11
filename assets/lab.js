/* Lab missions: a simplified simulation of the PrivateArk Client and the PVWA,
   modeled on the screens and paths described in the official documentation.
   Each mission seeds a state, the learner clicks through the real navigation
   path, and check() grades the resulting state (not the clicks). */

const AUTHS = ["AddSafes", "AuditUsers", "AddUpdateUsers", "ResetUsersPasswords", "ActivateUsers", "AddNetworkAreas", "ManageDirectoryMapping", "ManageServerFileCategories", "BackupAllSafes", "RestoreAllSafes"];
const AUTHNAME = { AddSafes: "Add Safes", AuditUsers: "Audit Users", AddUpdateUsers: "Add/Update Users", ResetUsersPasswords: "Reset Users' Passwords", ActivateUsers: "Activate Users", AddNetworkAreas: "Add Network Areas", ManageDirectoryMapping: "Manage Directory Mapping", ManageServerFileCategories: "Manage Server File Categories", BackupAllSafes: "Backup All Safes", RestoreAllSafes: "Restore All Safes" };
const UTYPES = { EPVUser: ["PVWA", "WINCLIENT", "PACLI", "PIMSU"], BizUser: ["PVWA"], PSMUser: ["PSM", "PVWA"] };
const AMETHODS = ["Password", "LDAP Authentication", "RADIUS Authentication", "PKI Authentication", "Windows Authentication"];
const PV_METHODS = ["cyberark", "ldap", "radius", "windows", "pki", "saml"];

function mkUser(name, loc, o) {
  return Object.assign({ name, loc, src: "CyberArk", type: "EPVUser", ifaces: UTYPES.EPVUser.slice(), disabled: false, gateway: false,
    auth: "Password", pwSet: true, mustChange: false, neverExpires: false, auths: [], logonAny: true, from: 0, to: 24, expires: "", history: 90,
    tna: [{ area: "All", active: true, from: 0, to: 24, maxv: 5, viol: 0 }] }, o || {});
}
function baseState() {
  return {
    vault: "CorpVault", who: "Administrator",
    users: [
      mkUser("Master", "\\", { auths: AUTHS.slice() }),
      mkUser("Administrator", "\\", { auths: AUTHS.slice() }),
      mkUser("Auditor", "\\", { disabled: true, pwSet: false }),
      mkUser("Operator", "\\", { disabled: true, pwSet: false }),
      mkUser("Backup", "\\", { disabled: true, pwSet: false }),
      mkUser("DR", "\\", { disabled: true, pwSet: false }),
      mkUser("Batch", "\\", { disabled: true, pwSet: false }),
      mkUser("bob", "\\IT"), mkUser("hd_jane", "\\IT"), mkUser("mike", "\\IT"),
      mkUser("ali_contractor", "\\Contractors"), mkUser("vendor_x", "\\Contractors"),
      mkUser("dana@corp.local", "\\", { src: "LDAP", auth: "LDAP Authentication" })
    ],
    groups: [
      { name: "Vault Admins", members: [{ k: "u", n: "Administrator" }] },
      { name: "Auditors", members: [{ k: "u", n: "Auditor" }] },
      { name: "Operators", members: [{ k: "u", n: "Operator" }] },
      { name: "Backup Users", members: [{ k: "u", n: "Backup" }] },
      { name: "DR Users", members: [{ k: "u", n: "DR" }] },
      { name: "PVWAMonitor", members: [] },
      { name: "PVWAUsers", members: [] },
      { name: "DB-Admins", members: [{ k: "u", n: "mike" }] }
    ],
    extGroups: ["CyberArk-Vault-Admins", "SOC-Auditors"],                       // LDAP groups already created in the Vault
    ad: ["CyberArk-Vault-Admins", "SOC-Auditors", "CyberArk-Users", "DBA-Team", "ServiceDesk", "Tier1-Support", "Finance-Users"],
    domain: { name: "corp.local", ssl: true },
    maps: [
      { name: "Vault Admins Mapping", ldap: "CyberArk-Vault-Admins", match: "Exact", type: "EPVUser", auth: "LDAP Authentication", auths: AUTHS.slice(), loc: "\\" },
      { name: "Vault Auditors Mapping", ldap: "SOC-Auditors", match: "Exact", type: "EPVUser", auth: "LDAP Authentication", auths: ["AuditUsers"], loc: "\\" },
      { name: "Vault Users Mapping", ldap: "CyberArk-Users", match: "Exact", type: "EPVUser", auth: "LDAP Authentication", auths: [], loc: "\\" }
    ],
    nets: [{ name: "All", level: "Low", gw: false, addrs: [{ kind: "Mask", ip: "0.0.0.0", mask: 0 }] }],
    pv: { cyberark: { Enabled: "Yes" }, ldap: { Enabled: "Yes" }, radius: { Enabled: "No" }, windows: { Enabled: "No" }, pki: { Enabled: "No" }, saml: { Enabled: "No" } },
    toast: ""
  };
}
const usr = (st, n) => st.users.find(u => u.name === n);
const grp = (st, n) => st.groups.find(g => g.name === n);
const mapBy = (st, n) => st.maps.find(m => m.name === n);
const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
const suspended = u => u.tna.some(t => !t.active);

/* ───────────── missions ───────────── */
const MISSIONS = [
{ id: "M1", o: "O8", t: "Unsuspend a locked-out user", tool: "PrivateArk Client", r: "trustedNet",
  brief: "bob typed his password wrong five times and is now <b>suspended</b>. Reactivate him without changing anything else about his account.",
  setup: st => { const b = usr(st, "bob"); b.tna[0].active = false; b.tna[0].viol = 5; },
  check: st => { const b = usr(st, "bob"); return [
    { ok: !suspended(b), m: "bob is no longer suspended", h: "Suspension is cleared on the user's Trusted Net Areas, not on the General tab." },
    { ok: !b.disabled, m: "bob is still enabled (not disabled)", h: "Disabled and suspended are different states. Don't disable him." }]; },
  path: ["Tools", "Administrative Tools", "Users and Groups", "select bob", "Trusted Net Areas", "select 'All'", "Activate"],
  why: "Suspension happens after MaxAccessViolations (default 5) and clears when the user's trusted network area is activated. That takes Activate Users (+ Audit Users). Clearing 'Disable User' does nothing for a suspended user." },
{ id: "M2", o: "O3", t: "Least-privilege help-desk delegation", tool: "PrivateArk Client", r: "addUserPA",
  brief: "hd_jane works on the help desk. She must be able to <b>unsuspend users</b>, and <b>nothing else</b>. Give her exactly the Vault authorizations that requires.",
  check: st => { const u = usr(st, "hd_jane"), a = u.auths; return [
    { ok: a.includes("ActivateUsers"), m: "has Activate Users", h: "Unsuspending means activating trusted network areas." },
    { ok: a.includes("AuditUsers"), m: "has Audit Users", h: "You can't manage users you can't see. Activating users needs Audit Users too." },
    { ok: sameSet(a, ["ActivateUsers", "AuditUsers"]), m: "has no extra authorizations (least privilege)", h: "Remove everything except Activate Users and Audit Users." }]; },
  path: ["Tools", "Administrative Tools", "Users and Groups", "select hd_jane", "Update", "Authorizations tab", "tick Audit Users + Activate Users", "OK"],
  why: "Per the docs, activating suspended users requires Audit Users + Activate Users. Vault authorizations are set per user on the Authorizations tab." },
{ id: "M3", o: "O2", t: "Lock a contractor to the PVWA", tool: "PrivateArk Client", r: "addUserPA",
  brief: "ali_contractor may only use the <b>web portal (PVWA)</b>. Make sure he can't connect with the PrivateArk Client, PACLI or OPM.",
  check: st => { const f = usr(st, "ali_contractor").ifaces; return [
    { ok: f.includes("PVWA"), m: "PVWA is still authorized", h: "Keep PVWA in the Authorized list." },
    { ok: !f.includes("WINCLIENT"), m: "PrivateArk Client (WINCLIENT) removed", h: "WINCLIENT is the PrivateArk Client interface ID." },
    { ok: !f.includes("PACLI"), m: "PACLI removed", h: "Move PACLI to the Available list." },
    { ok: !f.includes("PIMSU"), m: "OPM (PIMSU) removed", h: "PIMSU is the OPM interface." }]; },
  path: ["Tools", "Administrative Tools", "Users and Groups", "select ali_contractor", "Update", "General tab", "Authorized Interfaces…", "move WINCLIENT, PACLI, PIMSU out with >", "OK", "OK"],
  why: "Interfaces are controlled by user type + Authorized Interfaces, not by Vault authorizations or Safe permissions. (Changing his type to BizUser would also have worked, since BizUser = PVWA only.)" },
{ id: "M4", o: "O8", t: "Time-box a vendor account", tool: "PrivateArk Client", r: "addUserPA",
  brief: "vendor_x may log on only between <b>08:00 and 18:00</b>, and the account must <b>expire automatically on 2026-12-31</b>.",
  check: st => { const u = usr(st, "vendor_x"); return [
    { ok: !u.logonAny && +u.from === 8 && +u.to === 18, m: "logon restricted to 08:00–18:00", h: "Time Limitations tab → Enable this User to logon at." },
    { ok: u.expires === "2026-12-31", m: "account expires on 2026-12-31", h: "Time Limitations tab → Automatically expire User account on." },
    { ok: !u.disabled, m: "account still enabled today", h: "Don't disable it. The expiry date handles the end." }]; },
  path: ["Tools", "Administrative Tools", "Users and Groups", "select vendor_x", "Update", "Time Limitations tab", "set hours 8–18", "set expiry 2026-12-31", "OK"],
  why: "Logon hours and expiry both live on the user's Time Limitations tab. Directory maps carry the same settings in their template for LDAP users." },
{ id: "M5", o: "O4", t: "Activate the predefined Auditor", tool: "PrivateArk Client", r: "predefined", who: "Master",
  brief: "You're logged on as <b>Master</b>. The predefined <b>Auditor</b> user is needed for this quarter's audit. Activate it the way the docs prescribe.",
  check: st => { const u = usr(st, "Auditor"); return [
    { ok: !u.disabled, m: "Auditor is enabled", h: "General tab → clear Disable User." },
    { ok: u.pwSet, m: "Auditor's default password was replaced", h: "Authentication tab → set a new, non-obvious password (6+ chars, upper, lower, digit)." }]; },
  path: ["Tools", "Administrative Tools", "Users and Groups", "select Auditor", "Update", "General: clear Disable User", "Authentication: new password", "OK"],
  why: "All predefined users except Master are created disabled. Log on as Master, clear Disable User and change the default password." },
{ id: "M6", o: "O6", t: "Put an AD group inside a Vault group", tool: "PrivateArk Client", r: "ldapSafe",
  brief: "Every member of the AD group <b>DBA-Team</b> should inherit whatever the Vault group <b>DB-Admins</b> has. Make DBA-Team a member of DB-Admins.",
  check: st => { const g = grp(st, "DB-Admins"); return [
    { ok: g.members.some(m => m.k === "lg" && m.n === "DBA-Team"), m: "DBA-Team (LDAP group) is a member of DB-Admins", h: "Select the Vault group → Update → Add ▾ → LDAP Group → Add from LDAP." }]; },
  path: ["Tools", "Administrative Tools", "Users and Groups", "select DB-Admins", "Update", "Add ▾ LDAP Group", "Add from LDAP…", "search DBA", "select DBA-Team", "OK", "OK"],
  why: "You add an LDAP group from the VAULT group's Update window (Members → Add → LDAP Group), not from a Member Of tab. Adding it this way also creates the external group in the Vault." },
{ id: "M7", o: "O3", t: "Every auditor is missing Audit Users", tool: "PVWA", r: "ldapSetup",
  brief: "All auditors come from the AD group <b>SOC-Auditors</b> through a directory map, and someone stripped <b>Audit Users</b> from all of them. Fix it so <i>every</i> auditor gets it back.",
  setup: st => { mapBy(st, "Vault Auditors Mapping").auths = []; },
  check: st => { const m = mapBy(st, "Vault Auditors Mapping"); return [
    { ok: m && m.auths.includes("AuditUsers"), m: "Vault Auditors Mapping grants Audit Users", h: "Groups can't hold Vault authorizations. Fix the map's user template." },
    { ok: m && m.auths.length <= 2, m: "the map wasn't over-granted", h: "Auditors need Audit Users, not admin rights." }]; },
  path: ["User Provisioning", "LDAP Integration", "Vault Auditors Mapping ⋯ Edit", "User template – Authorization", "tick Audit Users", "Save changes"],
  why: "Vault authorizations live on users, never groups. For LDAP users they come from the map's user template, which is applied again at each user's next logon, so editing the map fixes all of them. (PrivateArk equivalent: Directory Mapping → Update → User Template → Authorizations.)" },
{ id: "M8", o: "O6", t: "Admins log on with no rights", tool: "PVWA", r: "ldapSetup",
  brief: "Vault admins can log on but get <b>no authorizations</b>. Their AD group is mapped correctly. Look at the mappings and fix the real cause.",
  setup: st => { const u = mapBy(st, "Vault Users Mapping"); u.ldap = "CyberArk"; u.match = "Contains"; st.maps = [u, mapBy(st, "Vault Admins Mapping"), mapBy(st, "Vault Auditors Mapping")]; },
  check: st => { const i = n => st.maps.findIndex(m => m.name === n); return [
    { ok: i("Vault Admins Mapping") < i("Vault Users Mapping"), m: "Vault Admins Mapping is evaluated before Vault Users Mapping", h: "Map order: the first match wins. The broad 'Contains CyberArk' map is catching the admins." },
    { ok: mapBy(st, "Vault Admins Mapping").auths.length === AUTHS.length, m: "the admins map still grants all authorizations", h: "Don't change the template. Change the order." }]; },
  path: ["User Provisioning", "LDAP Integration", "move Vault Admins Mapping up (▲)"],
  why: "Maps are matched top to bottom and the first match wins. 'Vault Users Mapping' with Contains 'CyberArk' also matches CyberArk-Vault-Admins, so it caught the admins first and applied its empty template." },
{ id: "M9", o: "O6", t: "Delegate unsuspend to an AD group", tool: "PVWA", r: "ldapSetup",
  brief: "Let every member of the AD group <b>ServiceDesk</b> unsuspend users, and nothing more. Use a directory mapping so AD membership drives it.",
  check: st => { const i = st.maps.findIndex(m => m.ldap.toLowerCase() === "servicedesk"), m = st.maps[i], ui = st.maps.findIndex(x => x.name === "Vault Users Mapping"); return [
    { ok: !!m, m: "a mapping scoped to the ServiceDesk LDAP group exists", h: "LDAP Integration → Add Mapping → Map by LDAP group: ServiceDesk." },
    { ok: m && m.auths.includes("ActivateUsers") && m.auths.includes("AuditUsers"), m: "its template grants Activate Users + Audit Users", h: "User template – Authorization." },
    { ok: m && m.auths.length === 2, m: "no extra authorizations (least privilege)", h: "Only those two." },
    { ok: m && (ui < 0 || i < ui), m: "ordered above the generic Vault Users Mapping", h: "Set its map order so it's matched before the users map." }]; },
  path: ["User Provisioning", "LDAP Integration", "Add Mapping", "name + map order 1", "Map by LDAP group: ServiceDesk", "Authorization: Activate Users + Audit Users", "Save"],
  why: "Vault authorizations for AD groups are delivered through a map's user template. Order matters because the first matching map wins, and members receive it at their next logon." },
{ id: "M10", o: "O7", t: "Turn on RADIUS sign-in for mike", tool: "PVWA + PrivateArk", r: "radius",
  brief: "The Vault is already integrated with the RADIUS server (secret file + RadiusServersInfo done). Make it possible for <b>mike</b> to sign in to the PVWA with <b>RADIUS</b>.",
  check: st => [
    { ok: st.pv.radius.Enabled === "Yes", m: "radius is enabled in PVWA Authentication Methods", h: "PVWA: Administration → Options → Authentication Methods → radius → Enabled = Yes → Apply." },
    { ok: usr(st, "mike").auth === "RADIUS Authentication", m: "mike's Vault user authenticates with RADIUS", h: "PrivateArk: Users and Groups → mike → Update → Authentication tab." }],
  path: ["PVWA: Administration", "Options", "Authentication Methods", "radius", "Enabled = Yes", "Apply", "PrivateArk: Users and Groups", "mike", "Update", "Authentication tab", "RADIUS Authentication", "OK"],
  why: "Authentication has two halves: the method enabled in the interface (PVWA Options) and the method set on the Vault user. Either one alone isn't enough." },
{ id: "M11", o: "O9", t: "Create a REST service user", tool: "PVWA", r: "addUserPVWA",
  brief: "Create a CyberArk-authenticated user <b>svc_reports</b> for a reporting script. Scripts can't answer \"change your password\" prompts, so it must <b>not</b> require a change at next logon, and its password must <b>never expire</b>.",
  check: st => { const u = usr(st, "svc_reports"); return [
    { ok: !!u, m: "svc_reports exists", h: "User Provisioning → Users → Create CyberArk User." },
    { ok: u && u.src === "CyberArk" && u.pwSet, m: "it's an internal user with a valid password", h: "6+ characters with an uppercase letter, a lowercase letter and a digit." },
    { ok: u && !u.mustChange, m: "no forced change at next logon", h: "Clear 'User must change password at next logon'." },
    { ok: u && u.neverExpires, m: "password never expires", h: "Set password expiration to never." }]; },
  path: ["User Provisioning", "Users", "Create CyberArk User", "username svc_reports", "password", "clear must-change", "never expires", "Create"],
  why: "Modern PVWA: User Provisioning → Users → Create CyberArk User. The REST equivalent is POST /API/Users with changePassOnNextLogon=false and passwordNeverExpires=true." },
{ id: "M12", o: "O8", t: "Define a network area for the SOC", tool: "PrivateArk Client", r: "netAreas",
  brief: "Create a network area named <b>SOC</b> covering the whole <b>10.20.30.x</b> subnet, so it can later be assigned as a trusted network area.",
  check: st => { const n = st.nets.find(x => x.name.toLowerCase() === "soc"); return [
    { ok: !!n, m: "a network area named SOC exists", h: "Tools → Administrative Tools → Network Area → New." },
    { ok: n && n.addrs.some(a => a.kind === "Mask" && a.ip.startsWith("10.20.30.") && +a.mask === 24) || (n && n.addrs.some(a => a.kind === "Range" && a.ip === "10.20.30.0" && a.to === "10.20.30.255")), m: "it covers 10.20.30.0/24", h: "Mask 24 = the first three octets fixed." }]; },
  path: ["Tools", "Administrative Tools", "Network Area", "select All", "New", "name SOC", "Next", "Mask: 10.20.30.0 / 24", "Add", "Finish"],
  why: "Network areas are defined in the PrivateArk Client by mask or range (needs Add Network Areas). Mask 24 keeps the first three octets, so 10.20.30.0/24 covers 10.20.30.0–10.20.30.255." }
];

/* ───────────── simulator state & helpers ───────────── */
const SIM = { m: null, st: null, win: "pa", pa: { menu: null, dlgs: [] }, pv: { page: "home", menu: null, edit: null }, hint: 0, result: null };
const curD = () => SIM.pa.dlgs[SIM.pa.dlgs.length - 1];
const clone = o => JSON.parse(JSON.stringify(o));
function pushD(d) { SIM.pa.dlgs.push(d); SIM.pa.menu = null; }
function popD() { SIM.pa.dlgs.pop(); }
function toast(t) { SIM.st.toast = t; setTimeout(() => { if (SIM.st && SIM.st.toast === t) { SIM.st.toast = ""; const el = document.querySelector(".simtoast"); if (el) el.remove(); } }, 2600); }
function pwOk(p) { return typeof p === "string" && p.length >= 6 && /\d/.test(p) && /[a-z]/.test(p) && /[A-Z]/.test(p); }
const chk = (on, act, arg, label, dis) => `<label class="cb"><input type="checkbox" data-act="${act}" data-arg="${esc(arg)}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}> ${esc(label)}</label>`;

/* ───────────── PrivateArk Client rendering ───────────── */
function paWin() {
  const st = SIM.st, menu = SIM.pa.menu;
  const ddFor = m => {
    if (m === "tools" && (menu === "tools" || menu === "admin")) {
      const sub = menu === "admin" ? `<div class="pamenu sub"><div class="mi" data-act="paOpen" data-arg="ug">Users and Groups…</div><div class="mi" data-act="paOpen" data-arg="dm">Directory Mapping…</div><div class="mi" data-act="paOpen" data-arg="na">Network Area…</div><div class="mi dis">File Categories…</div><div class="mi dis">Vault Properties…</div></div>` : "";
      return `<div class="pamenu"><div class="mi dis">Options…</div><div class="mi hasSub ${menu === "admin" ? "hot" : ""}" data-act="paMenu" data-arg="admin">Administrative Tools ▸${sub}</div><div class="mi dis">Search…</div></div>`;
    }
    return menu === m ? `<div class="pamenu"><div class="mi dis">(nothing needed here for this lab)</div></div>` : "";
  };
  const dlgs = SIM.pa.dlgs.map((d, i) => `<div class="paover" style="z-index:${100 + i}">${PADLG[d.k](d)}</div>`).join("");
  return `<div class="win pa"><div class="tbar"><span>🗝️ PrivateArk Client – [${st.vault}]</span><span class="mut2">Logged on as ${esc(st.who)}</span></div>
    <div class="menubar">${["File", "Edit", "View", "Tools", "Window", "Help"].map(m => { const k = m.toLowerCase(); return `<span class="mb ${menu && (menu === k || (menu === "admin" && k === "tools")) ? "on" : ""}" data-act="paMenu" data-arg="${k}">${m}${ddFor(k)}</span>`; }).join("")}</div>
    <div class="pabody"><div class="safes">${["System", "VaultInternal", "Notification Engine", "PasswordManager", "Linux-Root", "Windows-Admins", "DBA-Prod"].map(s => `<div class="safe"><span>🗄️</span>${s}</div>`).join("")}</div>
    <div class="status">Safes: 7 · ${st.users.length} users · Tip: user management lives under Tools.</div></div>${dlgs}</div>`;
}
const PADLG = {
  ug(d) {
    const st = SIM.st, sel = d.sel || "";
    const locs = ["\\", "\\IT", "\\Contractors"];
    const item = (key, icon, label, cls) => `<div class="ti ${sel === key ? "sel" : ""} ${cls || ""}" data-act="ugSel" data-arg="${esc(key)}">${icon} ${esc(label)}</div>`;
    let tree = "";
    locs.forEach(l => {
      tree += item("loc:" + l, "📁", l === "\\" ? "\\ (Root)" : l, "loc");
      st.users.filter(u => u.loc === l).forEach(u => tree += item("u:" + u.name, u.src === "LDAP" ? "👤🌐" : suspended(u) ? "👤⛔" : u.disabled ? "👤🚫" : "👤", u.name, "ind"));
      if (l === "\\") { st.groups.forEach(g => tree += item("g:" + g.name, "👥", g.name, "ind")); st.extGroups.forEach(g => tree += item("lg:" + g, "👥🌐", g, "ind")); }
    });
    const k = sel.split(":")[0];
    const can = { upd: k === "u" || k === "g", del: k === "u" || k === "g" || k === "lg", ren: k === "u" || k === "g", tna: k === "u", own: k === "lg" || k === "g" || k === "u" };
    return `<div class="dlg" style="width:560px"><div class="dt">Users and Groups <span class="x" data-act="paClose">✕</span></div>
      <div class="dbody ug"><div class="tree">${tree}</div><div class="btncol">
        <div class="newwrap"><button class="pb" data-act="ugNew">New ▾</button>${d.newOpen ? `<div class="pamenu inl"><div class="mi" data-act="ugNewUser">User…</div><div class="mi" data-act="ugNewGroup">Group…</div></div>` : ""}</div>
        <button class="pb" data-act="ugUpdate" ${can.upd ? "" : "disabled"}>Update</button><button class="pb" data-act="ugDelete" ${can.del ? "" : "disabled"}>Delete</button>
        <button class="pb" ${can.ren ? "" : "disabled"} data-act="ugNoop">Rename</button><button class="pb" data-act="ugTna" ${can.tna ? "" : "disabled"}>Trusted Net Areas</button>
        <button class="pb" ${can.own ? "" : "disabled"} data-act="ugNoop">Safe Ownership</button><div style="flex:1"></div><button class="pb" data-act="paClose">Close</button></div></div>
      ${k === "lg" ? `<div class="dnote">LDAP group selected: only Delete and Safe Ownership apply. Its membership is managed in the directory.</div>` : ""}</div>`;
  },
  user(d) {
    const u = d.u, ldap = u.src === "LDAP";
    const tabs = ["General", "Authentication", "Authorizations", "Member Of", "Time Limitations", "Business/Internet", "Personal"];
    let body = "";
    if (d.tab === "General") body = `
      <div class="fr"><label>User Name</label><input data-b="name" value="${esc(u.name)}" ${d.isNew ? "" : "disabled"}></div>
      <div class="fr"><label>User type</label><select data-b="type" ${ldap ? "disabled" : ""}>${Object.keys(UTYPES).map(t => `<option ${u.type === t ? "selected" : ""}>${t}</option>`).join("")}</select><button class="pb" data-act="uIfaces">Authorized Interfaces…</button></div>
      <div class="fr"><label>Location</label><input value="${esc(u.loc)}" disabled></div>
      <div class="fr">${chk(u.gateway, "uFlag", "gateway", "Gateway Account", ldap)}</div><div class="fr">${chk(u.disabled, "uFlag", "disabled", "Disable User")}</div>
      ${ldap ? `<div class="dnote">External (LDAP) user: general details come from the directory.</div>` : ""}`;
    else if (d.tab === "Authentication") body = `
      <div class="fr"><label>Authentication method</label><select data-b="auth">${AMETHODS.map(m => `<option ${u.auth === m ? "selected" : ""}>${m}</option>`).join("")}</select></div>
      <div class="fr"><label>Password</label><input type="password" data-b="_pw" value="${esc(d._pw || "")}" placeholder="${u.pwSet ? "••••••••" : "(default – change it)"}" ${u.auth !== "Password" ? "disabled" : ""}></div>
      <div class="fr"><label>Confirm</label><input type="password" data-b="_pw2" value="${esc(d._pw2 || "")}" ${u.auth !== "Password" ? "disabled" : ""}></div>
      <div class="fr">${chk(u.mustChange, "uFlag", "mustChange", "User Must Change Password at Next Logon", u.auth !== "Password")}</div>
      <div class="fr">${chk(u.neverExpires, "uFlag", "neverExpires", "Password Never Expires", u.auth !== "Password")}</div>`;
    else if (d.tab === "Authorizations") body = `<div class="authgrid">${AUTHS.map(a => chk(u.auths.includes(a), "uAuth", a, AUTHNAME[a])).join("")}</div>`;
    else if (d.tab === "Member Of") {
      const mine = SIM.st.groups.filter(g => g.members.some(m => m.k === "u" && m.n === u.name)).map(g => g.name);
      body = `<div class="listbox">${mine.length ? mine.map(g => `<div>👥 ${esc(g)}</div>`).join("") : `<div class="mut2">(not a member of any group)</div>`}</div>
        <div class="fr"><select id="moSel">${SIM.st.groups.filter(g => !mine.includes(g.name)).map(g => `<option>${esc(g.name)}</option>`).join("")}</select><button class="pb" data-act="uMemberAdd">Add</button></div>`;
    } else if (d.tab === "Time Limitations") body = `
      <div class="fr"><label>History (days)</label><input type="number" min="0" data-b="history" value="${u.history}" style="width:80px"></div>
      <fieldset><legend>Enable this User to logon at</legend><label class="cb"><input type="radio" name="la" data-act="uLogonAny" data-arg="1" ${u.logonAny ? "checked" : ""}> Any time</label>
      <label class="cb"><input type="radio" name="la" data-act="uLogonAny" data-arg="0" ${!u.logonAny ? "checked" : ""}> From <input type="number" min="0" max="24" data-b="from" value="${u.from}" style="width:56px" ${u.logonAny ? "disabled" : ""}> to <input type="number" min="0" max="24" data-b="to" value="${u.to}" style="width:56px" ${u.logonAny ? "disabled" : ""}></label></fieldset>
      <fieldset><legend>Automatically expire User account on</legend><input type="date" data-b="expires" value="${esc(u.expires)}"> <button class="pb" data-act="uNoExpire">Never</button></fieldset>`;
    else body = `<div class="mut2">Contact details tab (not needed for this lab).</div>`;
    return `<div class="dlg" style="width:520px"><div class="dt">${d.isNew ? "New User" : "Update User – " + esc(u.name)} <span class="x" data-act="paCancel">✕</span></div>
      <div class="tabs">${tabs.map(t => `<span class="${d.tab === t ? "on" : ""}" data-act="uTab" data-arg="${t}">${t}</span>`).join("")}</div>
      <div class="dbody form">${body}</div>${d.err ? `<div class="derr">${esc(d.err)}</div>` : ""}<div class="dfoot"><button class="pb" data-act="uOk">OK</button><button class="pb" data-act="paCancel">Cancel</button></div></div>`;
  },
  ifaces(d) {
    const u = d.parent.u, pool = UTYPES[u.type] || [];
    const avail = pool.filter(x => !u.ifaces.includes(x));
    return `<div class="dlg" style="width:440px"><div class="dt">Authorized Interfaces – ${esc(u.type)} <span class="x" data-act="paClose">✕</span></div>
      <div class="dbody two"><div><div class="mut2 sm">Authorized Interfaces</div><div class="listbox">${u.ifaces.map(x => `<div class="li ${d.sel === "a:" + x ? "sel" : ""}" data-act="ifSel" data-arg="a:${x}">${x}</div>`).join("") || `<div class="mut2">(none)</div>`}</div></div>
      <div class="mid"><button class="pb" data-act="ifMove" data-arg="add" title="Authorize">&lt;</button><button class="pb" data-act="ifMove" data-arg="rem" title="Remove">&gt;</button></div>
      <div><div class="mut2 sm">Available Interfaces</div><div class="listbox">${avail.map(x => `<div class="li ${d.sel === "v:" + x ? "sel" : ""}" data-act="ifSel" data-arg="v:${x}">${x}</div>`).join("") || `<div class="mut2">(none)</div>`}</div></div></div>
      <div class="dnote">WINCLIENT = PrivateArk Client/Webclient · PIMSU = OPM</div><div class="dfoot"><button class="pb" data-act="paClose">OK</button></div></div>`;
  },
  tna(d) {
    const u = usr(SIM.st, d.name);
    return `<div class="dlg" style="width:520px"><div class="dt">Trusted Net Areas – ${esc(u.name)} <span class="x" data-act="paClose">✕</span></div>
      <div class="dbody"><table class="grid"><tr><th>Network Area</th><th>Status</th><th>From</th><th>To</th><th>Max violations</th><th>Violations</th></tr>
      ${u.tna.map((t, i) => `<tr class="${d.sel === i ? "sel" : ""}" data-act="tnaSel" data-arg="${i}"><td>${esc(t.area)}</td><td>${t.active ? "✅ Active" : "⛔ Suspended"}</td><td>${t.from}</td><td>${t.to}</td><td>${t.maxv}</td><td>${t.viol}</td></tr>`).join("")}</table>
      <div class="row"><button class="pb" data-act="ugNoop">Add…</button><button class="pb" data-act="tnaAct" data-arg="1" ${d.sel === undefined ? "disabled" : ""}>Activate</button><button class="pb" data-act="tnaAct" data-arg="0" ${d.sel === undefined ? "disabled" : ""}>Deactivate</button><button class="pb" data-act="ugNoop">Update…</button><button class="pb" data-act="ugNoop">Remove</button></div></div>
      <div class="dfoot"><button class="pb" data-act="paClose">Close</button></div></div>`;
  },
  group(d) {
    const g = d.g;
    return `<div class="dlg" style="width:480px"><div class="dt">${d.isNew ? "New Group" : "Update Group – " + esc(g.name)} <span class="x" data-act="paCancel">✕</span></div>
      <div class="dbody form"><div class="fr"><label>Group Name</label><input data-b="name" value="${esc(g.name)}" ${d.isNew ? "" : "disabled"}></div>
      <div class="fr"><label>Description</label><input data-b="desc" value="${esc(g.desc || "")}"></div>
      <div class="mut2 sm">Members</div><div class="listbox">${g.members.map((m, i) => `<div class="li ${d.sel === i ? "sel" : ""}" data-act="gSel" data-arg="${i}">${m.k === "lg" ? "👥🌐" : "👤"} ${esc(m.n)}</div>`).join("") || `<div class="mut2">(no members)</div>`}</div>
      <div class="row"><div class="newwrap"><button class="pb" data-act="gAddOpen">Add ▾</button>${d.addOpen ? `<div class="pamenu inl"><div class="mi" data-act="gAddUser">User…</div><div class="mi" data-act="gAddLdap">LDAP Group…</div></div>` : ""}</div><button class="pb" data-act="gRemove" ${d.sel === undefined ? "disabled" : ""}>Remove</button></div>
      <div class="dnote">Groups have no Authorizations tab. Vault authorizations belong to users.</div></div>
      ${d.err ? `<div class="derr">${esc(d.err)}</div>` : ""}<div class="dfoot"><button class="pb" data-act="gOk">OK</button><button class="pb" data-act="paCancel">Cancel</button></div></div>`;
  },
  pickUser(d) {
    const g = d.parent.g, cand = SIM.st.users.filter(u => !g.members.some(m => m.k === "u" && m.n === u.name));
    return `<div class="dlg" style="width:380px"><div class="dt">Add Members to '${esc(g.name)}' <span class="x" data-act="paClose">✕</span></div>
      <div class="dbody"><div class="listbox tall">${cand.map(u => `<div class="li ${d.sel === u.name ? "sel" : ""}" data-act="puSel" data-arg="${esc(u.name)}">👤 ${esc(u.name)}</div>`).join("")}</div></div>
      <div class="dfoot"><button class="pb" data-act="puOk" ${d.sel ? "" : "disabled"}>OK</button><button class="pb" data-act="paClose">Cancel</button></div></div>`;
  },
  pickLdap(d) {
    const g = d.parent.g, inV = SIM.st.extGroups.filter(x => !g.members.some(m => m.k === "lg" && m.n === x));
    const res = d.searched ? SIM.st.ad.filter(x => x.toLowerCase().includes((d.q || "").toLowerCase())) : null;
    return `<div class="dlg" style="width:420px"><div class="dt">Add External Group to '${esc(g.name)}' <span class="x" data-act="paClose">✕</span></div>
      <div class="dbody"><div class="mut2 sm">LDAP groups already created in the Vault</div>
      <div class="listbox">${inV.map(x => `<div class="li ${d.sel === x ? "sel" : ""}" data-act="plSel" data-arg="${esc(x)}">👥🌐 ${esc(x)}</div>`).join("") || `<div class="mut2">(none)</div>`}</div>
      ${d.find ? `<fieldset><legend>Find External User/Group – directory corp.local</legend><div class="fr"><label>Search for</label><select disabled><option>Groups</option></select></div>
        <div class="fr"><label>Filter</label><input data-b="q" value="${esc(d.q || "")}" placeholder="e.g. DBA"><button class="pb" data-act="plSearch">Search</button></div>
        ${res ? `<div class="listbox">${res.map(x => `<div class="li ${d.sel === x ? "sel" : ""}" data-act="plSel" data-arg="${esc(x)}">🌐 ${esc(x)}</div>`).join("") || `<div class="mut2">(no matches)</div>`}</div>` : ""}</fieldset>`
        : `<button class="pb" data-act="plFind">Add from LDAP…</button>`}</div>
      <div class="dfoot"><button class="pb" data-act="plOk" ${d.sel ? "" : "disabled"}>OK</button><button class="pb" data-act="paClose">Cancel</button></div></div>`;
  },
  dm(d) {
    const st = SIM.st;
    return `<div class="dlg" style="width:520px"><div class="dt">Directory Mapping for Vault ${esc(st.vault)} <span class="x" data-act="paClose">✕</span></div>
      <div class="dbody two"><div style="flex:1"><div class="mut2 sm">Map Name (matched top to bottom)</div><div class="listbox tall">${st.maps.map((m, i) => `<div class="li ${d.sel === i ? "sel" : ""}" data-act="dmSel" data-arg="${i}">${i + 1}. ${esc(m.name)}</div>`).join("")}</div></div>
      <div class="mid"><button class="pb" data-act="dmMove" data-arg="-1" ${d.sel === undefined ? "disabled" : ""}>▲</button><button class="pb" data-act="dmMove" data-arg="1" ${d.sel === undefined ? "disabled" : ""}>▼</button></div>
      <div class="btncol"><button class="pb" data-act="ugNoop">Add…</button><button class="pb" data-act="dmUpd" ${d.sel === undefined ? "disabled" : ""}>Update…</button><button class="pb" data-act="ugNoop">Delete</button><button class="pb" data-act="paClose">Close</button></div></div></div>`;
  },
  map(d) {
    const m = d.m;
    return `<div class="dlg" style="width:500px"><div class="dt">New/Update Directory Map <span class="x" data-act="paCancel">✕</span></div>
      <div class="dbody form"><div class="fr"><label>Map Name</label><input value="${esc(m.name)}" disabled></div><div class="fr"><label>Location</label><input value="${esc(m.loc)}" disabled></div>
      <div class="fr"><label class="cb"><input type="checkbox" checked disabled> Users</label><button class="pb" data-act="mTmpl">User Template…</button></div>
      <div class="mut2 sm">Rules</div><table class="grid"><tr><th>Directory</th><th>Branch</th><th>Group filter</th></tr><tr><td>corp.local</td><td>DC=corp,DC=local</td><td>${esc(m.ldap)}</td></tr></table></div>
      <div class="dfoot"><button class="pb" data-act="mOk">OK</button><button class="pb" data-act="paCancel">Cancel</button></div></div>`;
  },
  tmpl(d) {
    const m = d.parent.m, tabs = ["General", "Authentication", "Authorizations", "Time Limitations"];
    let body = "";
    if (d.tab === "General") body = `<div class="fr"><label>User type</label><select data-tb="type">${Object.keys(UTYPES).map(t => `<option ${m.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>`;
    else if (d.tab === "Authentication") body = `<div class="fr"><label>Authentication method</label><select data-tb="auth">${AMETHODS.map(x => `<option ${m.auth === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>`;
    else if (d.tab === "Authorizations") body = `<div class="authgrid">${AUTHS.map(a => chk(m.auths.includes(a), "tAuth", a, AUTHNAME[a])).join("")}</div>`;
    else body = `<div class="mut2">Logon hours and expiry for users created by this map.</div>`;
    return `<div class="dlg" style="width:480px"><div class="dt">User Template – ${esc(m.name)} <span class="x" data-act="paClose">✕</span></div>
      <div class="tabs">${tabs.map(t => `<span class="${d.tab === t ? "on" : ""}" data-act="tTab" data-arg="${t}">${t}</span>`).join("")}</div><div class="dbody form">${body}</div>
      <div class="dfoot"><button class="pb" data-act="paClose">OK</button></div></div>`;
  },
  na(d) {
    const st = SIM.st;
    return `<div class="dlg" style="width:460px"><div class="dt">Network Areas <span class="x" data-act="paClose">✕</span></div>
      <div class="dbody two"><div style="flex:1"><div class="listbox tall">${st.nets.map((n, i) => `<div class="li ${d.sel === i ? "sel" : ""} ${i ? "ind" : ""}" data-act="naSel" data-arg="${i}">🌐 ${esc(n.name)} <span class="mut2 sm">${n.addrs.map(a => a.kind === "Mask" ? a.ip + "/" + a.mask : a.ip + "–" + a.to).join(", ")}</span></div>`).join("")}</div></div>
      <div class="btncol"><button class="pb" data-act="naNew" ${d.sel === undefined ? "disabled" : ""}>New…</button><button class="pb" data-act="ugNoop">Update…</button><button class="pb" data-act="ugNoop">Delete</button><button class="pb" data-act="paClose">Close</button></div></div>
      ${d.sel === undefined ? `<div class="dnote">Select the parent area (All) first.</div>` : ""}</div>`;
  },
  naNew(d) {
    const n = d.n;
    const step1 = `<div class="fr"><label>Name</label><input data-b="name" value="${esc(n.name)}"></div><div class="fr"><label>Location</label><input value="All" disabled></div>
      <div class="fr"><label>Security Level</label><select data-b="level">${["Low", "Medium", "High"].map(l => `<option ${n.level === l ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="fr">${chk(n.gw, "naGw", "gw", "Enforce Network Areas through Gateway")}</div>`;
    const step2 = `<fieldset><legend>Network Addresses</legend><label class="cb"><input type="radio" name="nk" data-act="naKind" data-arg="Mask" ${d.kind !== "Range" ? "checked" : ""}> Mask</label><label class="cb"><input type="radio" name="nk" data-act="naKind" data-arg="Range" ${d.kind === "Range" ? "checked" : ""}> Range</label>
      ${d.kind === "Range" ? `<div class="fr"><label>From IP</label><input data-b="_ip" value="${esc(d._ip || "")}" placeholder="10.20.30.0"></div><div class="fr"><label>To IP</label><input data-b="_to" value="${esc(d._to || "")}" placeholder="10.20.30.255"></div>`
        : `<div class="fr"><label>IP address</label><input data-b="_ip" value="${esc(d._ip || "")}" placeholder="10.20.30.0"></div><div class="fr"><label>Mask size</label><input type="number" min="0" max="32" data-b="_mask" value="${esc(d._mask === undefined ? "" : d._mask)}" style="width:70px"></div>`}
      <button class="pb" data-act="naAdd">Add</button></fieldset><div class="listbox">${n.addrs.map(a => `<div>${a.kind === "Mask" ? esc(a.ip) + " / " + a.mask : esc(a.ip) + " – " + esc(a.to)}</div>`).join("") || `<div class="mut2">(no addresses yet)</div>`}</div>`;
    return `<div class="dlg" style="width:440px"><div class="dt">New Network Area <span class="x" data-act="paCancel">✕</span></div><div class="dbody form">${d.step === 2 ? step2 : step1}</div>
      ${d.err ? `<div class="derr">${esc(d.err)}</div>` : ""}<div class="dfoot">${d.step === 2 ? `<button class="pb" data-act="naBack">&lt; Back</button><button class="pb" data-act="naFinish">Finish</button>` : `<button class="pb" data-act="naNext">Next &gt;</button>`}<button class="pb" data-act="paCancel">Cancel</button></div></div>`;
  }
};

/* ───────────── PVWA rendering ───────────── */
function pvWin() {
  const st = SIM.st, P = SIM.pv;
  const nav = [["Accounts", null], ["Applications", null], ["Policies", null], ["User Provisioning", "up"], ["Administration", "ad"]];
  const ddFor = k => k === "up" && P.menu === "up" ? `<div class="pvdd"><div class="mi" data-act="pvGo" data-arg="users">Users</div><div class="mi" data-act="pvGo" data-arg="groups">Groups</div><div class="mi" data-act="pvGo" data-arg="ldap">LDAP Integration</div></div>`
    : k === "ad" && P.menu === "ad" ? `<div class="pvdd"><div class="mi" data-act="pvGo" data-arg="options">Configuration Options › Options</div><div class="mi dis">System Health</div><div class="mi dis">Platform Management</div></div>` : "";
  let page = "";
  if (P.page === "home") page = `<h3>Welcome, ${esc(st.who)}</h3><p class="pvmut">Use the menu above. User management lives under <b>User Provisioning</b>; sign-in methods live under <b>Administration</b>.</p>`;
  else if (P.page === "users") page = pvUsers();
  else if (P.page === "userform") page = pvUserForm();
  else if (P.page === "groups") page = pvGroups();
  else if (P.page === "ldap") page = pvLdap();
  else if (P.page === "mapform") page = pvMapForm();
  else if (P.page === "options") page = pvOptions();
  return `<div class="win pvwa"><div class="pvtop"><span class="pvlogo">◆ Password Vault Web Access</span>${nav.map(([n, k]) => `<span class="pvn ${k && (P.menu === k || ({ up: ["users", "groups", "ldap", "userform", "mapform"], ad: ["options"] }[k] || []).includes(P.page)) ? "on" : ""} ${k ? "" : "dis"}" ${k ? `data-act="pvMenu" data-arg="${k}"` : ""}>${n}${k ? " ▾" : ""}${k ? ddFor(k) : ""}</span>`).join("")}<span class="pvuser">👤 ${esc(st.who)}</span></div>
    <div class="pvbody">${page}</div></div>`;
}
function pvUsers() {
  const st = SIM.st, P = SIM.pv;
  return `<div class="pvh"><h3>Users</h3><button class="pvbtn pri" data-act="pvNewUser">Create CyberArk User</button></div>
    <table class="pvt"><tr><th>Username</th><th>Source</th><th>User type</th><th>Status</th><th></th></tr>
    ${st.users.filter(u => u.name !== "Batch").map(u => `<tr><td>${esc(u.name)}</td><td>${u.src}</td><td>${u.type}</td><td>${suspended(u) ? "⛔ Suspended" : u.disabled ? "🚫 Disabled" : "✅ Active"}</td>
      <td class="more"><button class="pvdots" data-act="pvRow" data-arg="${esc(u.name)}">⋯</button>${P.row === u.name ? `<div class="pvdd inl"><div class="mi" data-act="pvEdit" data-arg="${esc(u.name)}">Edit</div>${suspended(u) ? `<div class="mi" data-act="pvActivate" data-arg="${esc(u.name)}">Activate (unsuspend)</div>` : ""}<div class="mi" data-act="pvToggle" data-arg="${esc(u.name)}">${u.disabled ? "Enable" : "Disable"}</div><div class="mi dis">Delete</div></div>` : ""}</td></tr>`).join("")}</table>`;
}
function pvUserForm() {
  const f = SIM.pv.form, isNew = f.isNew;
  return `<div class="pvh"><h3>${isNew ? "Create CyberArk User" : "Edit user – " + esc(f.name)}</h3></div>
    <div class="pvform"><h4>Define general properties</h4>
    <div class="fr"><label>Username</label><input data-pf="name" value="${esc(f.name)}" ${isNew ? "" : "disabled"}></div>
    <div class="fr"><label>User type</label><select data-pf="type">${Object.keys(UTYPES).map(t => `<option ${f.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div class="fr"><label>Vault permissions</label><div class="authgrid sm">${AUTHS.map(a => chk(f.auths.includes(a), "pfAuth", a, AUTHNAME[a])).join("")}</div></div>
    <h4>Define authentication method</h4>
    <div class="fr"><label>Authentication source</label><select disabled><option>Internal (CyberArk)</option></select></div>
    ${isNew ? `<div class="fr"><label>Password</label><input type="password" data-pf="_pw" value="${esc(f._pw || "")}"></div><div class="fr"><label>Confirm password</label><input type="password" data-pf="_pw2" value="${esc(f._pw2 || "")}"></div>` : ""}
    <div class="fr">${chk(f.mustChange, "pfFlag", "mustChange", "User must change password at next logon")}</div>
    <div class="fr"><label>Password expiration</label><select data-pf="_exp"><option value="policy" ${!f.neverExpires ? "selected" : ""}>According to policy</option><option value="never" ${f.neverExpires ? "selected" : ""}>Never expires</option></select></div>
    ${f.err ? `<div class="derr">${esc(f.err)}</div>` : ""}<div class="row"><button class="pvbtn pri" data-act="pfSave">${isNew ? "Create" : "Save changes"}</button><button class="pvbtn" data-act="pvGo" data-arg="users">Cancel</button></div></div>`;
}
function pvGroups() {
  const st = SIM.st, P = SIM.pv;
  return `<div class="pvh"><h3>Groups</h3><button class="pvbtn" data-act="ugNoop">Create Group</button></div>
    <table class="pvt"><tr><th>Group</th><th>Type</th><th>Members</th><th></th></tr>${st.groups.map(g => `<tr><td>${esc(g.name)}</td><td>Vault</td><td>${g.members.map(m => esc(m.n)).join(", ") || "–"}</td>
    <td class="more"><button class="pvdots" data-act="pvRow" data-arg="g:${esc(g.name)}">⋯</button>${P.row === "g:" + g.name ? `<div class="pvdd inl"><div class="mi" data-act="pvGroupEdit" data-arg="${esc(g.name)}">Edit</div><div class="mi dis">Add members</div><div class="mi dis">Delete</div></div>` : ""}</td></tr>`).join("")}</table>
    ${P.gedit ? `<div class="pvform"><h4>Edit group – ${esc(P.gedit)}</h4><div class="fr"><label>Group name</label><input value="${esc(P.gedit)}" disabled></div><div class="fr"><label>Description</label><input></div><p class="pvmut">A group only has a name, a description and members. There's nothing here for Vault authorizations, because groups can't hold them.</p><button class="pvbtn" data-act="pvGroupEdit" data-arg="">Close</button></div>` : ""}`;
}
function pvLdap() {
  const st = SIM.st;
  return `<div class="pvh"><h3>LDAP Integration</h3><div><button class="pvbtn" data-act="ugNoop">New Domain</button> <button class="pvbtn pri" data-act="pvMapNew">Add Mapping</button></div></div>
    <div class="pvdomain"><b>🌐 ${esc(st.domain.name)}</b> <span class="pvmut">SSL ✓ · bind user svc_ldapbind@corp.local · 2 domain controllers</span></div>
    <table class="pvt"><tr><th>Order</th><th>Map name</th><th>Map by LDAP group</th><th>Vault authorizations</th><th></th></tr>
    ${st.maps.map((m, i) => `<tr><td><button class="pvdots" data-act="pvMapMove" data-arg="${i},-1" ${i === 0 ? "disabled" : ""} title="Move up">▲</button><button class="pvdots" data-act="pvMapMove" data-arg="${i},1" ${i === st.maps.length - 1 ? "disabled" : ""} title="Move down">▼</button> ${i + 1}</td>
      <td>${esc(m.name)}</td><td>${esc(m.match)}: ${esc(m.ldap)}</td><td class="sm">${m.auths.length === AUTHS.length ? "All" : m.auths.map(a => AUTHNAME[a]).join(", ") || "None"}</td>
      <td><button class="pvbtn sm" data-act="pvMapEdit" data-arg="${i}">Edit</button></td></tr>`).join("")}</table><p class="pvmut">Maps are matched from the top. The first match wins.</p>`;
}
function pvMapForm() {
  const f = SIM.pv.mform, n = SIM.st.maps.length + (f.isNew ? 1 : 0);
  return `<div class="pvh"><h3>${f.isNew ? "Add directory mapping" : "Edit directory mapping"}</h3></div><div class="pvform">
    <h4>Map properties</h4><div class="fr"><label>Map name</label><input data-mf="name" value="${esc(f.name)}"></div>
    <div class="fr"><label>Map order</label><select data-mf="order">${Array.from({ length: n }, (_, i) => `<option value="${i}" ${f.order === i ? "selected" : ""}>${i + 1}</option>`).join("")}</select></div>
    <h4>Mapping criteria – Map by LDAP group</h4><div class="fr"><label class="cb"><input type="radio" name="mm" data-act="mfMatch" data-arg="Exact" ${f.match === "Exact" ? "checked" : ""}> Exact</label><label class="cb"><input type="radio" name="mm" data-act="mfMatch" data-arg="Contains" ${f.match === "Contains" ? "checked" : ""}> Contains</label></div>
    <div class="fr"><label>LDAP group</label><input data-mf="ldap" list="adgroups" value="${esc(f.ldap)}" placeholder="Start typing…"><datalist id="adgroups">${SIM.st.ad.map(g => `<option value="${esc(g)}">`).join("")}</datalist></div>
    <h4>User template – General</h4><div class="fr"><label>User type</label><select data-mf="type">${Object.keys(UTYPES).map(t => `<option ${f.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div class="fr"><label>Authentication method</label><select data-mf="auth">${AMETHODS.map(x => `<option ${f.auth === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
    <h4>User template – Authorization</h4><div class="authgrid sm">${AUTHS.map(a => chk(f.auths.includes(a), "mfAuth", a, AUTHNAME[a])).join("")}</div>
    ${f.err ? `<div class="derr">${esc(f.err)}</div>` : ""}<div class="row"><button class="pvbtn pri" data-act="mfSave">${f.isNew ? "Save" : "Save changes"}</button><button class="pvbtn" data-act="pvGo" data-arg="ldap">Cancel</button></div></div>`;
}
function pvOptions() {
  const P = SIM.pv, sel = P.opt || null, st = SIM.st;
  const val = sel && sel !== "GeneralSettings" ? (P.optDraft || st.pv[sel]) : null;
  return `<div class="pvh"><h3>Options</h3></div><div class="pvopts"><div class="otree"><div class="on">▾ Authentication Methods</div>
    <div class="oi ${sel === "GeneralSettings" ? "sel" : ""}" data-act="optSel" data-arg="GeneralSettings">GeneralSettings</div>${PV_METHODS.map(m => `<div class="oi ${sel === m ? "sel" : ""}" data-act="optSel" data-arg="${m}">${m}</div>`).join("")}
    <div class="on dis">▸ Access Restriction</div><div class="on dis">▸ Default Safe Authorizations</div><div class="on dis">▸ Users</div></div>
    <div class="oprops">${!sel ? `<p class="pvmut">Select an item on the left.</p>` : sel === "GeneralSettings" ? `<table class="pvt"><tr><td>DefaultMethod</td><td>cyberark</td></tr><tr><td>RememberLastUsedMethod</td><td>No</td></tr></table>` :
      `<table class="pvt"><tr><td>Id</td><td>${sel}</td></tr><tr><td>Enabled</td><td><select data-of="Enabled"><option ${val.Enabled === "Yes" ? "selected" : ""}>Yes</option><option ${val.Enabled === "No" ? "selected" : ""}>No</option></select></td></tr><tr><td>LogoffUrl</td><td></td></tr></table>
       <div class="row"><button class="pvbtn pri" data-act="optApply">Apply</button><button class="pvbtn" data-act="optSave">Save</button></div><p class="pvmut sm">Apply = now · Save = after the RefreshPeriod</p>`}</div></div>`;
}

/* ───────────── mission shell ───────────── */
const LAB = {
  active: false,
  index() {
    LAB.active = false;
    app().innerHTML = `<div class="crumb"><a href="#/home">Home</a> › Lab Missions</div><h1>🧪 Lab Missions</h1>
    <p class="sub">Exam questions ask <i>where</i> and <i>how</i>. These missions make you do it in simulated PrivateArk Client and PVWA screens, laid out like the real ones in the docs. You pick the tool and the path, then the app checks the resulting configuration.</p>
    <div class="lessons">${MISSIONS.map((m, i) => `<a class="lcard ${S.lab[m.id] ? "done" : ""}" href="#/lab/${m.id}"><span class="ln">${i + 1}</span><span class="li">${OBJ[m.o].icon}</span><b>${esc(m.t)}</b><small>${esc(m.tool)} · ${esc(OBJ[m.o].short)} ${S.lab[m.id] ? "· ✓ done" : ""}</small></a>`).join("")}</div>`;
  },
  open(id) {
    const m = MISSIONS.find(x => x.id === id); if (!m) return LAB.index();
    SIM.m = m; SIM.st = baseState(); if (m.who) SIM.st.who = m.who; if (m.setup) m.setup(SIM.st);
    SIM.win = m.tool.startsWith("PVWA") ? "pvwa" : "pa"; SIM.pa = { menu: null, dlgs: [] }; SIM.pv = { page: "home", menu: null }; SIM.hint = 0; SIM.result = null;
    LAB.active = true; LAB.paint();
  },
  paint() {
    const m = SIM.m, i = MISSIONS.indexOf(m), nx = MISSIONS[i + 1];
    let res = "";
    if (SIM.result) {
      const all = SIM.result.every(c => c.ok);
      res = `<div class="labres ${all ? "ok" : "no"}"><b>${all ? "✓ Mission complete" : "Not yet. Here's what's still off:"}</b><ul>${SIM.result.map(c => `<li class="${c.ok ? "ok" : "no"}">${c.ok ? "✓" : "✗"} ${esc(c.m)}${c.ok ? "" : ` <span class="mut sm">(${esc(c.h)})</span>`}</li>`).join("")}</ul>
        ${all ? `<p><b>The real path:</b> ${m.path.map(esc).join(" › ")}</p><p>${esc(m.why)}</p>${REF[m.r] ? `<div class="ref">📖 <a href="${esc(REF[m.r][1])}" target="_blank" rel="noopener noreferrer">${esc(REF[m.r][0])}</a></div>` : ""}
        <div class="row">${nx ? `<a class="btn pri" href="#/lab/${nx.id}">Next mission: ${esc(nx.t)} →</a>` : `<a class="btn pri" href="#/exam">Take the Ace Check →</a>`}<a class="btn" href="#/lab">All missions</a></div>` : ""}</div>`;
    }
    // Keep list/tree scroll positions across repaints so a click never jumps the list.
    const keep = [...document.querySelectorAll(".screen .tree, .screen .listbox, .screen")].map(e => e.scrollTop);
    const hint = SIM.hint ?`<div class="hintbox">Path so far: ${m.path.slice(0, Math.ceil(m.path.length * SIM.hint / 3)).map(esc).join(" › ")}${SIM.hint < 3 ? " › …" : ""}</div>` : "";
    app().innerHTML = `<div class="crumb"><a href="#/home">Home</a> › <a href="#/lab">Lab</a> › Mission ${i + 1}</div>
      <div class="mission"><div><div class="eyebrow">Mission ${i + 1} · ${esc(OBJ[m.o].name)}</div><h2>${esc(m.t)}</h2><p>${m.brief}</p></div>
      <div class="mbtns"><button class="btn pri" data-act="labCheck">Check my work</button><button class="btn" data-act="labHint" ${SIM.hint >= 3 ? "disabled" : ""}>${SIM.hint ? "More hint" : "Hint"}</button><button class="btn" data-act="labReset">Reset</button></div></div>
      ${hint}${res}
      <p class="mobonly mut sm">Tip: these screens are desktop-sized. Scroll sideways inside the window, or use a computer for the full experience.</p>
      <div class="desk"><div class="taskbar"><button class="tb ${SIM.win === "pa" ? "on" : ""}" data-act="labWin" data-arg="pa">🗝️ PrivateArk Client</button><button class="tb ${SIM.win === "pvwa" ? "on" : ""}" data-act="labWin" data-arg="pvwa">🌐 PVWA (browser)</button></div>
      <div class="screen">${SIM.win === "pa" ? paWin() : pvWin()}${SIM.st.toast ? `<div class="simtoast">${esc(SIM.st.toast)}</div>` : ""}</div></div>`;
    document.querySelectorAll(".screen .tree, .screen .listbox, .screen").forEach((e, i) => { if (keep[i]) e.scrollTop = keep[i]; });
  },
  key(e) {
    if (e.key === "Escape") {
      if (SIM.pa.menu) { SIM.pa.menu = null; LAB.paint(); return true; }
      if (SIM.pv.menu || SIM.pv.row) { SIM.pv.menu = null; SIM.pv.row = null; LAB.paint(); return true; }
      if (SIM.win === "pa" && SIM.pa.dlgs.length) { popD(); LAB.paint(); return true; }
    }
    return true; // keep the drill/quiz keyboard handler out of the lab
  },
  act: {}
};
window.LAB = LAB;

/* ───────────── simulator actions ───────────── */
const A = LAB.act, P = () => { LAB.paint(); };
Object.assign(A, {
  labWin: a => { SIM.win = a; SIM.pa.menu = null; SIM.pv.menu = null; P(); },
  labHint: () => { SIM.hint = Math.min(3, SIM.hint + 1); P(); },
  labReset: () => LAB.open(SIM.m.id),
  labCheck: () => { SIM.result = SIM.m.check(SIM.st); if (SIM.result.every(c => c.ok) && !S.lab[SIM.m.id]) { S.lab[SIM.m.id] = now(); save(); } P(); if (window.header) header(); const r = document.querySelector(".labres"); if (r) r.scrollIntoView({ behavior: "smooth", block: "nearest" }); },
  ugNoop: () => { toast("Not needed for this mission."); P(); },
  /* PrivateArk menus */
  paMenu: a => { SIM.pa.menu = SIM.pa.menu === a ? null : a; if (a === "admin") SIM.pa.menu = "admin"; P(); },
  paOpen: a => { SIM.pa.menu = null; SIM.pa.dlgs = []; pushD({ k: a }); P(); },
  paClose: () => { popD(); P(); },
  paCancel: () => { popD(); P(); },
  /* Users and Groups */
  ugSel: a => { curD().sel = a; curD().newOpen = false; P(); },
  ugNew: () => { curD().newOpen = !curD().newOpen; P(); },
  ugNewUser: () => { const loc = (curD().sel || "").startsWith("loc:") ? curD().sel.slice(4) : "\\"; curD().newOpen = false; pushD({ k: "user", isNew: true, tab: "General", u: mkUser("", loc, { pwSet: false, mustChange: true }) }); P(); },
  ugNewGroup: () => { curD().newOpen = false; pushD({ k: "group", isNew: true, g: { name: "", desc: "", members: [] } }); P(); },
  ugUpdate: () => {
    const [k, n] = curD().sel.split(/:(.*)/);
    if (k === "u") pushD({ k: "user", tab: "General", u: clone(usr(SIM.st, n)), orig: n });
    if (k === "g") pushD({ k: "group", g: clone(grp(SIM.st, n)), orig: n });
    P();
  },
  ugDelete: () => { toast("Deleting isn't part of this mission. Nothing was deleted."); P(); },
  ugTna: () => { const n = curD().sel.slice(2); pushD({ k: "tna", name: n }); P(); },
  tnaSel: a => { curD().sel = +a; P(); },
  tnaAct: a => { const d = curD(), u = usr(SIM.st, d.name), t = u.tna[d.sel]; t.active = a === "1"; if (t.active) t.viol = 0; toast(t.active ? `Trusted network area '${t.area}' activated for ${u.name}.` : `Deactivated '${t.area}' for ${u.name}.`); P(); },
  /* user dialog */
  uTab: a => { curD().tab = a; P(); },
  uFlag: (a, el) => { curD().u[a] = el.checked; P(); },
  uAuth: (a, el) => { const u = curD().u; u.auths = el.checked ? [...new Set([...u.auths, a])] : u.auths.filter(x => x !== a); },
  uIfaces: () => { pushD({ k: "ifaces", parent: curD() }); P(); },
  ifSel: a => { curD().sel = a; P(); },
  ifMove: a => {
    const d = curD(), u = d.parent.u; if (!d.sel) return;
    const [k, x] = d.sel.split(":");
    if (a === "rem" && k === "a") u.ifaces = u.ifaces.filter(i => i !== x);
    if (a === "add" && k === "v") u.ifaces = [...u.ifaces, x];
    d.sel = null; P();
  },
  uMemberAdd: () => { const s = document.getElementById("moSel"); if (!s || !s.value) return; const d = curD(); d.memberAdds = [...(d.memberAdds || []), s.value]; const g = grp(SIM.st, s.value); g.members.push({ k: "u", n: d.u.name || d.orig }); toast(`Added to ${s.value}.`); P(); },
  uLogonAny: a => { curD().u.logonAny = a === "1"; P(); },
  uNoExpire: () => { curD().u.expires = ""; P(); },
  uOk: () => {
    const d = curD(), u = d.u;
    if (d.isNew && !u.name.trim()) { d.err = "Specify a user name."; return P(); }
    if (d.isNew && usr(SIM.st, u.name)) { d.err = "A user with this name already exists."; return P(); }
    if ((d._pw || d._pw2) && u.auth === "Password") {
      if (d._pw !== d._pw2) { d.err = "The passwords don't match."; return P(); }
      if (!pwOk(d._pw)) { d.err = "Password must be 6+ characters with an uppercase letter, a lowercase letter and a digit."; return P(); }
      u.pwSet = true;
    }
    if (d.isNew && u.auth === "Password" && !u.pwSet) { d.err = "The General and Authentication tabs are mandatory. Set a password."; return P(); }
    if (!u.logonAny && (+u.from < 0 || +u.to > 24 || +u.from >= +u.to)) { d.err = "Logon hours must be From < To, within 0–24."; return P(); }
    u.ifaces = u.ifaces.filter(x => (UTYPES[u.type] || []).includes(x));
    if (d.isNew) SIM.st.users.push(u); else Object.assign(usr(SIM.st, d.orig), u);
    popD(); toast(d.isNew ? `User ${u.name} created.` : `User ${u.name} updated.`); P();
  },
  /* groups */
  gSel: a => { curD().sel = +a; P(); },
  gAddOpen: () => { curD().addOpen = !curD().addOpen; P(); },
  gAddUser: () => { curD().addOpen = false; pushD({ k: "pickUser", parent: curD() }); P(); },
  gAddLdap: () => { curD().addOpen = false; pushD({ k: "pickLdap", parent: curD() }); P(); },
  gRemove: () => { const d = curD(); d.g.members.splice(d.sel, 1); d.sel = undefined; P(); },
  puSel: a => { curD().sel = a; P(); },
  puOk: () => { const d = curD(); d.parent.g.members.push({ k: "u", n: d.sel }); popD(); P(); },
  plSel: a => { curD().sel = a; P(); },
  plFind: () => { curD().find = true; P(); },
  plSearch: () => { curD().searched = true; P(); },
  plOk: () => { const d = curD(); d.parent.g.members.push({ k: "lg", n: d.sel }); if (!SIM.st.extGroups.includes(d.sel)) SIM.st.extGroups.push(d.sel); popD(); P(); },
  gOk: () => {
    const d = curD(), g = d.g;
    if (d.isNew && !g.name.trim()) { d.err = "Specify a group name."; return P(); }
    if (d.isNew) SIM.st.groups.push(g); else Object.assign(grp(SIM.st, d.orig), g);
    popD(); toast(`Group ${g.name} saved.`); P();
  },
  /* directory mapping (PrivateArk) */
  dmSel: a => { curD().sel = +a; P(); },
  dmMove: a => { const d = curD(), m = SIM.st.maps, i = d.sel, j = i + +a; if (j < 0 || j >= m.length) return; [m[i], m[j]] = [m[j], m[i]]; d.sel = j; P(); },
  dmUpd: () => { const d = curD(); pushD({ k: "map", m: clone(SIM.st.maps[d.sel]), idx: d.sel }); P(); },
  mTmpl: () => { pushD({ k: "tmpl", parent: curD(), tab: "General" }); P(); },
  tTab: a => { curD().tab = a; P(); },
  tAuth: (a, el) => { const m = curD().parent.m; m.auths = el.checked ? [...new Set([...m.auths, a])] : m.auths.filter(x => x !== a); },
  mOk: () => { const d = curD(); SIM.st.maps[d.idx] = d.m; popD(); toast(`Directory map '${d.m.name}' updated.`); P(); },
  /* network areas */
  naSel: a => { curD().sel = +a; P(); },
  naNew: () => { pushD({ k: "naNew", step: 1, kind: "Mask", n: { name: "", level: "Low", gw: false, addrs: [] } }); P(); },
  naGw: (a, el) => { curD().n.gw = el.checked; },
  naNext: () => { const d = curD(); if (!d.n.name.trim()) { d.err = "Specify a name."; return P(); } d.err = ""; d.step = 2; P(); },
  naBack: () => { curD().step = 1; P(); },
  naKind: a => { curD().kind = a; P(); },
  naAdd: () => {
    const d = curD(), ipRe = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const okIp = s => ipRe.test(s || "") && s.split(".").every(x => +x <= 255);
    if (!okIp(d._ip)) { d.err = "Enter a valid IPv4 address."; return P(); }
    if (d.kind === "Range") { if (!okIp(d._to)) { d.err = "Enter a valid end address."; return P(); } d.n.addrs.push({ kind: "Range", ip: d._ip, to: d._to }); }
    else { const mk = +d._mask; if (!(mk >= 0 && mk <= 32) || d._mask === undefined || d._mask === "") { d.err = "Mask size must be 0–32."; return P(); } d.n.addrs.push({ kind: "Mask", ip: d._ip, mask: mk }); }
    d.err = ""; d._ip = ""; d._to = ""; d._mask = undefined; P();
  },
  naFinish: () => { const d = curD(); if (!d.n.addrs.length) { d.err = "Add at least one address."; return P(); } SIM.st.nets.push(d.n); popD(); toast(`Network area ${d.n.name} created.`); P(); },
  /* PVWA */
  pvMenu: a => { SIM.pv.menu = SIM.pv.menu === a ? null : a; SIM.pv.row = null; P(); },
  pvGo: a => { SIM.pv.page = a; SIM.pv.menu = null; SIM.pv.row = null; SIM.pv.gedit = null; if (a === "options") { SIM.pv.opt = null; SIM.pv.optDraft = null; } P(); },
  pvRow: a => { SIM.pv.row = SIM.pv.row === a ? null : a; P(); },
  pvActivate: a => { const u = usr(SIM.st, a); u.tna.forEach(t => { t.active = true; t.viol = 0; }); SIM.pv.row = null; toast(`${a} activated.`); P(); },
  pvToggle: a => { const u = usr(SIM.st, a); u.disabled = !u.disabled; SIM.pv.row = null; toast(`${a} ${u.disabled ? "disabled" : "enabled"}.`); P(); },
  pvEdit: a => { const u = usr(SIM.st, a); SIM.pv.form = Object.assign(clone(u), { isNew: false, orig: a }); SIM.pv.page = "userform"; SIM.pv.row = null; P(); },
  pvNewUser: () => { SIM.pv.form = Object.assign(mkUser("", "\\", { pwSet: false, mustChange: true }), { isNew: true }); SIM.pv.page = "userform"; P(); },
  pfAuth: (a, el) => { const f = SIM.pv.form; f.auths = el.checked ? [...new Set([...f.auths, a])] : f.auths.filter(x => x !== a); },
  pfFlag: (a, el) => { SIM.pv.form[a] = el.checked; },
  pfSave: () => {
    const f = SIM.pv.form;
    if (f.isNew) {
      if (!f.name.trim()) { f.err = "Enter a username."; return P(); }
      if (usr(SIM.st, f.name)) { f.err = "That username already exists."; return P(); }
      if (f._pw !== f._pw2) { f.err = "The passwords don't match."; return P(); }
      if (!pwOk(f._pw)) { f.err = "Password must be 6+ characters with an uppercase letter, a lowercase letter and a digit."; return P(); }
      f.pwSet = true;
    }
    const u = clone(f); delete u.isNew; delete u.orig; delete u.err; delete u._pw; delete u._pw2; delete u._exp;
    u.ifaces = UTYPES[u.type].slice();
    if (f.isNew) SIM.st.users.push(u); else Object.assign(usr(SIM.st, f.orig), u);
    toast(f.isNew ? `User ${u.name} created.` : `User ${u.name} saved.`); SIM.pv.page = "users"; P();
  },
  pvGroupEdit: a => { SIM.pv.gedit = a || null; SIM.pv.row = null; P(); },
  pvMapMove: a => { const [i, d] = a.split(",").map(Number), m = SIM.st.maps, j = i + d; if (j < 0 || j >= m.length) return; [m[i], m[j]] = [m[j], m[i]]; toast("Map order updated."); P(); },
  pvMapEdit: a => { const i = +a; SIM.pv.mform = Object.assign(clone(SIM.st.maps[i]), { isNew: false, idx: i, order: i }); SIM.pv.page = "mapform"; P(); },
  pvMapNew: () => { SIM.pv.mform = { isNew: true, name: "", ldap: "", match: "Exact", type: "EPVUser", auth: "LDAP Authentication", auths: [], loc: "\\", order: SIM.st.maps.length }; SIM.pv.page = "mapform"; P(); },
  mfMatch: a => { SIM.pv.mform.match = a; },
  mfAuth: (a, el) => { const f = SIM.pv.mform; f.auths = el.checked ? [...new Set([...f.auths, a])] : f.auths.filter(x => x !== a); },
  mfSave: () => {
    const f = SIM.pv.mform, st = SIM.st;
    if (!f.name.trim()) { f.err = "Enter a map name."; return P(); }
    if (!f.ldap.trim()) { f.err = "Select the LDAP group for this mapping."; return P(); }
    if (f.match === "Exact" && !st.ad.some(g => g.toLowerCase() === f.ldap.trim().toLowerCase())) { f.err = `No LDAP group named '${f.ldap}' was found (Exact match).`; return P(); }
    const m = { name: f.name.trim(), ldap: f.ldap.trim(), match: f.match, type: f.type, auth: f.auth, auths: f.auths.slice(), loc: f.loc || "\\" };
    if (!f.isNew) st.maps.splice(f.idx, 1);
    st.maps.splice(Math.min(+f.order, st.maps.length), 0, m);
    toast(f.isNew ? `Mapping '${m.name}' added.` : `Mapping '${m.name}' saved.`); SIM.pv.page = "ldap"; P();
  },
  optSel: a => { SIM.pv.opt = a; SIM.pv.optDraft = a !== "GeneralSettings" ? clone(SIM.st.pv[a]) : null; P(); },
  optApply: () => { SIM.st.pv[SIM.pv.opt] = clone(SIM.pv.optDraft); toast(`${SIM.pv.opt}: applied immediately.`); P(); },
  optSave: () => { SIM.st.pv[SIM.pv.opt] = clone(SIM.pv.optDraft); toast(`${SIM.pv.opt}: saved, takes effect after the RefreshPeriod.`); P(); }
});

/* Text inputs and selects inside the simulator bind straight into the open draft. */
function labBind(e) {
  if (!LAB.active) return;
  const t = e.target;
  if (t.dataset.b !== undefined) {
    const d = curD(); if (!d) return; const k = t.dataset.b, v = t.type === "number" ? t.value : t.value;
    if (k.startsWith("_") || k === "q") d[k] = v;
    else if (d.k === "user") { d.u[k] = v; if (k === "type" && e.type === "change") d.u.ifaces = (UTYPES[v] || []).slice(); }
    else if (d.k === "group") d.g[k] = v; else if (d.k === "naNew") d.n[k] = v; else d[k] = v;
    if (e.type === "change" && (k === "type" || k === "auth")) P();
  } else if (t.dataset.tb !== undefined) { curD().parent.m[t.dataset.tb] = t.value; }
  else if (t.dataset.pf !== undefined) {
    const f = SIM.pv.form, k = t.dataset.pf;
    if (k === "_exp") f.neverExpires = t.value === "never"; else f[k] = t.value;
  } else if (t.dataset.mf !== undefined) { const k = t.dataset.mf; SIM.pv.mform[k] = k === "order" ? +t.value : t.value; }
  else if (t.dataset.of !== undefined) { SIM.pv.optDraft[t.dataset.of] = t.value; }
}
document.addEventListener("input", labBind);
document.addEventListener("change", labBind);
/* Clicking anywhere outside an open menu closes it, like a real menu bar. This
   listener is registered before the app's click dispatcher, so the clicked
   action (if any) repaints with the menu already closed. */
document.addEventListener("click", e => {
  if (!LAB.active) return;
  const act = e.target.closest("[data-act]");
  let closed = false;
  if (SIM.pa.menu && !e.target.closest(".menubar")) { SIM.pa.menu = null; closed = true; }
  if ((SIM.pv.menu || SIM.pv.row) && !e.target.closest(".pvdd") && !e.target.closest(".pvn") && !e.target.closest(".pvdots")) { SIM.pv.menu = null; SIM.pv.row = null; closed = true; }
  if (closed && !act) P();
});
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#/lab/")) LAB.active = false; });
