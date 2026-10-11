/* Lessons, references and the cheat sheet for the Configure User Management lab.
   Every fact here was checked against the official PAM Self-Hosted documentation
   (docs.cyberark.com/pam-self-hosted/latest, v15.2) - see REF for the exact pages. */

const DOCS = "https://docs.cyberark.com/pam-self-hosted/latest/en/content/";
const REF = {
  overview:    ["Understand user and group management", DOCS + "pasimp/users-groups-managing-overview.htm"],
  predefined:  ["Predefined users and groups", DOCS + "pasimp/predefined-users-and-groups.htm"],
  addUserPA:   ["Add and manage users in PrivateArk", DOCS + "pasimp/users-groups-add-users-pa.htm"],
  addGroupPA:  ["Add and manage groups in PrivateArk", DOCS + "pasimp/users-groups-add-groups-pa.htm"],
  usersPVWA:   ["Manage users (PVWA)", DOCS + "pasimp/users-groups-manage-users-v10.htm"],
  addUserPVWA: ["Add a user (PVWA)", DOCS + "pasimp/users-groups-add-users-v10.htm"],
  groupsPVWA:  ["Add and manage groups (PVWA)", DOCS + "pasimp/users-groups-manage-groups-v10.htm"],
  ldapUsers:   ["Manage LDAP users", DOCS + "pas%20inst/user-management-with-ldap-introduction.htm"],
  ldapVault:   ["Configure the Vault for LDAP", DOCS + "pas%20inst/configuring-transparent-user-management.htm"],
  ldapSetup:   ["Set up LDAP integration & manage directory maps", DOCS + "landing%20pages/lpldapintegration.htm"],
  ldapSync:    ["Synchronize external users and groups", DOCS + "pas%20inst/synchronizing-external-users-and-groups-in-the-vault-with-the-external-directory.htm"],
  extUsers:    ["Manage external user accounts", DOCS + "pasimp/modifying-external-user-accounts.htm"],
  ldapSafe:    ["Safe ownership for external users and groups", DOCS + "pasimp/managing-safe-ownership-for-ldap-users-and-groups.htm"],
  ldapConn:    ["Configure LDAP connectivity for users' logon", DOCS + "pasimp/configuring-ldap-connectivity-for-users-logon.htm"],
  ldapRef:     ["LDAP Integration parameters (directories, hosts)", DOCS + "pasref/ldap%20integration%20-%20directories.htm"],
  ldapRefMain: ["LDAP Integration parameters", DOCS + "pasref/ldap%20integration%20-%20introduction.htm"],
  multiDir:    ["Users and groups in multiple external directories", DOCS + "pasimp/managing-users-and-groups-who-are-listed-in-multiple-directories.htm"],
  authOverview:["How users authenticate to PAM - Self-Hosted", DOCS + "pas%20inst/authenticating-to-the-privileged-account-security-solution.htm"],
  authPVWA:    ["Define authentication methods in PVWA", DOCS + "pas%20inst/defining-authentication-methods-in-pvwa.htm"],
  authOptions: ["PVWA Options - Authentication Methods", DOCS + "pasref/options%20-%20authentication%20methods.htm"],
  ldapAuth:    ["LDAP authentication", DOCS + "pas%20inst/ldap-authentication.htm"],
  radius:      ["RADIUS authentication", DOCS + "pas%20inst/radius-authentication.htm"],
  windowsAuth: ["Windows authentication", DOCS + "pas%20inst/windows-authentication.htm"],
  pki:         ["PKI authentication (Personal Certificate)", DOCS + "pas%20inst/pki-authentication-personal-certificate.htm"],
  saml:        ["SAML authentication", DOCS + "pas%20inst/saml-authentication.htm"],
  pwAuth:      ["Password authentication", DOCS + "pas%20inst/cyberark-password-authentication.htm"],
  netAreas:    ["Network areas", DOCS + "pasimp/network-areas.htm"],
  trustedNet:  ["Apply trusted network configurations", DOCS + "pasimp/trusted-network-areas.htm"],
  dbparm:      ["DBParm.ini reference", DOCS + "pasref/dbparm.ini.htm"],
  roSuspend:   ["Reactivate a suspended user in a Read-Only Vault", DOCS + "pasimp/reactivating-a-suspended-user.htm"],
  restAddUser: ["REST API - Add user", DOCS + "sdk/api-adduser-v10.htm"],
  restActivate:["REST API - Activate user", DOCS + "sdk/activate-user-v10.htm"],
  restMember:  ["REST API - Add member to group", DOCS + "webservices/addmembertogroup%20v10.htm"],
  restGroup:   ["REST API - Create group", DOCS + "webservices/rest-api-create-group.htm"],
  pacli:       ["PACLI user management functions", DOCS + "pacli/user-management-functions.htm"],
  addMember:   ["Add a Safe member", DOCS + "pasimp/safes-add-a-safe-member.htm"],
  manMember:   ["Manage Safe members", DOCS + "pasimp/safes-manage-safe-members.htm"],
  pvwaUsers:   ["PVWA Options - Users", DOCS + "pasref/options%20-%20users.htm"],
  msgUsers:    ["Users and Groups messages", DOCS + "messages/users%20and%20groups.htm"]
};

/* The 10 objectives of this lab. Together they cover the "Configure user management"
   content area of the PAM-DEF exam (user model, types, authorizations, predefined
   objects, LDAP, mappings, authentication, restrictions, tooling, and Safe membership). */
const OBJECTIVES = [
  { id: "O1",  short: "User model",        name: "Users, groups & the Vault hierarchy", icon: "👥" },
  { id: "O2",  short: "User types",        name: "User types & authorized interfaces", icon: "🪪" },
  { id: "O3",  short: "Vault auths",       name: "Vault authorizations", icon: "🔑" },
  { id: "O4",  short: "Predefined",        name: "Predefined users & groups", icon: "🏛️" },
  { id: "O5",  short: "LDAP setup",        name: "LDAP integration: getting connected", icon: "🔌" },
  { id: "O6",  short: "Directory maps",    name: "Directory mappings & external users", icon: "🗺️" },
  { id: "O7",  short: "Authentication",    name: "Authentication methods", icon: "🔐" },
  { id: "O8",  short: "Restrictions",      name: "Restricting & recovering access", icon: "⏱️" },
  { id: "O9",  short: "Where to click",    name: "Tools & navigation paths", icon: "🧭" },
  { id: "O10", short: "Users ↔ Safes",     name: "Users meet Safes", icon: "🗄️" }
];

/* Lesson format: intro, cards (teach first), traps, say-it-out-loud prompts, key points.
   Cards are HTML strings so tables and diagrams can live inline. */
const LESSONS = {
O1: {
  mins: 7,
  intro: "Before LDAP, maps or authorizations make sense you need the Vault's mental model: what a <b>user</b> is, where users live, and who can see whom.",
  cards: [
    { h: "Users are not accounts", html: `
      <p><b>Users</b> are identities that log on to the Vault - people, applications and CyberArk components (CPM, PVWA, PSM...).</p>
      <p><b>Accounts</b> are the privileged credentials stored <i>inside</i> Safes. "User management" on the exam is always about the first kind.</p>` },
    { h: "Two kinds of users", html: `
      <table class="t"><tr><th></th><th>Internal (CyberArk) user</th><th>External (LDAP / "transparent") user</th></tr>
      <tr><td>Created by</td><td>An admin, in PrivateArk, PVWA, REST or PACLI</td><td>The Vault, automatically, when a <b>directory map</b> matches</td></tr>
      <tr><td>Personal details</td><td>Edited in the Vault</td><td>Pulled from LDAP at every logon. Change them <b>in the directory</b></td></tr>
      <tr><td>Security attributes</td><td>Set on the user</td><td>Come from the map's <b>user template</b></td></tr></table>` },
    { h: "When does an external user actually appear?", html: `
      <p>Adding someone to an AD group does <b>nothing</b> in the Vault by itself. An external user account is created the <b>first time the user is referenced</b>:</p>
      <ol><li>the user <b>logs on</b> to the Vault</li><li>the user is <b>added as a Safe member</b></li><li>the user is <b>added as a group member</b></li><li>the user is <b>added to a report</b></li></ol>
      <p>External <b>groups</b> are created when an LDAP group is added <b>as a Safe member</b> or <b>as a member of a Vault group</b>.</p>` },
    { h: "The user hierarchy (locations)", html: `
      <p>Users sit in <b>locations</b> that mirror the org chart: <code>\\</code> (root), <code>\\IT</code>, <code>\\IT\\Unix</code>...</p>
      <p>A <b>user manager</b> (someone with Add/Update Users) can create and update users at the <b>same level or lower</b>, never above. If the Engineering manager is away, any manager <i>above</i> Engineering can update Engineering's users.</p>` },
    { h: "Who can see whom", html: `
      <p>Users don't see the whole directory. A user can see another user only when:</p>
      <ul><li>they hold <b>Audit Users</b>: everyone in the same location <b>and its sub-locations</b></li>
      <li>they share a <b>Safe</b> and have <b>View Safe Members</b> there</li>
      <li>they are members of the <b>same group</b></li></ul>
      <p>So someone in IT normally can't see that Finance users exist.</p>` },
    { h: "Groups", html: `
      <p>A group lets many users share the same Safe access: change the group's Safe permissions and every member changes.</p>
      <p>User and group names: up to <b>128 characters</b>, and the <b>first 28 must be unique</b>.</p>
      <p>An <b>LDAP group</b> in the Vault is managed in AD. In the PrivateArk Users and Groups window, only <b>Delete</b> and <b>Safe Ownership</b> are available for it.</p>` },
    { h: "Deleting an external user", html: `
      <p>Deleting an LDAP user in the Vault only erases changes made in the Vault. If they're still in the directory and still match a map, the <b>next logon creates them again</b>.</p>
      <p>To really remove access, remove them <b>in the directory</b>. The Vault user is then erased at the next synchronization.</p>` }
  ],
  traps: [
    "Adding a person to the mapped AD group does not create them in the Vault. Their first reference (logon, Safe member, group member, report) does.",
    "You cannot edit an LDAP user's name, email or phone in the Vault. Those come from the directory at every logon.",
    "Add/Update Users works at your level and below, never above."
  ],
  say: [
    { q: "Explain why deleting an LDAP user in the Vault does not revoke their access.", a: "Because the Vault account is just a copy created from the directory. If the person still exists in AD and still matches a directory map, the next time they log on (or are added to a Safe or group) the Vault simply creates a new external account. To revoke access you remove or disable them in the directory; the next sync then erases the Vault copy." }
  ],
  key: [
    "Users log on; accounts are stored in Safes.",
    "External users are created on first reference: logon, Safe member, group member, report.",
    "LDAP users' personal details come from the directory; security attributes come from the map template.",
    "User managers act on their own level and lower.",
    "You see users through Audit Users scope, a shared Safe with View Safe Members, or a shared group.",
    "Names are up to 128 characters; the first 28 must be unique."
  ]
},

O2: {
  mins: 6,
  intro: "Every Vault user has a <b>user type</b>. The license defines the types, and each type decides <b>which interfaces</b> the user may use. That's how you lock a user to \"PVWA only\".",
  cards: [
    { h: "Default user types", html: `
      <table class="t"><tr><th>User type</th><th>What it is</th><th>Allowed interfaces</th></tr>
      <tr><td><b>EPVUser</b></td><td>Standard end user (the default)</td><td>PVWA, PrivateArk Client, Webclient, PACLI, PIMSU</td></tr>
      <tr><td><b>BizUser</b></td><td>Business user</td><td>PVWA only</td></tr>
      <tr><td><b>PSMUser</b></td><td>PSM end user (PSM workflows only)</td><td>PSM, PVWA</td></tr>
      <tr><td>CPM / PVWA / PSM / ENE</td><td>Component users</td><td>Their own component</td></tr>
      <tr><td>AppProvider</td><td>Credential Provider component</td><td>Application Provider</td></tr>
      <tr><td>AIMAccount</td><td>Application account end user</td><td>Application Provider, PVToolkit</td></tr>
      <tr><td>PSMPServer</td><td>PSM for SSH server</td><td>PSMPAPP</td></tr></table>
      <p class="mut">The <b>License Capacity report</b> shows the licensed maximum and current use for each user type.</p>` },
    { h: "Interface IDs you'll see", html: `
      <table class="t"><tr><th>Interface</th><th>ID</th></tr>
      <tr><td>PrivateArk Client / Webclient</td><td><code>WINCLIENT</code> (<code>GUI</code> before v4.6)</td></tr>
      <tr><td>PVWA</td><td><code>PVWA</code></td></tr><tr><td>PVWA application & gateway user</td><td><code>PVWAApp</code></td></tr>
      <tr><td>PrivateArk CLI</td><td><code>PACLI</code></td></tr><tr><td>OPM</td><td><code>PIMSU</code></td></tr>
      <tr><td>Credential Provider</td><td><code>AppPrv</code></td></tr><tr><td>CPM / PSM / ENE</td><td><code>CPM</code> / <code>PSM</code> / <code>ENE</code></td></tr></table>` },
    { h: "Restricting one user's interfaces", html: `
      <ul><li><b>PrivateArk Client</b>: Users and Groups → select user → <b>Update</b> → <b>General</b> tab → User type → <b>Authorized Interfaces</b>. Move interfaces between the Authorized and Available lists.</li>
      <li><b>PVWA</b>: User Provisioning → Users → create/edit → User type → <b>Authorized interface</b>.</li>
      <li><b>REST</b> (Add/Update user): <code>unAuthorizedInterfaces</code>. Note it's a <b>block list</b>, e.g. <code>["PSM","PSMP"]</code>.</li></ul>
      <p>Interfaces are <b>not</b> controlled by Vault authorizations or Safe permissions.</p>` },
    { h: "Gateway accounts and the PVWA's own users", html: `
      <p>The <b>Gateway Account</b> checkbox (General tab) marks a user as a gateway account. A gateway account can only authenticate with <b>password or RADIUS</b>.</p>
      <table class="t"><tr><th>PVWA option</th><th>Default</th><th>Meaning</th></tr>
      <tr><td>GWUserName</td><td>PVWAGWUser</td><td>The user the PVWA uses to access the Vault (credential file <code>gwuser.ini</code>)</td></tr>
      <tr><td>ApplicationUserName</td><td>PVWAAppUser</td><td>Vault user for PVWA internal tasks</td></tr>
      <tr><td>PVWAAccountGroup</td><td>PVWAGWAccounts</td><td>Gateway-accounts group shared with every Safe accessed through PVWA</td></tr></table>` },
    { h: "The rest of the General tab", html: `
      <ul><li><b>Location</b>: where the user sits in the hierarchy</li><li><b>Disable User</b>: temporarily inaccessible (an admin action)</li>
      <li><b>Quota</b>: disk space for the user</li><li><b>Monitoring</b>: email if a component user can't connect to its interfaces</li></ul>` }
  ],
  traps: [
    "\"Can a user be restricted to PVWA or PACLI?\" Yes, through user type and Authorized Interfaces.",
    "REST uses unAuthorizedInterfaces, a list of interfaces to block.",
    "Gateway accounts: password or RADIUS only."
  ],
  say: [
    { q: "A contractor should only ever use the web portal. Walk through two ways to enforce that.", a: "Either give them the BizUser type (PVWA-only by license), or keep EPVUser and remove WINCLIENT and PACLI (and PIMSU) from their Authorized Interfaces, under PrivateArk Users and Groups → Update → General → Authorized Interfaces, or in PVWA under the user's type → Authorized interface. Vault authorizations and Safe permissions have nothing to do with interfaces." }
  ],
  key: [
    "User type (from the license) decides which interfaces a user may use.",
    "EPVUser = PVWA, PrivateArk Client, Webclient, PACLI, PIMSU. BizUser = PVWA only.",
    "PrivateArk Client = WINCLIENT.",
    "Restrict per user: General tab → Authorized Interfaces (PrivateArk) / Authorized interface (PVWA) / unAuthorizedInterfaces (REST).",
    "Gateway accounts authenticate with password or RADIUS only."
  ]
},

O3: {
  mins: 8,
  intro: "This is where most points hide. CyberArk has <b>two permission layers</b>, and the exam keeps asking which layer a power lives in and who can hold it.",
  cards: [
    { h: "Two layers", html: `
      <div class="two"><div class="box"><b>Vault authorizations</b><br>Vault-wide admin powers, set <b>on a user</b>.<br><span class="mut">Examples: Add Safes, Audit Users, Activate Users.</span></div>
      <div class="box"><b>Safe member permissions</b><br>What you may do <b>inside one Safe</b>, granted to users <b>or groups</b>.<br><span class="mut">Examples: List, Use, Retrieve, Manage Safe Members.</span></div></div>` },
    { h: "The 10 Vault authorizations", html: `
      <table class="t"><tr><th>Authorization</th><th>Lets the user...</th><th>PACLI flag</th><th>REST value</th></tr>
      <tr><td><b>Add Safes</b></td><td>Create Safes</td><td>SAFESADMIN</td><td>AddSafes</td></tr>
      <tr><td><b>Audit Users</b></td><td>See and track users in their location and below</td><td>AUDITADMIN</td><td>AuditUsers</td></tr>
      <tr><td><b>Add/Update Users</b></td><td>Add and update users (incl. their network areas) and locations, at the same level or lower</td><td>USERSADMIN</td><td>AddUpdateUsers</td></tr>
      <tr><td><b>Reset Users' Passwords</b></td><td>Reset passwords and set "User must change password at next logon", same level or lower</td><td>RESETPASSWORD</td><td>ResetUsersPasswords</td></tr>
      <tr><td><b>Activate Users</b></td><td>Activate or deactivate users' trusted network areas, i.e. <b>unsuspend</b></td><td>ACTIVATEUSERS</td><td>ActivateUsers</td></tr>
      <tr><td><b>Add Network Areas</b></td><td>Add, update and remove network areas</td><td>NETWORKSADMIN</td><td>AddNetworkAreas</td></tr>
      <tr><td><b>Manage Directory Mapping</b></td><td>Add, update and remove directory maps</td><td>RULESADMIN</td><td>ManageDirectoryMapping</td></tr>
      <tr><td><b>Manage Server File Categories</b></td><td>Manage file categories</td><td>CATEGORIESADMIN</td><td>ManageServerFileCategories</td></tr>
      <tr><td><b>Backup All Safes</b></td><td>Run backups</td><td>BACKUPADMIN</td><td>BackupAllSafes</td></tr>
      <tr><td><b>Restore All Safes</b></td><td>Run restores</td><td>RESTOREADMIN</td><td>RestoreAllSafes</td></tr></table>` },
    { h: "Users only, never groups", html: `
      <p>Vault authorizations are set on a <b>user's</b> Authorizations tab, either a CyberArk user or an LDAP user. A Vault group has <b>no Authorizations tab</b>, and the REST <i>Create group</i> call has no authorization field.</p>
      <p><b>To give a whole AD group an authorization</b>, put it in the <b>directory map's user template</b> (Authorization section). The template is applied when an LDAP user is created, and again when an existing LDAP user logs on or is added to a Safe or group.</p>` },
    { h: "The combos the exam loves", html: `
      <table class="t"><tr><th>To...</th><th>you need</th></tr>
      <tr><td>Edit user accounts</td><td>Audit Users + Add/Update Users</td></tr>
      <tr><td>Reset other users' passwords</td><td>Audit Users + Reset Users' Passwords</td></tr>
      <tr><td>Activate (unsuspend) users</td><td>Audit Users + Activate Users</td></tr>
      <tr><td>Set up a user's Trusted Network Areas</td><td>Add/Update Users + Audit Users</td></tr>
      <tr><td>Activate/deactivate Trusted Network Areas</td><td>Activate Users</td></tr>
      <tr><td>Set up LDAP integration (PVWA)</td><td>Vault Admins member + Audit Users + Manage Directory Mapping</td></tr>
      <tr><td>Add users through REST</td><td>Add/Update Users</td></tr></table>
      <p>Audit Users appears in most combos for a simple reason: you can't manage a user you can't see.</p>` },
    { h: "You can only grant what you hold", html: `
      <p>The REST docs say it directly: <i>"To apply specific authorizations to a user, the user who runs this API must have the same authorizations."</i> The same rule applies to Safes: you can only assign the permissions <b>your own user has</b>.</p>
      <p>So the statement "an admin can only grant other users privileges they themselves have" is <b>TRUE</b>.</p>` }
  ],
  traps: [
    "Manage Safe Members, View Audit Log and Unlock accounts are Safe permissions, not Vault authorizations.",
    "Activate Users (unsuspend a person) is not the same as Unlock accounts (release a checked-out account).",
    "Vault authorizations go to users (internal or LDAP), never groups. For many LDAP users, use the map template.",
    "Reset Users' Passwords alone isn't enough to reset someone's password. You need Audit Users too."
  ],
  say: [
    { q: "A colleague wants to give the Auditors group the Audit Users authorization. Explain why that fails and what to do instead.", a: "Vault authorizations live on users, not groups; a Vault group has no Authorizations tab. If the auditors come from AD, edit the auditors' directory map (for example Vault Auditors Mapping) and add Audit Users to its user template. Each existing auditor picks it up at their next logon. For internal users, set it on each user's Authorizations tab." }
  ],
  key: [
    "Vault authorizations are Vault-wide and set on users (internal or LDAP). Safe permissions are per Safe and can go to users or groups.",
    "Know all 10, plus their PACLI flags: SAFESADMIN, AUDITADMIN, USERSADMIN, RESETPASSWORD, ACTIVATEUSERS, NETWORKSADMIN, RULESADMIN, CATEGORIESADMIN, BACKUPADMIN, RESTOREADMIN.",
    "Unsuspend = Audit Users + Activate Users. Reset password = Audit Users + Reset Users' Passwords. Edit user = Audit Users + Add/Update Users.",
    "You can only grant authorizations you hold yourself.",
    "For an AD group: put the authorization in the directory map's user template."
  ]
},

O4: {
  mins: 7,
  intro: "Installation creates a set of <b>predefined users and groups</b>. Every one of them except Master starts <b>disabled</b>. Know what each one does, and what it can't do.",
  cards: [
    { h: "Predefined users", html: `
      <table class="t"><tr><th>User</th><th>What it does</th></tr>
      <tr><td><b>Master</b></td><td>Every Safe member authorization <b>except Authorize password requests</b>. Can't be removed from any Safe. Logs on <b>only with the Master CD</b> (Private Recovery Key). The only user who can edit <b>System Safe</b> properties. For full recovery, not daily work.</td></tr>
      <tr><td><b>Administrator</b></td><td>Top of the user hierarchy with all possible permissions. Creates and manages users on <b>any</b> level.</td></tr>
      <tr><td><b>Auditor</b></td><td>In the Auditors group. Top of the hierarchy so it can see all users. Produces Safe and user activity reports.</td></tr>
      <tr><td><b>Operator</b></td><td>In Operators. Has <b>Manage Safe</b> (properties, compress, size) but can't see Safe contents, logs or the Owners list.</td></tr>
      <tr><td><b>Backup</b></td><td>In Backup Users. Backup Safe authorization.</td></tr>
      <tr><td><b>DR</b></td><td>In DR Users. Replicates Safes to the DR Vault.</td></tr>
      <tr><td><b>Batch</b></td><td>Internal user that <b>can't be logged on to</b>. Clears expired user and Safe history.</td></tr>
      <tr><td><b>NotificationEngine</b></td><td>The ENE's user. In Notification Engines.</td></tr></table>` },
    { h: "Activating a predefined user", html: `
      <ol><li>Log on to the <b>PrivateArk Client as Master</b>.</li><li>Open the user's properties → <b>General</b> tab → clear <b>Disable User</b>.</li>
      <li><b>Authentication</b> tab → change the default password to something non-obvious.</li></ol>` },
    { h: "Predefined groups", html: `
      <table class="t"><tr><th>Group</th><th>Purpose</th></tr>
      <tr><td><b>Vault Admins</b></td><td>Vault administrators. Auto-added to the <b>System Safe</b>, the Notification Engine Safe, the <b>CPM</b> Safes, the PVWA config Safes (PVWAConfig, PVWAUserPrefs, VaultInternal...), and the <b>PSM</b> and recording Safes. Not every Safe.</td></tr>
      <tr><td><b>Auditors</b></td><td>View audit + View Safe Members on Safes</td></tr>
      <tr><td><b>Operators</b></td><td>Manage Safe</td></tr>
      <tr><td><b>Backup Users</b> / <b>DR Users</b></td><td>Backup Safe, for backup / DR replication</td></tr>
      <tr><td><b>Notification Engines</b></td><td>View audit + View Safe Members, so ENE can notify (no access to contents)</td></tr>
      <tr><td><b>PVWAGWAccounts</b></td><td>Gateway accounts, shared with every Safe accessed through PVWA</td></tr>
      <tr><td><b>PVWAMonitor</b></td><td>Members can monitor the Vault (PVWAMonitorGroup)</td></tr>
      <tr><td><b>PVWAAccountsFeedAdmins</b></td><td>All Accounts Feed tasks: discovery, pending accounts, onboarding rules</td></tr></table>
      <p>The PVWA's <b>PVWASystemGroup</b> defaults to <b>Vault Admins</b>. Its members can open the System Configuration (Administration) page.</p>` },
    { h: "Which groups land on new Safes?", html: `
      <p><code>AutomaticallyAddBuiltInGroups</code> (DBParm.ini). Default after a clean install: <b>Backup Users, DR Users, Operators, Auditors, Notification Engine</b>. After an upgrade, Notification Engine isn't included.</p>
      <p>Removing them from Safes is controlled by <code>PreDefinedUsersOwnerRemoval</code> / <code>PreDefinedGroupsOwnerRemoval</code> (default <b>None</b>). Set a value, e.g. <code>PreDefinedGroupsOwnerRemoval=Operators</code>, then <b>restart the Vault</b>. Master can never be removed.</p>` }
  ],
  traps: [
    "Vault Admins is not auto-added to every Safe, only the system and component Safes.",
    "Master can't authorize password requests, can't be removed, and only logs on with the Master CD.",
    "Operator can manage a Safe's properties without seeing anything inside it.",
    "Batch can never log on.",
    "All predefined users except Master start disabled."
  ],
  say: [
    { q: "Why can the Operator open a Safe yet see nothing inside it?", a: "Operators only have Manage Safe, which allows Safe properties and housekeeping like compressing or resizing. None of their authorizations allow listing or retrieving contents, viewing logs or viewing the Owners list. So the Safe opens but appears empty to them." }
  ],
  key: [
    "Master: all Safe authorizations except Authorize password requests. Can't be removed. Master CD only. Sole editor of System Safe properties.",
    "Administrator: top-level user manager. Auditor: activity reports. Operator: Manage Safe without contents. Batch: internal, no logon.",
    "Every predefined user except Master starts disabled. Activate as Master: clear Disable User, change the password.",
    "AutomaticallyAddBuiltInGroups (clean install) = Backup Users, DR Users, Operators, Auditors, Notification Engine.",
    "PreDefinedUsers/GroupsOwnerRemoval default None; change it and restart the Vault.",
    "PVWASystemGroup = Vault Admins. PVWAGWAccounts is on every PVWA-accessed Safe."
  ]
},

O5: {
  mins: 8,
  intro: "Transparent user management means the <b>Vault itself</b> queries your LDAP directory. Most LDAP exam questions are really about the plumbing: name resolution, certificates, ports and who is allowed to configure it.",
  cards: [
    { h: "How a logon flows", html: `
      <div class="flow"><span>PVWA asks the Vault about a user</span><i>→</i><span>Not in the Vault DB</span><i>→</i><span>Vault looks the user up in LDAP</span><i>→</i><span>A directory map matches</span><i>→</i><span>External user created; operation completes</span></div>
      <p>The same flow creates an external <b>group</b> when an LDAP group is referenced.</p>` },
    { h: "Prerequisites checklist", html: `
      <ul class="check"><li><b>Bind account</b> in AD with <b>read-only</b> rights to the tree holding your users and groups. It never creates or modifies anything.</li>
      <li><b>Hosts file on the Vault</b> (<code>%SystemRoot%\\System32\\Drivers\\Etc\\hosts</code>): one line for <b>every domain controller</b>, IP + FQDN. The hardened Vault isn't configured with a DNS server.</li>
      <li><b>LDAPS</b>: import the <b>CA certificate that signed the DCs' certificate</b> into <b>Trusted Root Certification Authorities (Local Computer)</b> on the Vault, and on the PVWA too. Don't use self-signed certificates.</li>
      <li>Port <b>636</b> for LDAPS (389 for plain LDAP). With SSL the host name must be the <b>DNS name that matches the certificate subject</b>, not an IP.</li>
      <li>The person configuring it: member of <b>Vault Admins</b> with <b>Audit Users</b> + <b>Manage Directory Mapping</b>.</li></ul>` },
    { h: "The PVWA wizard (modern UI)", html: `
      <ol><li>User Provisioning → <b>LDAP Integration</b> → <b>New Domain</b></li>
      <li><b>Define domain</b>: domain name, Use secure connection (SSL), bind user name (<code>user@domain</code> or <code>domain\\user</code>), bind password, domain base context</li>
      <li><b>Select domain controllers</b> from the detected list → Connect</li>
      <li><b>Create directory mapping</b> for the roles Vault Admins, Safe managers, Auditors, Users (you can skip this and map later)</li>
      <li>Review the <b>Summary</b> → Save</li></ol>
      <p class="mut">Classic UI: Administration → Setup Wizard. You must click <b>Test</b> before you can continue. "Server is down" usually means a bad hosts entry or no route to the DC.</p>` },
    { h: "Where it's stored and what to leave alone", html: `
      <ul><li>Settings live in <b>LDAPConf.xml</b> in the <b>VaultInternal</b> Safe. Don't edit the file directly; use the PVWA.</li>
      <li>The bind password is stored in VaultInternal (<code>PasswordObjectPath</code>). The CPM can manage it.</li>
      <li>The AD profile is <code>MicrosoftADProfile.ini</code>. The directory <b>name must not change</b> once external users exist.</li>
      <li><code>RequireLDAPConnectivity</code> (DBParm.ini), default <b>No</b>: the Vault starts even if LDAP is unreachable. Set it to Yes to refuse startup without LDAP.</li></ul>` },
    { h: "Several domains", html: `
      <p>If two trusted domains both contain a <code>jsmith</code>, set <b>AddDomainToUserName=Yes</b> (LDAP Integration → LDAP) and set each directory's DomainName. Vault users become <code>jsmith@Company.com</code>. Don't combine it with AppendFriendlyDomainNameToGroup. Supported for Microsoft AD only.</p>` }
  ],
  traps: [
    "A new DC means a new hosts-file line on the Vault, and adding it to the directory's Hosts list.",
    "LDAPS needs the issuing CA's certificate in Trusted Root, not a server certificate for the Vault.",
    "636 = LDAPS, 389 = LDAP, 1858 = the Vault's own port.",
    "The bind account is read-only.",
    "LDAP config is LDAPConf.xml in VaultInternal, not DBParm.ini."
  ],
  say: [
    { q: "LDAPS to the new DC fails. List the three things you check on the Vault first.", a: "1) The hosts file has the DC's IP and FQDN, because the Vault has no DNS. 2) The CA certificate that issued the DC's certificate is in Trusted Root Certification Authorities (Local Computer). 3) The directory host is configured by FQDN matching the certificate subject, on port 636 with SSL enabled." }
  ],
  key: [
    "Bind account: read-only.",
    "Vault hosts file: an entry for every DC (no DNS on the Vault).",
    "LDAPS: issuing CA cert → Trusted Root CAs (Local Computer) on the Vault and PVWA. Port 636. FQDN must match the certificate subject.",
    "Configure as a Vault Admins member with Audit Users + Manage Directory Mapping.",
    "Wizard: Define domain → Select DCs → Map roles → Summary.",
    "Config = LDAPConf.xml in VaultInternal. RequireLDAPConnectivity defaults to No."
  ]
},

O6: {
  mins: 9,
  intro: "A <b>directory map</b> decides <b>whether</b> an LDAP user may be created in the Vault and <b>with what attributes</b>. Map order, template contents and the sync rules are favorite exam targets.",
  cards: [
    { h: "Anatomy of a directory map", html: `
      <div class="two"><div class="box"><b>Rules / mapping criteria</b><br>Which users get in: an LDAP group (Exact or Contains), or a directory + branch with optional query/group filters.</div>
      <div class="box"><b>User template</b><br>What they get: <b>user type</b>, <b>authentication method</b>, <b>Vault authorizations</b>, <b>time limitations</b>, location.</div></div>
      <p>A map grants <b>Vault-level</b> attributes. It does <b>not</b> grant Safe permissions; those come from Safe membership.</p>` },
    { h: "Map order: first match wins", html: `
      <p>Maps are evaluated <b>top to bottom</b>; the first map in the list has the highest priority. Use the arrows (or Map order) to move a map.</p>
      <p><b>Classic bug</b>: a broad map (e.g. one that matches every CyberArk user) sits above the Vault Admins map, so admins are created with the broad map's template and get no authorizations. Fix: move the specific map up.</p>` },
    { h: "The four built-in maps", html: `
      <table class="t"><tr><th>Map</th><th>Applies to</th><th>Type / Auth</th><th>Authorizations</th></tr>
      <tr><td>Vault Users Mapping</td><td>Users</td><td>EPVUser / LDAP</td><td>None</td></tr>
      <tr><td>Vault Groups Mapping</td><td>Groups</td><td>n/a</td><td>None (maps to base context)</td></tr>
      <tr><td>Vault Auditors Mapping</td><td>Users</td><td>EPVUser / LDAP</td><td><b>Audit Users</b></td></tr>
      <tr><td>Vault Admins Mapping</td><td>Users</td><td>EPVUser / LDAP</td><td><b>All</b></td></tr></table>` },
    { h: "Default roles → Vault groups (modern wizard)", html: `
      <table class="t"><tr><th>Role / external group</th><th>Also added to Vault group(s)</th></tr>
      <tr><td>Vault Admins</td><td>Vault Admins + PVWAMonitor</td></tr><tr><td>Safe managers</td><td>PVWAMonitor</td></tr>
      <tr><td>Auditors</td><td>Auditors + PVWAMonitor</td></tr><tr><td>Users</td><td><b>none</b> (log on only; Safe membership gives rights later)</td></tr></table>
      <p class="mut">The classic wizard has no Safe managers role, and its Auditors role maps to Auditors only.</p>` },
    { h: "When template changes take effect", html: `
      <p>Changed a map's authorizations? They're applied when a <b>new</b> LDAP user is created, or when an <b>existing</b> LDAP user <b>logs on again</b> or is <b>added as a Safe member or group member</b>. That's why "all auditors lack Audit Users" is fixed in the <b>auditors' map</b>, not on the Auditors group.</p>` },
    { h: "Delegation recipe: let ServiceDesk unsuspend users", html: `
      <ol><li>Sign in to the PVWA as a Vault Admins member with <b>Manage Directory Mapping</b></li><li>User Provisioning → LDAP Integration → <b>Add Mapping</b> (name, <b>map order</b> above the generic users map)</li>
      <li>Mapping scope: the <b>ServiceDesk</b> LDAP group</li><li>User template → Authorization: <b>Activate Users</b> (+ Audit Users so they can see the users)</li><li>Save. Members get it at their next logon.</li></ol>` },
    { h: "Synchronization and deletion (DBParm.ini)", html: `
      <table class="t"><tr><th>Parameter</th><th>Default</th><th>Meaning</th></tr>
      <tr><td>AutoSyncExternalObjects</td><td><code>Yes,24,1,5</code></td><td>Sync once per 24 hours, between 01:00 and 05:00</td></tr>
      <tr><td>ExternalObjectsUpdatePolicy</td><td><code>UpdateAll</code></td><td>Update external users and groups with directory changes</td></tr>
      <tr><td>ExternalObjectsDeletionPolicy</td><td><code>DeleteAll</code></td><td>Delete objects that no longer exist in the directory <b>or</b> no longer match a map</td></tr></table>
      <p>Even with DeleteAll, a user who is <b>disabled or expired</b> in AD is <b>not deleted</b>. Deletion happens when the user is removed from the directory, moved out of scope, or matches no map.</p>
      <p><code>GroupRecursiveSearch</code> defaults to <b>No</b>: <b>nested</b> AD groups aren't searched, so a user who is only in a nested group won't match.</p>` },
    { h: "LDAP groups inside Vault groups", html: `
      <p>PrivateArk: Users and Groups → select the <b>Vault group</b> → <b>Update</b> → Members → <b>Add</b> → choose <b>LDAP Group</b> (or <b>Add from LDAP</b> to search the directory). A user's own memberships are on the user's <b>Member Of</b> tab.</p>
      <p>REST: <code>POST /API/UserGroups/{id}/Members</code> with <code>memberType: "domain"</code> + <code>domainName</code>.</p>` }
  ],
  traps: [
    "Map order: the first match wins, and the top of the list is the highest priority.",
    "Maps give Vault authorizations and attributes, not Safe permissions.",
    "Template changes reach existing users at their next logon.",
    "A user disabled in AD isn't deleted by the sync, even with DeleteAll.",
    "Nested groups aren't searched by default (GroupRecursiveSearch=No)."
  ],
  say: [
    { q: "Your Vault Admins log on fine but have no admin rights. Their AD group is correct. What happened?", a: "Map order. A broader map, such as a users map that also matches them, is higher in the list, so it's the first match and its template (no authorizations) is applied. Move the Vault Admins map above it. The admins pick up the right template at their next logon." }
  ],
  key: [
    "Map = rules (who) + user template (user type, auth method, Vault authorizations, time limits, location).",
    "Map order: the first match wins.",
    "Built-in maps: Users (none), Groups, Auditors (Audit Users), Admins (All). All EPVUser + LDAP auth.",
    "Wizard roles: Vault Admins→Vault Admins+PVWAMonitor, Safe managers→PVWAMonitor, Auditors→Auditors+PVWAMonitor, Users→none.",
    "Template changes apply on the next logon or Safe/group add.",
    "AutoSyncExternalObjects=Yes,24,1,5. UpdatePolicy=UpdateAll. DeletionPolicy=DeleteAll (disabled or expired in AD = not deleted).",
    "Add an LDAP group to a Vault group: Vault group → Update → Add → LDAP Group."
  ]
},

O7: {
  mins: 8,
  intro: "Authentication has <b>two halves</b>: the method set on the <b>Vault user</b>, and the method <b>enabled in the interface</b> (PVWA or PrivateArk). Questions usually hide one half.",
  cards: [
    { h: "What each component accepts", html: `
      <table class="t"><tr><th>Component</th><th>Primary methods</th></tr>
      <tr><td>Vault</td><td>Password, LDAP, RADIUS, Windows, PKI, SAML, OIDC, Amazon Cognito</td></tr>
      <tr><td>PVWA</td><td>Password, Windows, RADIUS, PKI, LDAP, SAML (+ FIDO)</td></tr>
      <tr><td>PrivateArk Client</td><td>Password, RADIUS, LDAP</td></tr>
      <tr><td>PACLI</td><td>Password, RADIUS</td></tr></table>` },
    { h: "Turning a method on in the PVWA", html: `
      <p><b>Administration → Options → Authentication Methods</b> → select the method (cyberark, ldap, radius, windows, pki, saml) → <b>Enabled = Yes</b>.</p>
      <ul><li><b>Apply</b> = takes effect now. <b>Save</b> = takes effect after the <code>RefreshPeriod</code>.</li>
      <li><b>GeneralSettings → DefaultMethod</b> defaults to <code>cyberark</code> (Vault password).</li>
      <li><b>LogoffUrl</b> matters for 3rd-party methods (SAML). Without it, users stay signed in while their IdP session lasts.</li></ul>
      <p>The user's own method is set in PrivateArk (user → <b>Authentication</b> tab → Authentication method) or in a map's template.</p>` },
    { h: "Secondary (two-step) authentication", html: `
      <p>Primary SSO methods <b>Windows, PKI, SAML, Cognito</b> can be followed by a secondary <b>LDAP, RADIUS or CyberArk password</b>.</p>
      <p>On the primary method: <code>UseVaultAuthentication=Yes</code>, then <code>UseRadius=Yes</code> <b>or</b> <code>UseLDAP=Yes</code>. UseRadius and UseLDAP are <b>mutually exclusive</b>, and both need UseVaultAuthentication.</p>` },
    { h: "RADIUS step by step", html: `
      <ol><li>On the RADIUS server, define the <b>Vault as a RADIUS client</b>. Collect the server IP, port (<b>1812</b>), the client name and the secret.</li>
      <li><b>Stop</b> the Vault. Run <code>CAVaultManager SecureSecretFiles /SecretType Radius /Secret ... /SecuredFileName radiusauth.dat</code> to encrypt the secret.</li>
      <li>In DBParm.ini: <code>RadiusServersInfo=1.1.1.250;1812;vaulthostname;radiusauth.dat</code> (IP; port; Vault client name; secret file). Separate several servers with commas for HA.</li>
      <li><b>Start</b> the Vault and check the log. Store the secret file in a Safe.</li>
      <li>Set users' Authentication method to <b>RADIUS</b>, and enable <b>radius</b> in PVWA Authentication Methods.</li></ol>` },
    { h: "Windows, PKI, SAML in one breath", html: `
      <ul><li><b>Windows</b>: the PVWA must be on a domain machine that can reach the AD authenticating the user. SSO, no extra prompt.</li>
      <li><b>PKI</b>: SSL handshake with the user's personal certificate. The CA must be trusted, IIS must require client certificates, and the user must <b>already exist in the Vault</b>.</li>
      <li><b>SAML 2.0</b>: configure the IdP (Assertion Consumer URL <code>.../PasswordVault/api/auth/saml/logon</code>, NameID = user name) and <code>saml.config</code>. The IdP <b>Audience</b> must equal the PVWA's <b>ServiceProvider Name</b>. SP-initiated by default.</li></ul>` },
    { h: "ExternalAuthenticationMode (v14.4+)", html: `
      <table class="t"><tr><th>Value</th><th>Behavior</th></tr>
      <tr><td><b>Strict</b></td><td>Only the external methods in the user's (or map's) Authentication permissions work</td></tr>
      <tr><td><b>AllowAutomaticConfig</b></td><td>The first external method used is recorded, and only that one works afterwards. <b>Clean-install default.</b></td></tr>
      <tr><td><b>AllowAll</b></td><td>Any external method works. <b>Upgrade default</b>; required with Remote Access.</td></tr></table>` },
    { h: "Vault password policy defaults", html: `
      <p>At least <b>6</b> characters, with at least one <b>number</b>, one <b>uppercase</b> and one <b>lowercase</b> letter. Options: <b>User must change password at next logon</b>, <b>Password never expires</b>.</p>` }
  ],
  traps: [
    "Enabling a method in PVWA isn't enough. The Vault user's authentication method must match (for LDAP or RADIUS users).",
    "UseRadius/UseLDAP require UseVaultAuthentication=Yes, and you can't use both.",
    "The RADIUS secret goes in a file encrypted with CAVaultManager SecureSecretFiles, never plain text.",
    "DefaultMethod after install = cyberark."
  ],
  say: [
    { q: "Explain the two halves you must configure before a user can sign in to the PVWA with RADIUS.", a: "First the Vault side: the Vault is integrated with the RADIUS server (Vault defined as a client, secret encrypted with CAVaultManager SecureSecretFiles, RadiusServersInfo in DBParm.ini, Vault restarted) and the user's Authentication method is RADIUS. Then the interface side: radius is Enabled=Yes under PVWA Administration → Options → Authentication Methods." }
  ],
  key: [
    "PVWA methods: Administration → Options → Authentication Methods → Enabled=Yes. DefaultMethod = cyberark.",
    "The user's method is set on the Authentication tab or in the map template. Both halves must match.",
    "Secondary auth: UseVaultAuthentication=Yes + UseRadius or UseLDAP (one of them).",
    "RADIUS: Vault as client → CAVaultManager SecureSecretFiles → RadiusServersInfo=IP;port;client;file → restart.",
    "SAML: IdP Audience = ServiceProvider Name. PKI users must already exist in the Vault.",
    "ExternalAuthenticationMode: Strict / AllowAutomaticConfig (clean default) / AllowAll (upgrade default).",
    "Password policy: 6+ characters, upper + lower + number."
  ]
},

O8: {
  mins: 7,
  intro: "Disabled, suspended and expired are three different states. The exam expects you to know which is which, what causes each, and the exact way to reverse each one.",
  cards: [
    { h: "Time Limitations tab", html: `
      <ul><li><b>Enable this User to logon at</b>: allowed hours (e.g. 08:00–18:00)</li><li><b>Automatically expire User account on</b>: an end date</li>
      <li><b>History</b>: days of activity records to keep. <b>0 = activity isn't written to an audit log</b>.</li></ul>
      <p>So "you can control the hours a user may log on" is <b>TRUE</b>. Trusted Network Areas can also carry hours.</p>` },
    { h: "Disabled vs suspended vs expired", html: `
      <table class="t"><tr><th>State</th><th>Caused by</th><th>Reverse it with</th></tr>
      <tr><td><b>Disabled</b></td><td>An admin (Disable User / Disable action)</td><td>Clear Disable User / Enable</td></tr>
      <tr><td><b>Suspended</b></td><td>Too many violations (bad passwords, logon outside allowed hours)</td><td><b>Activate</b> the user (needs Activate Users + Audit Users), or wait <code>UserLockoutPeriodInMinutes</code> if it's set</td></tr>
      <tr><td><b>Expired</b></td><td>The expiry date passed</td><td>Change the expiry date</td></tr></table>` },
    { h: "Suspension parameters (DBParm.ini)", html: `
      <table class="t"><tr><th>Parameter</th><th>Default</th><th>Meaning</th></tr>
      <tr><td>MaxAccessViolations</td><td><b>5</b></td><td>Violations in the 'All' network area before the user is suspended</td></tr>
      <tr><td>UserLockoutPeriodInMinutes</td><td><b>-1</b></td><td>Minutes until automatic unsuspend. -1 = no auto-unlock</td></tr>
      <tr><td>MaskUserIsSuspendedMessage</td><td>No</td><td>Yes = show a generic "authentication failure" instead of "suspended"</td></tr>
      <tr><td>IdleTimeout</td><td>20</td><td>Minutes before an idle session is logged off</td></tr></table>` },
    { h: "Unsuspending: every path", html: `
      <ul><li><b>PrivateArk</b>: Tools → Administrative Tools → Users and Groups → select user → <b>Trusted Net Areas</b> → select the area → <b>Activate</b></li>
      <li><b>PVWA UI</b>: reactivate the user from the Users page</li>
      <li><b>REST</b>: <code>POST /API/Users/{id}/Activate</code>. Activates a <b>suspended</b> user, <b>not</b> an inactive or disabled one.</li>
      <li><b>Read-Only (satellite) Vault</b>: suspension there is local. Run <code>CAVaultManager.exe UnSuspendUser /UserName &lt;user&gt;</code> on that Vault.</li></ul>` },
    { h: "Network Areas", html: `
      <p>The locations the Vault can be reached from. PrivateArk: Tools → Administrative Tools → <b>Network Area</b> → New. Needs <b>Add Network Areas</b>.</p>
      <ul><li><b>Mask</b>: 1.1.1.1/<b>24</b> = any address starting 1.1.1. ; /16 = 1.1. ; /32 = only 1.1.1.1</li><li><b>Range</b>: first and last address</li>
      <li>A new area needs an <b>equal or higher</b> security level than its parent.</li><li><b>Enforce Network Areas through Gateway</b>: users can only log on to web apps from their allocated area.</li></ul>` },
    { h: "Trusted Network Areas", html: `
      <p>Per <b>user</b>: the network areas this user may log on from, optionally with <b>hours</b> and a <b>maximum violation count</b>. Reach the limit and that Trusted Network Area is <b>deactivated</b> until an admin reactivates it.</p>
      <p>Setting them up needs <b>Add/Update Users + Audit Users</b>. Activating or deactivating them needs <b>Activate Users</b>. Wrong passwords and logons outside the allowed hours both count as violations.</p>` }
  ],
  traps: [
    "Suspended isn't disabled. Clearing Disable User won't unsuspend anyone.",
    "Default: 5 violations, then suspended, with no automatic unlock (-1).",
    "REST Activate only works for suspended users, not inactive or disabled ones.",
    "Read-Only Vault suspensions are local: run CAVaultManager UnSuspendUser there.",
    "History = 0 means no audit log for that user."
  ],
  say: [
    { q: "A user says they're \"locked out\". How do you tell whether they're disabled or suspended, and how do you fix each?", a: "Disabled means an admin set Disable User. Clear it, or use Enable in PVWA. Suspended means they hit the violation limit (MaxAccessViolations, default 5). Activate them: PrivateArk Users and Groups → Trusted Net Areas → Activate, the PVWA Users page, or REST POST /Users/{id}/Activate. That takes Activate Users + Audit Users. If UserLockoutPeriodInMinutes is set, they also auto-unlock after that time." }
  ],
  key: [
    "Time Limitations: logon hours, expiry, History (0 = no audit log).",
    "Suspended = violations (default MaxAccessViolations=5). UserLockoutPeriodInMinutes=-1 means no auto-unlock.",
    "Unsuspend: Trusted Net Areas → Activate (PrivateArk), the PVWA UI, REST /Users/{id}/Activate, or CAVaultManager UnSuspendUser on a Read-Only Vault.",
    "Network Area: Tools → Administrative Tools → Network Area. Needs Add Network Areas. /24 = first three octets.",
    "Trusted Network Areas: per user, with hours + max violations. Setup = Add/Update Users + Audit Users. Activate = Activate Users."
  ]
},

O9: {
  mins: 6,
  intro: "\"Where do you configure this?\" questions are free points once the map is in your head. This lesson is that map.",
  cards: [
    { h: "Task → where", html: `
      <table class="t"><tr><th>Task</th><th>PrivateArk Client</th><th>PVWA (modern)</th></tr>
      <tr><td>Create or edit a user</td><td>Tools → Administrative Tools → Users and Groups → New → User / Update</td><td>User Provisioning → Users → Create CyberArk User / Edit</td></tr>
      <tr><td>Create a group, add members</td><td>Users and Groups → New → Group; Update → Add</td><td>User Provisioning → Groups → Create Group / Add members</td></tr>
      <tr><td>Vault authorizations</td><td>User → Update → <b>Authorizations</b> tab</td><td>User → Edit (role / custom permissions)</td></tr>
      <tr><td>User's group memberships</td><td>User → Update → <b>Member Of</b> tab</td><td>User → Assign to groups</td></tr>
      <tr><td>Directory maps</td><td>Tools → Administrative Tools → <b>Directory Mapping</b></td><td>User Provisioning → <b>LDAP Integration</b> → Add Mapping / Edit</td></tr>
      <tr><td>Network areas</td><td>Tools → Administrative Tools → <b>Network Area</b></td><td></td></tr>
      <tr><td>Unsuspend</td><td>Users and Groups → <b>Trusted Net Areas</b> → Activate</td><td>User Provisioning → Users</td></tr>
      <tr><td>Enable an auth method</td><td>Vault → Properties → <b>Advanced</b> (client logon method)</td><td>Administration → Options → <b>Authentication Methods</b></td></tr></table>` },
    { h: "REST and PACLI equivalents", html: `
      <table class="t"><tr><th>Task</th><th>REST</th><th>PACLI</th></tr>
      <tr><td>Add user</td><td><code>POST /API/Users</code> (needs Add/Update Users)</td><td><code>ADDUSER</code> with flags (USERSADMIN, RULESADMIN...)</td></tr>
      <tr><td>Create group</td><td><code>POST /API/UserGroups</code></td><td><code>ADDGROUP</code></td></tr>
      <tr><td>Add member to group</td><td><code>POST /API/UserGroups/{id}/Members</code></td><td><code>ADDGROUPMEMBER</code></td></tr>
      <tr><td>Unsuspend</td><td><code>POST /API/Users/{id}/Activate</code></td><td><code>ACTIVATETRUSTEDNETWORKAREA</code></td></tr></table>
      <p>REST, the PrivateArk Client and PACLI can all add a user directly to a Vault group such as Vault Admins.</p>` },
    { h: "PrivateArk user properties tabs", html: `
      <p><b>General</b> (type, location, Authorized Interfaces, Gateway, Disable User) · <b>Authentication</b> (method, password, must change, never expires, DN) · <b>Authorizations</b> (the 10) · <b>Member Of</b> · <b>Time Limitations</b> (history, logon hours, expiry) · Business/Internet · Personal · Phone/Notes</p>
      <p>The General and Authentication tabs are mandatory when creating a user.</p>` },
    { h: "Gotchas in the tools", html: `
      <ul><li>"<i>The server version is different from the client version. You cannot manage users, groups or directory mapping.</i>" Upgrade the PrivateArk Client to the Vault's version.</li>
      <li>To add an AD user or group who isn't in the Vault yet as a Safe owner: Owners → Add → <b>Add From LDAP</b>.</li>
      <li>LDAP maps built in PrivateArk with several rules per map must be split into one rule per map before you run the PVWA wizard.</li></ul>` }
  ],
  traps: [
    "Directory Mapping (PrivateArk) = LDAP Integration (PVWA). They're the same objects.",
    "Network areas are only in the PrivateArk Client.",
    "The PVWA auth method switch lives in Administration → Options, not User Provisioning."
  ],
  say: [
    { q: "Name the PrivateArk path and the PVWA path for editing a directory map.", a: "PrivateArk: Tools → Administrative Tools → Directory Mapping → select the map → Update. PVWA: User Provisioning → LDAP Integration → expand the domain → the mapping's more-options → Edit." }
  ],
  key: [
    "PrivateArk: Tools → Administrative Tools → Users and Groups | Directory Mapping | Network Area.",
    "PVWA: User Provisioning → Users | Groups | LDAP Integration. Administration → Options → Authentication Methods.",
    "User tabs: General, Authentication, Authorizations, Member Of, Time Limitations.",
    "REST: /API/Users, /API/UserGroups/{id}/Members, /API/Users/{id}/Activate.",
    "A client/server version mismatch blocks user management. Upgrade the client."
  ]
},

O10: {
  mins: 6,
  intro: "User management meets Safe security here: how group memberships combine on a Safe, and what limits apply when you hand out access.",
  cards: [
    { h: "Several groups on one Safe", html: `
      <p><code>GroupMergeAlgorithm</code> (DBParm.ini):</p>
      <ul><li><b>DenyOverrides</b> (default): the user gets the <b>combination of all</b> their groups' permissions (cumulative)</li>
      <li><b>FirstApplicable</b>: only the permissions of the first group the user was added to</li></ul>` },
    { h: "Direct membership beats group membership", html: `
      <p>If a user is also a <b>direct</b> member of the Safe, the user's own permissions <b>override</b> the groups' permissions on that Safe, even if they're narrower.</p>` },
    { h: "You can only hand out what you have", html: `
      <ul><li>Adding or editing a Safe member requires <b>Manage Safe Members</b> on that Safe.</li>
      <li>You can assign <b>only the permissions your own user has</b>.</li>
      <li>You can edit or remove only members with the <b>same or fewer</b> permissions than you.</li></ul>` },
    { h: "Let AD drive Safe access", html: `
      <p>Add the <b>LDAP group</b> itself as a Safe member (PVWA: Safe → Members → Add Member, Source = the directory; PrivateArk: Owners → Add → Add From LDAP). After that, HR adding someone to the AD group gives them the access at their next logon. No CyberArk change needed.</p>
      <p>Don't try to do this with a directory map. Maps don't carry Safe permissions.</p>` }
  ],
  traps: [
    "Default = cumulative (DenyOverrides). FirstApplicable is the exception.",
    "A direct Safe membership overrides that user's group permissions.",
    "Manage Safe Members doesn't let you grant permissions you don't hold."
  ],
  say: [
    { q: "Alice has List on the Linux Safe as a direct member, and her group has Use + Retrieve there. What can she do, and why?", a: "Only List. When a user is a direct Safe member and also a member through groups, the user's own permissions override the group's on that Safe." }
  ],
  key: [
    "GroupMergeAlgorithm: DenyOverrides (default, cumulative) / FirstApplicable.",
    "A direct membership overrides group permissions for that user.",
    "Manage Safe Members is needed to add, edit or remove members. Grant only what you hold; edit or remove only same-or-fewer.",
    "Add AD groups as Safe members so AD membership drives access."
  ]
}
};
