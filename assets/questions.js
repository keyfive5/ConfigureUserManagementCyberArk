/* Question bank. Each FAMILY tests one fact and has several VARIANTS (different
   wording, angle or format) so mastery means understanding, not recognizing a stem.
   Types: mc (one answer), multi (several), tf (a: true|false), order (o is the
   correct sequence), match (p: [left, right] pairs).
   Options are shuffled at run time; the audit in tests/check.mjs keeps the correct
   option from being guessable by its length. */

const QB = [
/* ───────────────────────── O1 · Users, groups & hierarchy ───────────────────────── */
{ id: "o1-hier", o: "O1", r: "overview",
  e: "User managers (Add/Update Users, Reset Users' Passwords, etc.) act on users at the SAME level or LOWER in the Vault hierarchy - never above.",
  v: [
  { y: "mc", q: "Dana holds Add/Update Users and is located at \\IT. Which users can Dana update?",
    o: ["Users in \\IT and its sub-locations","Any user in the Vault, since the authorization is Vault-wide", "Only the users that Dana personally created", "Only users in sub-locations, never Dana's peers in \\IT"], a: [0] },
  { y: "tf", q: "An administrator with Reset Users' Passwords can reset the password of a user who sits ABOVE them in the Vault hierarchy.", a: false },
  { y: "mc", q: "The Engineering user manager is on leave and Engineering users need permission changes today. Who can make them?",
    o: ["Any user manager located above Engineering in the hierarchy", "Only the Master user, logging on with the Master CD and recovery key", "Nobody until the Engineering manager returns", "Any member of the Engineering group itself"], a: [0] }
]},
{ id: "o1-visible", o: "O1", r: "overview",
  e: "Users see other users only through Audit Users (their location and below), a shared Safe where they have View Safe Members, or a shared group.",
  v: [
  { y: "multi", q: "Which conditions let one user see another user in the Vault? (Choose three)",
    o: ["They hold Audit Users over the other user's location", "They share a Safe and have View Safe Members on it", "They are both members of the same group", "They were both created by the same administrator", "They hold the Add Safes Vault authorization", "They log on through the same PVWA server"], a: [0, 1, 2] },
  { y: "mc", q: "Why can't an IT user normally see that Finance users exist in the Vault?",
    o: ["They share no Safe or group, and Finance isn't in their Audit Users scope", "Finance users are created in a separate Vault partition that IT accounts cannot query", "The PVWA hides users from other departments unless HideVaultUsersTree is No", "Finance users are external users, and external users are always hidden"], a: [0] }
]},
{ id: "o1-ext-create", o: "O1", r: "ldapUsers",
  e: "An external user account is created the first time the user is REFERENCED: logs on, is added as a Safe member, is added as a group member, or is added to a report. A change in AD alone does nothing in the Vault.",
  v: [
  { y: "multi", q: "An AD user matches a directory map but has no Vault user yet. Which events create their external user account? (Choose three)",
    o: ["They log on to the Vault", "They are added as a member of a Safe", "They are added as a member of a Vault group", "Someone adds them to the mapped AD group", "The nightly synchronization window runs", "The bind account reads their AD object"], a: [0, 1, 2] },
  { y: "tf", q: "Adding a user to the AD group used by a directory map immediately creates that user in the Vault.", a: false },
  { y: "mc", q: "A new hire was added to the mapped AD group this morning but doesn't appear in the PVWA Users list. What is the most likely explanation?",
    o: ["Nothing has referenced them yet, such as a logon or a Safe membership", "The directory map must be re-saved after every AD group change", "The Vault creates new external users only during the nightly 01:00-05:00 sync window", "External users never appear in the PVWA Users list"], a: [0] }
]},
{ id: "o1-ext-details", o: "O1", r: "extUsers",
  e: "An LDAP user's personal details come from the directory at every logon, so they're changed in the directory. In the Vault you can still change their authentication method, password properties, certificate DN, and whether they're disabled.",
  v: [
  { y: "mc", q: "An LDAP user's email address is wrong in the Vault. Where must it be corrected?",
    o: ["In the LDAP directory; the Vault refreshes it at the user's next logon or sync", "PrivateArk Client > Users and Groups > Update > Business/Internet tab", "PVWA > User Provisioning > Users > Edit > Add personal details", "In the user template of the directory map that created them"], a: [0] },
  { y: "multi", q: "Which properties CAN you change on an external (LDAP) user directly in the PrivateArk Client? (Choose two)",
    o: ["The user's authentication method", "Whether the user is disabled", "The user's first and last name", "The user's business email address"], a: [0, 1] }
]},
{ id: "o1-ldapgroup-actions", o: "O1", r: "extUsers",
  e: "LDAP groups are managed in the directory. In PrivateArk Users and Groups, selecting an LDAP group enables only Delete and Safe Ownership.",
  v: [
  { y: "mc", q: "In PrivateArk Users and Groups you select an LDAP group. Which buttons are available?",
    o: ["Only Delete and Safe Ownership", "Update, Rename and Delete only", "Trusted Net Areas and Delete", "Update membership and Safe Ownership"], a: [0] },
  { y: "tf", q: "You can add or remove members of an LDAP group from inside the PrivateArk Client.", a: false }
]},
{ id: "o1-delete-ext", o: "O1", r: "ldapSafe",
  e: "Deleting an external user in the Vault only erases Vault-side changes. If they're still in the directory and still match a map, they're recreated at their next logon. Remove them in the directory; the next sync then erases the Vault user.",
  v: [
  { y: "mc", q: "A contractor left. You deleted their LDAP-based Vault user, but nobody touched AD. What happens if they try to log on?",
    o: ["A new external account is created and they get in, if a map still matches", "They are rejected, because deleted users are placed on a deny list", "They are rejected until an admin restores the deleted user", "They get in as an internal user with no Safe access"], a: [0] },
  { y: "tf", q: "Deleting an external user in the Vault is enough to permanently block their access.", a: false }
]},
{ id: "o1-names", o: "O1", r: "addUserPA",
  e: "User and group names can be up to 128 characters, and the first 28 characters must be unique.",
  v: [
  { y: "mc", q: "Vault user and group names may be up to 128 characters. What else must be true of the name?",
    o: ["Its first 28 characters are unique", "The first 64 characters must be unique", "It must not contain any digits or spaces", "It must begin with the location name"], a: [0] }
]},
{ id: "o1-users-accounts", o: "O1", r: "overview",
  e: "Users are identities that log on to the Vault (people, applications, components). Accounts are privileged credentials stored in Safes.",
  v: [
  { y: "mc", q: "In CyberArk terminology, what is the difference between a user and an account?",
    o: ["A user logs on to the Vault; an account is a credential stored in a Safe", "A user is internal to CyberArk; an account always comes from LDAP", "A user belongs to one Safe; an account can belong to many groups", "They are the same object viewed from PVWA and PrivateArk"], a: [0] }
]},

/* ───────────────────────── O2 · User types & interfaces ───────────────────────── */
{ id: "o2-type-iface", o: "O2", r: "overview",
  e: "The license defines user types; each user type has a list of authorized interfaces. Restricting interfaces is done through the user type / Authorized Interfaces - not through Vault authorizations or Safe permissions.",
  v: [
  { y: "mc", q: "What determines which CyberArk interfaces a user may use to access the Vault?",
    o: ["Their user type and its Authorized Interfaces list", "The Vault groups the user belongs to, such as PVWAUsers", "The Vault authorizations assigned to the user", "The Safe member permissions the user holds"], a: [0] },
  { y: "tf", q: "You can restrict an individual user so they can use the PVWA but not the PrivateArk Client or PACLI.", a: true }
]},
{ id: "o2-restrict-where", o: "O2", r: "addUserPA",
  e: "PrivateArk: Users and Groups > Update > General tab > Authorized Interfaces. PVWA: user type > Authorized interface. REST: unAuthorizedInterfaces (a block list).",
  v: [
  { y: "mc", q: "In the PrivateArk Client, where do you remove PACLI from a single user's allowed interfaces?",
    o: ["Update the user > General tab > Authorized Interfaces", "Update the user > Authorizations tab > clear Add/Update Users", "Update the user > Time Limitations tab > Interfaces", "Tools > Administrative Tools > Network Area > Interfaces"], a: [0] },
  { y: "mc", q: "Which REST Add User body parameter stops a new user from using PSM and PSMP?",
    o: ["unAuthorizedInterfaces", "authorizedInterfaces", "vaultAuthorization", "allowedAuthenticationMethods"], a: [0],
    e: "The REST API uses a BLOCK list: unAuthorizedInterfaces: [\"PSM\",\"PSMP\"]. vaultAuthorization is the list of Vault authorizations; allowedAuthenticationMethods lists permitted external auth methods." }
]},
{ id: "o2-types", o: "O2", r: "overview",
  e: "EPVUser (default end user): PVWA, PrivateArk Client, Webclient, PACLI, PIMSU. BizUser: PVWA only. PSMUser: PSM + PVWA. AppProvider: Application Password Provider component. AIMAccount: application account end user.",
  v: [
  { y: "match", q: "Match each user type to the interfaces it may use.",
    p: [["EPVUser", "PVWA, PrivateArk Client, Webclient, PACLI, PIMSU"], ["BizUser", "PVWA only"], ["PSMUser", "PSM and PVWA, for PSM workflows"], ["AppProvider", "Application Password Provider"]] },
  { y: "mc", q: "A business user will only ever use the web portal. Which user type matches that exactly?",
    o: ["BizUser", "EPVUser", "PSMUser", "AIMAccount"], a: [0] },
  { y: "mc", q: "Which user type is assigned by default when you create a user with REST Add User, and by the built-in user maps?",
    o: ["EPVUser", "BizUser", "PSMUser", "PVWA"], a: [0] }
]},
{ id: "o2-ids", o: "O2", r: "overview",
  e: "Interface IDs: WINCLIENT = PrivateArk Client/Webclient (GUI before v4.6), PVWA, PVWAApp (PVWA application & gateway user), PACLI, PIMSU (OPM), AppPrv (Credential Provider).",
  v: [
  { y: "mc", q: "In an Authorized Interfaces list, which interface ID represents the PrivateArk Client?",
    o: ["WINCLIENT", "PACLI", "PVWAApp", "PIMSU"], a: [0] },
  { y: "match", q: "Match each interface ID to what it represents.",
    p: [["WINCLIENT", "PrivateArk Client and Webclient"], ["PVWAApp", "PVWA application and gateway user"], ["PIMSU", "OPM"], ["AppPrv", "Application Password Provider"]] }
]},
{ id: "o2-gateway", o: "O2", r: "pacli",
  e: "A user flagged as a Gateway Account can authenticate to the Vault only with password or RADIUS authentication. The PVWA connects with PVWAGWUser (GWUserName, credential file gwuser.ini) and does internal tasks as PVWAAppUser.",
  v: [
  { y: "mc", q: "A user flagged as a Gateway Account can authenticate to the Vault with which methods?",
    o: ["Password or RADIUS only", "Any method enabled in the PVWA", "LDAP or PKI certificate only", "Windows authentication only"], a: [0] },
  { y: "mc", q: "By default, which Vault user does the PVWA use to access the Vault (the GWUserName option)?",
    o: ["PVWAGWUser", "PVWAAppUser", "PasswordManager", "PVWAMonitor"], a: [0],
    e: "GWUserName defaults to PVWAGWUser (credential file gwuser.ini). PVWAAppUser is ApplicationUserName - used for internal tasks. PasswordManager is the CPM's user; PVWAMonitor is a group." }
]},
{ id: "o2-license", o: "O2", r: "overview",
  e: "The License Capacity report shows the maximum number of licenses for each user type or object and how many are used.",
  v: [
  { y: "mc", q: "How can you see how many licenses of each user type are in use?",
    o: ["Generate the License Capacity report", "Open license.xml on the PVWA server", "Run the Users List report filtered by type", "Check the PrivateArk Server Central Administration log"], a: [0] }
]},

/* ───────────────────────── O3 · Vault authorizations ───────────────────────── */
{ id: "o3-list", o: "O3", r: "addUserPA",
  e: "The 10 Vault authorizations: Add Safes, Audit Users, Add/Update Users, Reset Users' Passwords, Activate Users, Add Network Areas, Manage Directory Mapping, Manage Server File Categories, Backup All Safes, Restore All Safes. Manage Safe Members, View Audit Log, Retrieve and Unlock accounts are SAFE permissions.",
  v: [
  { y: "multi", q: "Which of these are Vault-level authorizations, set on the user rather than on a Safe? (Choose three)",
    o: ["Add Safes", "Audit Users", "Manage Directory Mapping", "Manage Safe Members", "View Audit Log", "Retrieve accounts"], a: [0, 1, 2] },
  { y: "mc", q: "Which of the following is NOT a Vault authorization?",
    o: ["Manage Safe Members", "Reset Users' Passwords", "Manage Directory Mapping", "Manage Server File Categories"], a: [0] },
  { y: "match", q: "Match each Vault authorization to what it allows.",
    p: [["Add/Update Users", "Add and update users and locations at your level or lower"], ["Reset Users' Passwords", "Reset passwords and force a change at next logon"], ["Activate Users", "Activate or deactivate users' trusted network areas"], ["Manage Directory Mapping", "Add, update and remove LDAP directory maps"], ["Add Network Areas", "Define the IP ranges the Vault may be reached from"]] }
]},
{ id: "o3-users-only", o: "O3", r: "addGroupPA",
  e: "Vault authorizations are set on USERS - internal or LDAP. A Vault group has no Authorizations tab, and the REST Create group call has no authorization field. To give many LDAP users an authorization, put it in the directory map's user template.",
  v: [
  { y: "multi", q: "Vault authorizations can be granted to: (Choose two)",
    o: ["Internal (CyberArk) users", "LDAP users", "Vault groups", "LDAP groups"], a: [0, 1] },
  { y: "mc", q: "All auditors are provisioned from the AD group SOC-Auditors, and every one of them is missing Audit Users. What fix reaches all of them?",
    o: ["Add Audit Users to the user template of the auditors' directory map", "Tick Audit Users on the Auditors Vault group's Authorizations tab", "Grant SOC-Auditors the View Audit Log permission on every Safe", "Set the PVWAMonitorGroup option to SOC-Auditors"], a: [0],
    e: "Groups don't hold Vault authorizations, so there's no group Authorizations tab to tick. The auditors came from a directory map, so edit that map's user template (PVWA: User Provisioning > LDAP Integration > the mapping > Edit > User template - Authorization; PrivateArk: Directory Mapping > Update > User Template > Authorizations). Existing auditors receive it at their next logon." },
  { y: "tf", q: "In the PrivateArk Client, a Vault group has an Authorizations tab where you can grant Vault authorizations to all its members.", a: false }
]},
{ id: "o3-combos", o: "O3", r: "addUserPA",
  e: "Edit user accounts: Audit Users + Add/Update Users. Reset passwords: Audit Users + Reset Users' Passwords. Activate suspended users: Audit Users + Activate Users.",
  v: [
  { y: "multi", q: "A help-desk analyst must be able to unsuspend locked-out users and do nothing else. Which Vault authorizations do they need? (Choose two)",
    o: ["Activate Users", "Audit Users", "Reset Users' Passwords", "Add/Update Users"], a: [0, 1] },
  { y: "multi", q: "To reset other users' passwords in the PrivateArk Client, an admin needs which authorizations? (Choose two)",
    o: ["Reset Users' Passwords", "Audit Users", "Add/Update Users", "Activate Users"], a: [0, 1] },
  { y: "multi", q: "Which pair of authorizations lets an admin edit other users' accounts? (Choose two)",
    o: ["Add/Update Users", "Audit Users", "Manage Directory Mapping", "Add Safes"], a: [0, 1] }
]},
{ id: "o3-missing-reset", o: "O3", r: "addUserPA",
  e: "Resetting another user's password requires the Reset Users' Passwords authorization (plus Audit Users). None of Add/Update Users, Manage Directory Mapping, Manage Server File Categories, Backup or Restore includes it.",
  v: [
  { y: "mc", q: "L2Support holds Add/Update Users, Manage Directory Mapping, Manage Server File Categories, Backup All Safes and Restore All Safes. Why can't L2Support reset the Operator user's password?",
    o: ["L2Support doesn't hold the Reset Users' Passwords authorization", "Only the Master user can reset predefined users' passwords", "Manage Directory Mapping blocks password resets", "Operator is an external user managed in LDAP"], a: [0] },
  { y: "tf", q: "Add/Update Users includes the ability to reset other users' passwords.", a: false }
]},
{ id: "o3-grant-own", o: "O3", r: "restAddUser",
  e: "You can only grant what you hold. REST: \"To apply specific authorizations to a user, the user who runs this API must have the same authorizations.\" Safes: \"you can only assign the specific permissions that your user has.\"",
  v: [
  { y: "tf", q: "A user with administrative privileges in the Vault can only grant other users the authorizations that they themselves hold.", a: true },
  { y: "mc", q: "An admin holding Add/Update Users and Audit Users uses REST Add User to create a user with AddSafes. What is the outcome?",
    o: ["It's not allowed: the caller must hold every authorization they apply", "It works: Add/Update Users lets you grant any Vault authorization to others", "It works, as long as the new user is in a lower location", "It works only from the PrivateArk Client, not through REST"], a: [0] }
]},
{ id: "o3-pacli", o: "O3", r: "pacli",
  e: "PACLI ADDUSER/UPDATEUSER flags: USERSADMIN = Add/Update Users, SAFESADMIN = Add Safes, RULESADMIN = Manage Directory Mapping, NETWORKSADMIN = Add Network Areas, AUDITADMIN = Audit Users, RESETPASSWORD, ACTIVATEUSERS, CATEGORIESADMIN, BACKUPADMIN, RESTOREADMIN.",
  v: [
  { y: "mc", q: "In PACLI ADDUSER, which parameter grants Manage Directory Mapping?",
    o: ["RULESADMIN", "USERSADMIN", "CATEGORIESADMIN", "NETWORKSADMIN"], a: [0] },
  { y: "match", q: "Match each PACLI ADDUSER flag to its Vault authorization.",
    p: [["USERSADMIN", "Add/Update Users"], ["SAFESADMIN", "Add Safes"], ["RULESADMIN", "Manage Directory Mapping"], ["AUDITADMIN", "Audit Users"], ["NETWORKSADMIN", "Add Network Areas"]] }
]},
{ id: "o3-audit-users", o: "O3", r: "overview",
  e: "Audit Users lets a user see all users in the same location and its sub-locations and track their activity. It does not give access to any Safe's contents or logs.",
  v: [
  { y: "mc", q: "What does the Audit Users Vault authorization let its holder do?",
    o: ["See users in their location and below, and track their activity", "Read the audit log of every Safe without being a member", "Retrieve any account password for auditing purposes", "Run Entitlement reports across all Safes without membership"], a: [0] }
]},
{ id: "o3-activate-vs-unlock", o: "O3", r: "addMember",
  e: "Activate Users (Vault authorization) unsuspends a PERSON by activating their trusted network areas. Unlock accounts (Safe permission) releases a checked-out ACCOUNT locked by another user.",
  v: [
  { y: "mc", q: "A user is suspended after too many bad passwords. Which permission is relevant to letting them back in?",
    o: ["Activate Users (a Vault authorization)", "Unlock accounts (a Safe permission)", "Access Safe without confirmation", "Initiate CPM account management operations"], a: [0] },
  { y: "mc", q: "An exclusive account is checked out by someone who went home. Which permission lets a teammate release it?",
    o: ["Unlock accounts, on that Safe", "Activate Users, in the Vault itself", "Reset Users' Passwords, in the Vault", "Manage Safe, on that particular Safe"], a: [0] }
]},

/* ───────────────────────── O4 · Predefined users & groups ───────────────────────── */
{ id: "o4-master", o: "O4", r: "predefined",
  e: "Master: every Safe member authorization EXCEPT Authorize password requests; can't be removed from any Safe; logs on only with the Master CD (Private Recovery Key); the only user who can edit System Safe properties; used for full recovery.",
  v: [
  { y: "mc", q: "Which statement about the Master user is correct?",
    o: ["It can log on only with the Master CD holding the Private Recovery Key", "It is disabled after installation, like the other predefined users", "It gets its power from membership in the Vault Admins group", "It can be removed from Safes once PreDefinedUsersOwnerRemoval=All"], a: [0] },
  { y: "mc", q: "Which Safe member authorization does the Master user NOT have?",
    o: ["Authorize password requests", "Retrieve accounts and view passwords", "Manage Safe Members on every Safe", "View audit log for all activity"], a: [0] },
  { y: "mc", q: "Which user is the only one allowed to edit the System Safe's properties?",
    o: ["Master", "Administrator", "Any Vault Admins member", "Operator"], a: [0] },
  { y: "mc", q: "Which user is automatically a member of every Safe and can never be removed?",
    o: ["Master", "Administrator", "Auditor", "Batch"], a: [0] }
]},
{ id: "o4-activate", o: "O4", r: "predefined",
  e: "All predefined users except Master are created disabled. To activate one: log on to PrivateArk as Master, clear Disable User on the General tab, and change the default password on the Authentication tab.",
  v: [
  { y: "order", q: "Put the steps to activate the predefined Auditor user in order.",
    o: ["Log on to the PrivateArk Client as the Master user", "Open the Auditor user's properties", "On the General tab, clear Disable User", "On the Authentication tab, set a new non-obvious password"] },
  { y: "tf", q: "After installation, every predefined user except Master is disabled until you activate it.", a: true }
]},
{ id: "o4-users-roles", o: "O4", r: "predefined",
  e: "Batch: internal, can't log on, clears expired history. Operator: Manage Safe without seeing contents. Backup: backs up Safes. DR: replicates Safes to the DR Vault. Auditor: top of the hierarchy, Safe & user activity reports. Administrator: all permissions, manages users at any level.",
  v: [
  { y: "match", q: "Match each predefined user to its job.",
    p: [["Batch", "Internal housekeeping such as clearing expired history; cannot log on"], ["Operator", "Manages Safe properties without seeing Safe contents"], ["DR", "Replicates Safes to the Disaster Recovery Vault"], ["Auditor", "Produces Safe and user activity reports"], ["Administrator", "Creates and manages users at any level of the hierarchy"]] },
  { y: "mc", q: "Which predefined user can never be used to log on?",
    o: ["Batch", "Operator", "Auditor", "DR"], a: [0] },
  { y: "mc", q: "The Operator user opens a Safe but sees no accounts, logs or Owners list. Why?",
    o: ["Operators hold Manage Safe, which allows properties but not viewing contents", "The Safe uses Object Level Access Control, which hides content from Operators", "Operator is disabled, so only the Safe's shell is displayed", "Operators can only see Safes they created themselves"], a: [0] }
]},
{ id: "o4-groups", o: "O4", r: "predefined",
  e: "Vault Admins: auto-added only to system/component Safes (System Safe, Notification Engine Safe, CPM Safes, PVWA config Safes, PSM & recording Safes). Auditors: View audit + View Safe Members. Operators: Manage Safe. Backup Users / DR Users: Backup Safe. Notification Engines: View audit + View Safe Members for ENE.",
  v: [
  { y: "match", q: "Match each predefined group to its Safe-level role.",
    p: [["Auditors", "View audit and View Safe Members"], ["Operators", "Manage Safe"], ["Backup Users", "Backup Safe, for backups"], ["Notification Engines", "Monitor Safe activity so ENE can send notifications"]] },
  { y: "tf", q: "The Vault Admins group is automatically added to every Safe you create.", a: false,
    e: "False. Vault Admins is auto-added to the System Safe, Notification Engine Safe, CPM Safes, PVWA configuration Safes and PSM/recording Safes. The groups added to every new Safe (AutomaticallyAddBuiltInGroups, clean install) are Backup Users, DR Users, Operators, Auditors and Notification Engine." }
]},
{ id: "o4-autoadd", o: "O4", r: "dbparm",
  e: "AutomaticallyAddBuiltInGroups (DBParm.ini) after a clean install: Backup Users, DR Users, Operators, Auditors, Notification Engine (after an upgrade: without Notification Engine). Only predefined groups can be listed.",
  v: [
  { y: "mc", q: "After a clean install, which predefined groups are added to every new Safe by default?",
    o: ["Backup Users, DR Users, Operators, Auditors, Notification Engine", "Vault Admins, Auditors, Operators, Backup Users, PVWAMonitor and PVWAUsers", "Vault Admins only", "PVWAUsers, PVWAMonitor and Auditors"], a: [0] },
  { y: "mc", q: "Which DBParm.ini parameter lists the predefined groups added automatically to all Safes?",
    o: ["AutomaticallyAddBuiltInGroups", "PreDefinedGroupsOwnerRemoval", "EnablePreDefinedUsers", "GroupMergeAlgorithm"], a: [0] }
]},
{ id: "o4-removal", o: "O4", r: "predefined",
  e: "PreDefinedUsersOwnerRemoval / PreDefinedGroupsOwnerRemoval in DBParm.ini control whether predefined users/groups can be removed from Safes they were auto-added to. Default None. Set the value (e.g. =Operators) and restart the Vault. Master can never be removed.",
  v: [
  { y: "mc", q: "You must remove the Operators group from Safes it was auto-added to. What do you change?",
    o: ["Set PreDefinedGroupsOwnerRemoval=Operators, then restart the Vault", "Remove it in PVWA under the Safe's Members tab; that's allowed by default", "Set AutomaticallyAddBuiltInGroups=NONE in the PVWA Options", "Clear Manage Safe on the Operators group's Authorizations tab"], a: [0] },
  { y: "tf", q: "With PreDefinedUsersOwnerRemoval=All, even the Master user can be removed from Safes.", a: false }
]},
{ id: "o4-pvwa-groups", o: "O4", r: "pvwaUsers",
  e: "PVWASystemGroup defaults to Vault Admins (System Configuration page). PVWAGWAccounts is the gateway-accounts group shared with every Safe accessed through PVWA. PVWAMonitor members can monitor the Vault. PVWAUsers is the PVWA users group.",
  v: [
  { y: "mc", q: "By default, members of which Vault group can open the PVWA System Configuration (Administration) page?",
    o: ["Vault Admins", "PVWAMonitor", "PVWAUsers", "Auditors"], a: [0],
    e: "The PVWA option PVWASystemGroup defaults to Vault Admins: its members can access System Configuration and run auto-detection in simulation mode." },
  { y: "mc", q: "Which group of gateway accounts is shared with every Safe that will be accessed through the PVWA?",
    o: ["PVWAGWAccounts", "PVWAUsers", "PVWAMonitor", "Notification Engines"], a: [0] }
]},
{ id: "o4-admin", o: "O4", r: "predefined",
  e: "Administrator is the top-level user manager for day-to-day work: all possible permissions, creates and manages users at any level. Master is reserved for recovery (Master CD only).",
  v: [
  { y: "mc", q: "Which predefined user is meant for top-level, day-to-day user administration - creating and managing users at any level?",
    o: ["Administrator", "Master", "Auditor", "NotificationEngine"], a: [0] }
]},

/* ───────────────────────── O5 · LDAP setup ───────────────────────── */
{ id: "o5-bind", o: "O5", r: "ldapVault",
  e: "The bind user only reads the directory: create it with read-only permission on the tree locations holding the users and groups that need Vault access. It never creates or modifies anything.",
  v: [
  { y: "mc", q: "What rights does the LDAP bind account need in Active Directory?",
    o: ["Read-only access to the tree holding the Vault's users and groups", "Domain Admin rights, so it can create the users the Vault provisions", "Account Operator, so it can reset users' passwords", "Write access to the groups used by directory maps"], a: [0] },
  { y: "tf", q: "The LDAP bind user must be able to create and modify AD objects so the Vault can provision users.", a: false }
]},
{ id: "o5-hosts", o: "O5", r: "ldapVault",
  e: "The hardened Vault isn't configured with a DNS server, so add a line (IP + FQDN) to %SystemRoot%\\System32\\Drivers\\Etc\\hosts for EVERY domain controller it will use, and add the DC to the directory's Hosts in the LDAP integration.",
  v: [
  { y: "mc", q: "A new domain controller was added. What must you update so the Vault can authenticate through it?",
    o: ["The Vault's hosts file, plus the directory's Hosts list in the LDAP config", "Only the PVWA server's DNS client settings", "The DC's certificate, imported into the Vault server's Personal certificate store", "Nothing, because the Vault discovers DCs through DNS"], a: [0] },
  { y: "mc", q: "Why must every domain controller be listed in the hosts file on the Vault server?",
    o: ["The Vault isn't configured with a DNS server, so it resolves DC names locally", "The hosts file is where the Vault stores the bind account's encrypted password", "The hosts file is where the Vault reads the LDAP port", "Hosts entries replace the need for a CA certificate"], a: [0] }
]},
{ id: "o5-ldaps-cert", o: "O5", r: "ldapVault",
  e: "For LDAPS, import the CA certificate that signed the External Directory's (DC's) certificate into Trusted Root Certification Authorities (Local Computer) on the Vault - and on the PVWA. Don't use self-signed certificates.",
  v: [
  { y: "mc", q: "What must be on the Vault server to support LDAP over SSL?",
    o: ["The CA certificate that signed the DCs' certificate, in Trusted Root CAs", "A CA-signed server certificate for the Vault in its Personal store", "A copy of the domain controller's private key", "A self-signed certificate generated by the Vault"], a: [0] },
  { y: "mc", q: "Into which certificate store do you import the directory's issuing CA certificate on the Vault?",
    o: ["Trusted Root Certification Authorities (Local Computer)", "Personal (Current User)", "Trusted Publishers (Local Computer)", "Intermediate Certification Authorities (Current User)"], a: [0] }
]},
{ id: "o5-ports", o: "O5", r: "ldapSetup",
  e: "LDAPS uses port 636; plain LDAP uses 389. (1858 is the Vault's own protocol port.)",
  v: [
  { y: "mc", q: "What is the standard port for an LDAPS connection from the Vault to a DC?",
    o: ["636", "389", "3268", "1858"], a: [0] },
  { y: "mc", q: "A directory host is configured with ServerPort 389 and SSLConnect Yes. What's wrong?",
    o: ["389 is the plain LDAP port; LDAPS uses 636", "SSLConnect must be No when a port is set", "389 is correct; 636 is only for global catalog", "Nothing; the Vault upgrades 389 to TLS automatically"], a: [0] }
]},
{ id: "o5-fqdn", o: "O5", r: "ldapRef",
  e: "With an SSL connection, the host name must be a DNS name that matches the subject in the directory's certificate (and must resolve via the hosts file). An IP address fails the certificate name check.",
  v: [
  { y: "mc", q: "LDAPS fails even though the CA certificate is trusted and port 636 is open. The directory host is configured by IP address. What's the likely fix?",
    o: ["Use the DC's FQDN that matches its certificate, mapped in the hosts file", "Switch the connection to port 389 and keep the SSL option enabled for security", "Import the DC's private key into the Vault's store", "Restart the PVWA application pool to reload certificates"], a: [0] }
]},
{ id: "o5-who", o: "O5", r: "ldapSetup",
  e: "To set up and manage LDAP directories in the PVWA you must be a member of Vault Admins AND have the Audit Users and Manage Directory Mapping authorizations.",
  v: [
  { y: "multi", q: "To set up LDAP integration in the PVWA, which of these must be true? (Choose three)",
    o: ["You are a member of the Vault Admins group", "You hold the Audit Users authorization", "You hold the Manage Directory Mapping authorization", "You are logged on as the Master user", "You hold the Activate Users authorization", "You are a member of PVWAMonitor"], a: [0, 1, 2] }
]},
{ id: "o5-wizard", o: "O5", r: "ldapSetup",
  e: "Modern wizard: User Provisioning > LDAP Integration > New Domain → Define domain (name, SSL, bind user, bind password, base context) → Select domain controllers → Create directory mapping (Vault Admins, Safe managers, Auditors, Users - optional) → Summary → Save.",
  v: [
  { y: "order", q: "Order the PVWA New Domain workflow.",
    o: ["Open User Provisioning > LDAP Integration and click New Domain", "Define the domain: name, SSL, bind user and password, base context", "Select one or more detected domain controllers and connect", "Define maps for the roles, such as Vault Admins and Auditors", "Review the summary and save"] },
  { y: "multi", q: "Which fields does the Define domain step ask for? (Choose three)",
    o: ["Bind user name and password", "Domain base context", "Use secure connection (SSL)", "Vault location for new users", "RADIUS shared secret", "Recovery private key path"], a: [0, 1, 2] }
]},
{ id: "o5-stored", o: "O5", r: "ldapRefMain",
  e: "LDAP integration parameters configured in the PVWA are stored in LDAPConf.xml in the VaultInternal Safe (don't edit it directly). The bind password object also lives in VaultInternal.",
  v: [
  { y: "mc", q: "Where does the Vault keep the LDAP integration settings configured in the PVWA?",
    o: ["LDAPConf.xml in VaultInternal", "The [LDAP] section of DBParm.ini on the Vault", "Policies.xml in the PVWAConfig Safe", "web.config in the PasswordVault folder"], a: [0] }
]},
{ id: "o5-require", o: "O5", r: "ldapConn",
  e: "RequireLDAPConnectivity (DBParm.ini), default No: the Vault starts regardless of LDAP. Set Yes so the Vault won't start without an active connection to the configured directories.",
  v: [
  { y: "mc", q: "Security wants the Vault to refuse to start if it can't reach LDAP. Which DBParm.ini setting does that?",
    o: ["RequireLDAPConnectivity=Yes", "AutoSyncExternalObjects=No", "ExternalAuthenticationMode=Strict", "ExternalObjectsDeletionPolicy=DeleteAll"], a: [0] },
  { y: "tf", q: "By default, the Vault won't start unless it can connect to its configured LDAP directories.", a: false }
]},
{ id: "o5-multi-domain", o: "O5", r: "multiDir",
  e: "To avoid name collisions across domains, set AddDomainToUserName=Yes (and each directory's DomainName). Vault users become user@domain. It must not be combined with AppendFriendlyDomainNameToGroup. Microsoft AD only.",
  v: [
  { y: "mc", q: "Two trusted AD domains each contain a user named jsmith. How do you keep their Vault users separate?",
    o: ["Set AddDomainToUserName=Yes so names become user@domain", "Give each domain's users a different Vault location", "Set GroupMergeAlgorithm=FirstApplicable", "Enable both AddDomainToUserName and AppendFriendlyDomainNameToGroup"], a: [0] }
]},
{ id: "o5-profile", o: "O5", r: "ldapRef",
  e: "Each directory references a directory profile; for Active Directory the default is MicrosoftADProfile.ini. The directory's name must not change once external users and groups exist.",
  v: [
  { y: "mc", q: "Which directory profile file is used by default for Microsoft Active Directory?",
    o: ["MicrosoftADProfile.ini", "LDAPConf.xml", "ActiveDirectoryProfile.ini", "SunOneProfile.ini"], a: [0] },
  { y: "tf", q: "You can safely rename a directory in the LDAP integration after external users from it exist in the Vault.", a: false }
]},

/* ───────────────────────── O6 · Directory maps & external users ───────────────────────── */
{ id: "o6-template", o: "O6", r: "ldapSetup",
  e: "A directory map = rules (which users/groups may be created) + a user template (user type, authentication method, Vault authorizations, time limitations, location). It grants Vault-level attributes - not Safe permissions.",
  v: [
  { y: "mc", q: "What does a directory map's user template define?",
    o: ["The user type, auth method, Vault authorizations and time limits", "Which Safes the created users join, and with which permissions", "The LDAP query the Vault uses to find domain controllers", "The password policy applied to the users inside AD"], a: [0] },
  { y: "tf", q: "A directory map can grant Safe member permissions to the users it creates.", a: false,
    e: "False. Maps carry Vault-level attributes (user type, auth method, Vault authorizations, time limits). Safe access comes from Safe membership - typically by adding the LDAP group as a Safe member." }
]},
{ id: "o6-order", o: "O6", r: "ldapSetup",
  e: "Maps are matched in Map Order - the first map in the list has the highest priority, and the first match wins. Arrows move maps up and down.",
  v: [
  { y: "mc", q: "A user belongs to two AD groups that each have their own directory map. Which map's template is applied?",
    o: ["The map that appears first in the map order", "The map that grants the most authorizations", "Both maps, merged together", "The map that was created most recently"], a: [0] },
  { y: "mc", q: "Vault admins log on but get no authorizations, even though their AD group is mapped correctly. What's the most likely cause?",
    o: ["A broader map that also matches them sits above the Vault Admins map", "GroupMergeAlgorithm is set to FirstApplicable instead of DenyOverrides", "The bind account only has read-only rights", "RequireLDAPConnectivity is set to No"], a: [0] }
]},
{ id: "o6-builtins", o: "O6", r: "ldapSetup",
  e: "Built-in maps: Vault Users Mapping (users, EPVUser, LDAP auth, no authorizations), Vault Groups Mapping (groups, base context), Vault Auditors Mapping (Audit Users), Vault Admins Mapping (all authorizations). Location \"/\".",
  v: [
  { y: "match", q: "Match each built-in directory map to the Vault authorizations it grants.",
    p: [["Vault Users Mapping", "None"], ["Vault Auditors Mapping", "Audit Users"], ["Vault Admins Mapping", "All authorizations"], ["Vault Groups Mapping", "Applies to groups, not users"]] },
  { y: "mc", q: "Users created by the built-in Vault Auditors mapping receive which Vault authorization?",
    o: ["Audit Users", "All authorizations", "No authorizations", "Audit Users and Reset Users' Passwords"], a: [0] },
  { y: "mc", q: "What user type and authentication method do the built-in user mappings assign?",
    o: ["EPVUser with LDAP authentication", "BizUser with CyberArk password", "EPVUser with Windows authentication", "PSMUser with RADIUS authentication"], a: [0] }
]},
{ id: "o6-role-groups", o: "O6", r: "ldapSetup",
  e: "Modern wizard default roles: Vault Admins → Vault Admins + PVWAMonitor; Safe managers → PVWAMonitor; Auditors → Auditors + PVWAMonitor; Users → no Vault group (permissions come later from Safe membership).",
  v: [
  { y: "match", q: "In the modern LDAP wizard, match each role's external group to the Vault group(s) it's added to.",
    p: [["Vault Admins", "Vault Admins and PVWAMonitor"], ["Safe managers", "PVWAMonitor only"], ["Auditors", "Auditors and PVWAMonitor"], ["Users", "No Vault group at all"]] },
  { y: "mc", q: "Which default wizard role logs users in but adds them to no Vault group?",
    o: ["Users", "Safe managers", "Auditors", "Vault Admins"], a: [0] }
]},
{ id: "o6-apply", o: "O6", r: "ldapSetup",
  e: "Map template changes are applied when a new LDAP user is created, or when an existing LDAP user logs on again or is added as a Safe member or group member.",
  v: [
  { y: "mc", q: "You add Reset Users' Passwords to a map's template. When do EXISTING users from that map receive it?",
    o: ["The next time each one logs on, or is added to a Safe or group", "Immediately, for every user created by the map", "Never, because a template only affects users created after the change", "Only during the next AutoSyncExternalObjects window"], a: [0] }
]},
{ id: "o6-delegate", o: "O6", r: "ldapSetup",
  e: "Delegate via a map: as a Vault Admins member with Manage Directory Mapping, open LDAP Integration, Add Mapping (name + order above the generic map), scope = the LDAP group, template Authorization = Activate Users (+ Audit Users), save.",
  v: [
  { y: "order", q: "Delegate the right to unsuspend users to the Tier1 support AD group. Order the steps.",
    o: ["Sign in to the PVWA as a user with Manage Directory Mapping", "Open User Provisioning > LDAP Integration", "Add a mapping and set its name and map order", "Set the mapping scope to the Tier1 LDAP group", "In the user template, assign Activate Users and Audit Users"] },
  { y: "mc", q: "What is the cleanest way to let every member of the AD group ServiceDesk unsuspend users?",
    o: ["A ServiceDesk map granting Activate Users + Audit Users, above the users map", "Add the ServiceDesk LDAP group as a member of the Vault Admins group", "Grant ServiceDesk the Unlock accounts permission on every Safe", "Add the ServiceDesk group to the Operators group"], a: [0] }
]},
{ id: "o6-ext-groups", o: "O6", r: "ldapUsers",
  e: "External groups are created in the Vault when an LDAP group is added as a Safe member/owner or as a member of a Vault group.",
  v: [
  { y: "mc", q: "When is an LDAP group created in the Vault?",
    o: ["When it is added as a Safe member or as a member of a Vault group", "As soon as the group is created in Active Directory and replicated", "During every AutoSyncExternalObjects window", "When the bind account first reads the group's object"], a: [0] }
]},
{ id: "o6-sync", o: "O6", r: "ldapSync",
  e: "AutoSyncExternalObjects=Yes,24,1,5 (default): once per 24 hours between 01:00 and 05:00. ExternalObjectsUpdatePolicy=UpdateAll. ExternalObjectsDeletionPolicy=DeleteAll (delete if not in the directory OR not matching a map).",
  v: [
  { y: "mc", q: "By default, when does the Vault synchronize external users and groups with the directory?",
    o: ["Once every 24 hours, between 01:00 and 05:00", "Every 2 hours, around the clock", "Only when each user logs on", "Every 24 hours, between 19:00 and 24:00"], a: [0] },
  { y: "mc", q: "Which DBParm.ini parameter decides whether external users are deleted when they leave the directory or stop matching a map?",
    o: ["ExternalObjectsDeletionPolicy", "ExternalObjectsUpdatePolicy", "AutoSyncExternalObjects", "PreDefinedUsersOwnerRemoval"], a: [0] },
  { y: "mc", q: "What is the default value of ExternalObjectsDeletionPolicy?",
    o: ["DeleteAll", "DeleteNone", "DeleteNonExisting", "DeleteNonMatched"], a: [0] }
]},
{ id: "o6-disabled-ad", o: "O6", r: "ldapSync",
  e: "Under every deletion policy - including the default DeleteAll - a user who is DISABLED or EXPIRED in AD is not deleted by the sync. Deletion happens when the user is removed from the directory, moved out of scope, or matches no map.",
  v: [
  { y: "mc", q: "With the default deletion policy, a user is DISABLED in AD. What happens to their Vault user at the next sync?",
    o: ["It is not deleted by the sync", "It is deleted, because DeleteAll is the default", "It is converted into an internal CyberArk user", "It is moved to the Vault's root location"], a: [0] },
  { y: "mc", q: "With ExternalObjectsDeletionPolicy=DeleteAll, which situation deletes the Vault user at the next sync?",
    o: ["It no longer matches any map", "The user's AD account is disabled", "The user's AD account has expired", "The user hasn't logged on to the Vault for 90 days"], a: [0] }
]},
{ id: "o6-add-ldapgroup", o: "O6", r: "ldapSafe",
  e: "PrivateArk: Users and Groups → select the VAULT group → Update → Members: Add → LDAP Group (or Add from LDAP to search the directory). A user's own memberships live on the user's Member Of tab.",
  v: [
  { y: "mc", q: "In the PrivateArk Client, how do you make the AD group DBA-Team a member of the Vault group DB-Admins?",
    o: ["Select DB-Admins, click Update, then Add > LDAP Group", "Select DB-Admins, open Member Of, then Add > LDAP Group", "Select DBA-Team, click Update, then Add > Vault Group", "Open Directory Mapping, click Add, then tick Groups"], a: [0] },
  { y: "mc", q: "Which tab of a user's PrivateArk properties manages the groups that user belongs to?",
    o: ["Member Of", "Authorizations", "General", "Authentication"], a: [0] }
]},
{ id: "o6-exact-contains", o: "O6", r: "ldapSetup",
  e: "Map by LDAP group: Exact = one specific group (pick from the drop-down, View users to preview); Contains = every LDAP group whose name contains the string.",
  v: [
  { y: "mc", q: "When defining a map in the PVWA, what does choosing Contains for the LDAP group do?",
    o: ["Maps every LDAP group whose name contains the text you typed", "Includes all nested groups of the chosen group recursively", "Maps every user whose name contains the text you typed", "Requires the group's name to match the text exactly"], a: [0] },
  { y: "mc", q: "Before saving a map, how can you preview which AD users it will cover?",
    o: ["Click View users on the mapping criteria", "Run a manual AutoSyncExternalObjects cycle", "Log on as each user once to see if they're created", "Export LDAPConf.xml from the VaultInternal Safe"], a: [0],
    e: "In the PVWA, View users lists the users in the selected LDAP group. In the PrivateArk Directory Mapping rule dialog, the Test button shows the users who meet the criteria." }
]},
{ id: "o6-nested", o: "O6", r: "ldapRef",
  e: "GroupRecursiveSearch defaults to No: only one level of groups is searched, so membership through nested AD groups isn't seen. Setting Yes searches multiple levels but can hurt performance.",
  v: [
  { y: "tf", q: "By default, the Vault searches nested AD groups recursively when resolving a user's group memberships.", a: false },
  { y: "mc", q: "A user is only in a group that is nested inside the mapped AD group, and they don't match the map. Why?",
    o: ["GroupRecursiveSearch defaults to No, so nesting isn't followed", "Nested groups can only be used with Contains, not Exact", "The bind account cannot read nested group objects", "Maps only consider the user's primary group"], a: [0] }
]},
{ id: "o6-pa-location", o: "O6", r: "ldapSetup",
  e: "In PrivateArk Directory Mapping, Location sets where in the Vault hierarchy the map creates users; 'Use LDAP Branches as Vault Locations' creates locations that mirror the users' LDAP branches.",
  v: [
  { y: "mc", q: "In PrivateArk Directory Mapping, what does Use LDAP Branches as Vault Locations do?",
    o: ["Creates Vault locations that mirror the users' LDAP branches", "Copies AD group memberships into Vault group memberships", "Limits the map to users in the domain's root container", "Uses each branch as a separate directory map rule"], a: [0] }
]},

/* ───────────────────────── O7 · Authentication ───────────────────────── */
{ id: "o7-methods", o: "O7", r: "authOverview",
  e: "PVWA primary methods: Password (CyberArk), Windows, RADIUS, PKI, LDAP, SAML (plus FIDO). Secondary methods after an SSO primary: LDAP, RADIUS or CyberArk password.",
  v: [
  { y: "multi", q: "Which of these are PVWA authentication methods? (Choose three)",
    o: ["CyberArk password", "LDAP", "SAML", "Trusted Network Area", "Gateway account", "Directory mapping"], a: [0, 1, 2] },
  { y: "mc", q: "What is the PVWA's DefaultMethod right after installation?",
    o: ["cyberark (Vault password)", "ldap (directory password)", "windows (integrated SSO)", "saml (identity provider)"], a: [0] },
  { y: "mc", q: "Which methods can the PrivateArk Client use to log on to the Vault?",
    o: ["Password, RADIUS and LDAP", "Password, SAML and PKI", "Windows, SAML and OIDC", "Only the CyberArk password"], a: [0] }
]},
{ id: "o7-enable", o: "O7", r: "ldapAuth",
  e: "PVWA: Administration > Options > Authentication Methods > select the method > Enabled = Yes. Apply = now; Save = after RefreshPeriod.",
  v: [
  { y: "mc", q: "LDAP sign-in doesn't appear on the PVWA logon page. Where do you turn it on?",
    o: ["Administration > Options > Authentication Methods > ldap > Enabled", "User Provisioning > LDAP Integration > the domain > Enable LDAP sign-in", "DBParm.ini: ExternalAuthenticationMode=AllowAll", "PrivateArk Client > Vault Properties > Advanced > LDAP authentication"], a: [0] },
  { y: "mc", q: "After changing a PVWA option, what's the difference between Apply and Save?",
    o: ["Apply takes effect now; Save takes effect after the RefreshPeriod", "Apply affects only your own session; Save affects every PVWA user", "Apply writes to the Vault; Save writes to web.config", "There is no difference; both take effect immediately"], a: [0] }
]},
{ id: "o7-two-halves", o: "O7", r: "radius",
  e: "Two halves: the Vault user's authentication method must be set (PrivateArk Authentication tab or the map template) AND the method must be enabled in the interface (PVWA Authentication Methods).",
  v: [
  { y: "multi", q: "The Vault is already integrated with RADIUS. Which two things must be true for user mike to sign in to the PVWA with RADIUS? (Choose two)",
    o: ["mike's Vault user has RADIUS as its authentication method", "radius is Enabled in the PVWA Authentication Methods", "mike is a member of the PVWAMonitor group", "mike holds the Activate Users authorization"], a: [0, 1] },
  { y: "mc", q: "Where do you set a CyberArk user's own authentication method in the PrivateArk Client?",
    o: ["Update the user > Authentication tab > Authentication method", "Update the user > General tab > User type > Authorized Interfaces", "Tools > Administrative Tools > Directory Mapping", "File > Options > Security > Logon method"], a: [0] }
]},
{ id: "o7-radius", o: "O7", r: "radius",
  e: "RADIUS: define the Vault as a RADIUS client → stop the Vault → CAVaultManager SecureSecretFiles encrypts the secret into a file → DBParm.ini RadiusServersInfo=IP;port;VaultClientName;secretfile → start the Vault and check the log → store the secret file in a Safe.",
  v: [
  { y: "order", q: "Put the RADIUS integration steps in order.",
    o: ["Define the Vault as a client on the RADIUS server", "Stop the Vault server", "Encrypt the secret with CAVaultManager SecureSecretFiles", "Set RadiusServersInfo in DBParm.ini", "Start the Vault and check the log for errors"] },
  { y: "mc", q: "How is the RADIUS shared secret provided to the Vault?",
    o: ["Encrypted into a file by CAVaultManager SecureSecretFiles", "Typed into PVWA Authentication Methods > radius", "Stored in plain text in DBParm.ini", "Onboarded as an account in the VaultInternal Safe for the CPM to manage"], a: [0] },
  { y: "mc", q: "In RadiusServersInfo=10.0.0.5;1812;vault01;radiusauth.dat, what do the four fields mean, in order?",
    o: ["Server IP; port; the Vault's RADIUS client name; secret file", "Server IP; port; bind user; bind password file", "Vault IP; port; RADIUS server name; log file", "Server IP; timeout; Vault hostname; certificate file"], a: [0] },
  { y: "tf", q: "RadiusServersInfo can list several RADIUS servers (comma-separated) for high availability.", a: true }
]},
{ id: "o7-secondary", o: "O7", r: "authPVWA",
  e: "Secondary auth: on the primary method set UseVaultAuthentication=Yes plus UseRadius=Yes or UseLDAP=Yes. UseRadius and UseLDAP are mutually exclusive and both require UseVaultAuthentication. Primary SSO methods: Windows, PKI, SAML, Cognito.",
  v: [
  { y: "mc", q: "You want PKI sign-in followed by a RADIUS token code. Which settings go on the pki method?",
    o: ["UseVaultAuthentication=Yes and UseRadius=Yes", "UseRadius=Yes on its own", "UseLDAP=Yes and UseRadius=Yes", "DefaultMethod=radius in GeneralSettings"], a: [0] },
  { y: "multi", q: "Which methods can act as SECONDARY authentication after an SSO primary method? (Choose three)",
    o: ["LDAP", "RADIUS", "CyberArk password", "Windows", "PKI", "SAML"], a: [0, 1, 2] }
]},
{ id: "o7-windows", o: "O7", r: "windowsAuth",
  e: "Windows authentication to the PVWA requires the PVWA to be on a machine in the domain that can reach the AD that authenticates the user. It's SSO - no extra prompt.",
  v: [
  { y: "mc", q: "What does Windows authentication to the PVWA require?",
    o: ["The PVWA server is a domain member that can reach the AD", "The Vault server is joined to the same Windows domain", "A RADIUS server that proxies the Windows credentials", "LDAPS on port 636 from the user's workstation"], a: [0] }
]},
{ id: "o7-saml-pki", o: "O7", r: "saml",
  e: "SAML: the IdP's Audience must equal the PVWA's ServiceProvider Name (saml.config); the user name comes in NameID; SP-initiated by default. PKI: users must already exist in the Vault (LDAP-provisioned or created manually).",
  v: [
  { y: "mc", q: "With SAML, which IdP setting must match the PVWA's ServiceProvider Name?",
    o: ["Audience", "Assertion Consumer URL", "NameID format", "LogoffUrl"], a: [0] },
  { y: "mc", q: "Before users can sign in to the PVWA with PKI, what must be true?",
    o: ["Each user already exists in the Vault, LDAP-provisioned or manual", "Each user's certificate is uploaded to the PVWAConfig Safe", "Each user has the Gateway Account option selected", "Each user is a member of the PVWAUsers group in AD"], a: [0],
    r: "pki" }
]},
{ id: "o7-extmode", o: "O7", r: "authPVWA",
  e: "ExternalAuthenticationMode (v14.4+): Strict = only methods in the user's/map's Authentication permissions; AllowAutomaticConfig (clean-install default) = the first external method used is recorded and becomes the only one allowed; AllowAll (upgrade default; required with Remote Access) = any external method works.",
  v: [
  { y: "mc", q: "On a clean install, a user with empty Authentication permissions signs in with SAML for the first time. What happens?",
    o: ["It succeeds, and SAML becomes their only allowed external method", "It is rejected until an administrator adds SAML to their permissions", "It succeeds, and every external method stays allowed", "It succeeds only if SAML is the PVWA DefaultMethod"], a: [0] },
  { y: "mc", q: "Which ExternalAuthenticationMode allows only the external methods listed in a user's Authentication permissions?",
    o: ["Strict", "AllowAutomaticConfig", "AllowAll", "DenyOverrides"], a: [0] }
]},
{ id: "o7-pwpolicy", o: "O7", r: "addUserPVWA",
  e: "Default Vault password rules: at least 6 characters, at least one number, one uppercase and one lowercase letter.",
  v: [
  { y: "mc", q: "Which initial password meets the default Vault password rules?",
    o: ["Vault7x", "vault77x", "VAULT77", "Vaultxy"], a: [0],
    e: "Default: 6+ characters with a number, an uppercase and a lowercase letter. vault77x has no uppercase, VAULT77 no lowercase, Vaultxy no number." }
]},
{ id: "o7-pa-client", o: "O7", r: "ldapAuth",
  e: "To make the PrivateArk Client itself log on with LDAP (or RADIUS): right-click the Vault > Properties > Advanced > select the authentication method.",
  v: [
  { y: "mc", q: "Where do you switch the PrivateArk Client's own logon to LDAP authentication?",
    o: ["Right-click the Vault > Properties > Advanced", "Tools > Administrative Tools > Directory Mapping", "PVWA > Options > Authentication Methods > ldap", "File > Options > Security > LDAP"], a: [0] }
]},

/* ───────────────────────── O8 · Restrictions & suspension ───────────────────────── */
{ id: "o8-hours", o: "O8", r: "addUserPA",
  e: "Time Limitations tab: 'Enable this User to logon at' (allowed hours), 'Automatically expire User account on' (end date), History (days of activity kept; 0 = not written to an audit log).",
  v: [
  { y: "tf", q: "It is possible to control the hours of the day during which a user may log on to the Vault.", a: true },
  { y: "mc", q: "In PrivateArk, where do you limit a contractor to logging on 08:00-18:00 and expire the account on 31 December?",
    o: ["Users and Groups > Update the user > Time Limitations tab", "Users and Groups > Update the user > General tab > Disable User", "Tools > Administrative Tools > Network Area > hours", "Users and Groups > Update the user > Authorizations tab"], a: [0] },
  { y: "tf", q: "Setting a user's History to 0 days means their Vault activity is not written to an audit log.", a: true }
]},
{ id: "o8-states", o: "O8", r: "restActivate",
  e: "Disabled = set by an admin (Disable User / Disable). Suspended = automatic after too many violations; cleared by activating the user. Expired = the account's expiry date passed.",
  v: [
  { y: "mc", q: "What's the difference between a disabled user and a suspended user?",
    o: ["Disabled is set by an admin; suspended happens after too many violations", "Disabled is temporary; suspended is permanent until deletion", "Disabled applies to LDAP users; suspended applies to internal users", "They are the same state shown under different names"], a: [0] },
  { y: "tf", q: "The REST Activate user call also re-enables a user who was disabled by an administrator.", a: false,
    e: "False. Activate user \"activates a suspended user. It does not activate an inactive user.\" A disabled user is re-enabled with Enable (or by clearing Disable User)." }
]},
{ id: "o8-maxviol", o: "O8", r: "dbparm",
  e: "MaxAccessViolations (default 5) = violations in the 'All' network area before the user is suspended. UserLockoutPeriodInMinutes (default -1 = no automatic unlock) = minutes before automatic unsuspend. MaskUserIsSuspendedMessage=Yes shows a generic failure.",
  v: [
  { y: "mc", q: "With default DBParm.ini settings, how many violations suspend a user?",
    o: ["5", "3", "10", "There's no limit by default"], a: [0] },
  { y: "mc", q: "How do you make suspended users unlock automatically after 30 minutes?",
    o: ["Set UserLockoutPeriodInMinutes=30 in DBParm.ini", "Set MaxAccessViolations=30 in DBParm.ini", "Set LockTimeout=30 in DBParm.ini", "Set IdleTimeout=30 in DBParm.ini"], a: [0] },
  { y: "mc", q: "Security doesn't want attackers to learn that an account was suspended. Which setting helps?",
    o: ["MaskUserIsSuspendedMessage=Yes", "HideVaultUsersTree=Yes", "MaxAccessViolations=0", "EnablePreDefinedUsers=None"], a: [0] }
]},
{ id: "o8-unsuspend", o: "O8", r: "trustedNet",
  e: "Unsuspend: PrivateArk Users and Groups → user → Trusted Net Areas → Activate; the PVWA UI; REST POST /API/Users/{id}/Activate; on a Read-Only Vault (local suspension) CAVaultManager UnSuspendUser. Requires Activate Users (+ Audit Users).",
  v: [
  { y: "mc", q: "bob is suspended. Which PrivateArk path reactivates him?",
    o: ["Users and Groups > select bob > Trusted Net Areas > Activate", "Users and Groups > bob > Update > General > clear Disable User", "Network Area > All > Update > reset violations", "Directory Mapping > bob's map > Update > Enable"], a: [0] },
  { y: "mc", q: "A user is suspended on one Read-Only (satellite) Vault only. How do you unsuspend them there?",
    o: ["Run CAVaultManager.exe UnSuspendUser on that Read-Only Vault", "Activate them in the Primary Vault's PVWA; it replicates to satellites", "Restart the Read-Only Vault's PrivateArk Server", "Run PARestore against that Read-Only Vault"], a: [0], r: "roSuspend" },
  { y: "mc", q: "Which REST call reactivates a suspended user?",
    o: ["POST /API/Users/{id}/Activate", "PUT /API/Users/{id} with enableUser=true", "POST /API/Users/{id}/ResetPassword", "DELETE /API/Users/{id}/Suspension"], a: [0], r: "restActivate" }
]},
{ id: "o8-netarea", o: "O8", r: "netAreas",
  e: "Network Areas (Tools > Administrative Tools > Network Area; needs Add Network Areas) are defined by mask or range. 1.1.1.1/24 → any address starting 1.1.1.; /16 → 1.1.; /32 → only 1.1.1.1. A new area needs an equal or higher security level than its parent. 'Enforce Network Areas through Gateway' limits web-app logons to the user's allocated area.",
  v: [
  { y: "mc", q: "A network area is defined as 1.1.1.1 with mask 24. Who can use it?",
    o: ["Any computer whose IP address begins with 1.1.1.", "Only the computer at 1.1.1.1", "Any computer whose IP address begins with 1.1.", "Addresses 1.1.1.1 through 1.1.1.24"], a: [0] },
  { y: "mc", q: "Which Vault authorization lets someone define new network areas?",
    o: ["Add Network Areas", "Reset Users' Passwords", "Manage Directory Mapping", "Manage Server File Categories"], a: [0] },
  { y: "mc", q: "Which network area option makes users log on to web applications only from the area allocated to them?",
    o: ["Enforce Network Areas through Gateway", "Require a Trusted Network Area for web logons", "Security Level: High", "Mask 32"], a: [0] }
]},
{ id: "o8-trusted", o: "O8", r: "trustedNet",
  e: "A Trusted Network Area = a network area a specific user may log on from, with optional hours and a maximum violation count; at the limit it's deactivated until an admin reactivates it. Violations include a wrong password and logging on outside permitted hours. Setup: Add/Update Users + Audit Users. Activate/deactivate: Activate Users.",
  v: [
  { y: "mc", q: "What is a Trusted Network Area?",
    o: ["An area a specific user may log on from, with hours and a violation limit", "An IP range whose users are allowed to skip Vault authentication entirely", "The subnet the Vault cluster nodes use for heartbeats", "The list of domain controllers trusted for LDAPS"], a: [0] },
  { y: "multi", q: "Which of these count as violations against a Trusted Network Area? (Choose two)",
    o: ["Logging on with an incorrect password", "Logging on outside the permitted hours", "Retrieving a password without dual-control approval", "Opening the PVWA in a second browser tab"], a: [0, 1] },
  { y: "multi", q: "To SET UP Trusted Network Areas for other users, which authorizations are needed? (Choose two)",
    o: ["Add/Update Users", "Audit Users", "Add Network Areas", "Manage Directory Mapping"], a: [0, 1] }
]},
{ id: "o8-idle", o: "O8", r: "dbparm",
  e: "IdleTimeout (default 20 minutes) logs off idle Vault sessions. LockTimeout (default 30) is when users must re-authenticate. UserLockoutPeriodInMinutes is about suspension, not sessions.",
  v: [
  { y: "mc", q: "Which DBParm.ini parameter logs off an idle Vault session (default 20 minutes)?",
    o: ["IdleTimeout", "LockTimeout", "UserLockoutPeriodInMinutes", "DefaultTimeout"], a: [0] }
]},

/* ───────────────────────── O9 · Tools & paths ───────────────────────── */
{ id: "o9-pa-paths", o: "O9", r: "addUserPA",
  e: "PrivateArk Client: Tools > Administrative Tools > Users and Groups (users, groups, Trusted Net Areas), Directory Mapping (maps), Network Area (network areas). PVWA: Administration > Options > Authentication Methods for sign-in methods.",
  v: [
  { y: "match", q: "Match each task to where you do it.",
    p: [["Create a Vault user", "PrivateArk: Tools > Administrative Tools > Users and Groups"], ["Create a directory map", "PrivateArk: Tools > Administrative Tools > Directory Mapping"], ["Define an IP range for logons", "PrivateArk: Tools > Administrative Tools > Network Area"], ["Enable LDAP sign-in", "PVWA: Administration > Options > Authentication Methods"]] },
  { y: "mc", q: "In the PrivateArk Client, where do you create a new directory map?",
    o: ["Tools > Administrative Tools > Directory Mapping > Add", "Tools > Administrative Tools > Users and Groups > New > Map", "File > Properties > LDAP > Add Map", "Tools > Administrative Tools > Network Area > New"], a: [0], r: "ldapSetup" }
]},
{ id: "o9-pvwa-paths", o: "O9", r: "addUserPVWA",
  e: "Modern PVWA: User Provisioning > Users (Create CyberArk User, edit, disable/enable, delete), User Provisioning > Groups, User Provisioning > LDAP Integration (New Domain, Add Mapping, edit mappings).",
  v: [
  { y: "mc", q: "In the modern PVWA, where do you create a CyberArk-authenticated user for a REST integration?",
    o: ["User Provisioning > Users > Create CyberArk User", "User Provisioning > LDAP Integration > Add Mapping", "Administration > Configuration Options > Users", "Policies > Access Control (Safes) > Add Member"], a: [0] },
  { y: "mc", q: "In the modern PVWA, where do you edit an existing directory mapping?",
    o: ["User Provisioning > LDAP Integration > the mapping > Edit", "Administration > Options > LDAP Search > Mappings", "Policies > Master Policy > Directory Mapping", "User Provisioning > Groups > the group > Edit"], a: [0], r: "ldapSetup" }
]},
{ id: "o9-rest", o: "O9", r: "restMember",
  e: "REST: POST /API/Users (add user; needs Add/Update Users), POST /API/UserGroups (create group), POST /API/UserGroups/{id}/Members (add member; memberType vault|domain), POST /API/Users/{id}/Activate (unsuspend).",
  v: [
  { y: "match", q: "Match each REST endpoint to its purpose.",
    p: [["POST /API/Users", "Add a new Vault user"], ["POST /API/UserGroups", "Create a new Vault group"], ["POST /API/UserGroups/{id}/Members", "Add a member to a Vault group"], ["POST /API/Users/{id}/Activate", "Reactivate a suspended user"]] },
  { y: "mc", q: "Which REST call adds an LDAP group to an existing Vault group?",
    o: ["POST /API/UserGroups/{id}/Members with memberType domain", "POST /API/Users with source set to LDAP", "PUT /API/Configuration/LDAP/Directories/{name}", "POST /API/Safes/{safe}/Members with an LDAP name"], a: [0] }
]},
{ id: "o9-add-to-group", o: "O9", r: "restMember",
  e: "A user can be added directly to a Vault group (such as Vault Admins) with the REST API, the PrivateArk Client or PACLI (ADDGROUPMEMBER). AD membership alone doesn't do it unless the AD group is itself a member of the Vault group.",
  v: [
  { y: "multi", q: "Which tools can add a user directly to the Vault Admins group? (Choose three)",
    o: ["REST API", "PrivateArk Client", "PACLI", "Active Directory on its own", "A SailPoint naming policy", "Editing DBParm.ini"], a: [0, 1, 2] }
]},
{ id: "o9-version", o: "O9", r: "msgUsers",
  e: "\"The server version is different from the client version. You cannot manage users, groups or directory mapping.\" → upgrade the PrivateArk Client to the same version as the PrivateArk Server.",
  v: [
  { y: "mc", q: "The PrivateArk Client says you cannot manage users, groups or directory mapping because the versions differ. What's the fix?",
    o: ["Upgrade the PrivateArk Client to match the server", "Grant yourself Manage Directory Mapping, then log on again", "Log on again as the Master user", "Restart the PrivateArk Server service"], a: [0] }
]},
{ id: "o9-addfromldap", o: "O9", r: "ldapSafe",
  e: "To add an AD user or group that isn't in the Vault yet as a Safe owner in PrivateArk: Owners > Add > Add From LDAP > search the directory > select. That reference creates the external user/group.",
  v: [
  { y: "mc", q: "In the PrivateArk Owners window, how do you add an AD user who has never logged on to the Vault?",
    o: ["Add > Add From LDAP, search the directory, select the user", "Create them first as a CyberArk user with LDAP authentication", "Wait for the nightly sync to create them, then add them", "Type their UPN; the Vault resolves it at the next sync"], a: [0] }
]},
{ id: "o9-tabs", o: "O9", r: "addUserPA",
  e: "PrivateArk user tabs: General (type, location, Authorized Interfaces, Gateway Account, Disable User), Authentication (method, password, must change, never expires, DN), Authorizations (Vault authorizations), Member Of (groups), Time Limitations (history, logon hours, expiry). General and Authentication are mandatory.",
  v: [
  { y: "match", q: "Match each setting to the PrivateArk user-properties tab it lives on.",
    p: [["Authorized Interfaces", "General"], ["Password Never Expires", "Authentication"], ["Reset Users' Passwords", "Authorizations"], ["Groups the user belongs to", "Member Of"], ["Allowed logon hours", "Time Limitations"]] },
  { y: "mc", q: "Which two tabs are mandatory when you create a new user in the PrivateArk Client?",
    o: ["General and Authentication", "General and Authorizations", "Authentication and Member Of", "Authorizations and Time Limitations"], a: [0] }
]},
{ id: "o9-split", o: "O9", r: "ldapSetup",
  e: "If LDAP was configured in the PrivateArk Client with several rules in one map, split them into one map per rule before running the PVWA LDAP integration wizard.",
  v: [
  { y: "mc", q: "Maps created in PrivateArk contain several rules each. Before you use the PVWA LDAP wizard, what should you do?",
    o: ["Split them so each directory map has a single rule", "Delete all maps and let the wizard recreate them", "Merge them into one map with all rules", "Export them to LDAPConf.xml first"], a: [0] }
]},

/* ───────────────────────── O10 · Users meet Safes ───────────────────────── */
{ id: "o10-merge", o: "O10", r: "overview",
  e: "GroupMergeAlgorithm (DBParm.ini): DenyOverrides (default) = the combination of all the user's groups' permissions; FirstApplicable = only the first group the user was added to.",
  v: [
  { y: "mc", q: "By default, a user in two groups that are both members of a Safe gets which permissions there?",
    o: ["The combined permissions of both groups", "Only the permissions of the first group added", "Only the permissions the two groups have in common", "None until an admin resolves the conflict"], a: [0] },
  { y: "mc", q: "Which DBParm.ini value gives users only the permissions of the first group they were added to?",
    o: ["GroupMergeAlgorithm=FirstApplicable", "GroupMergeAlgorithm=DenyOverrides", "PreDefinedGroupsOwnerRemoval=All", "AutomaticallyAddBuiltInGroups=NONE"], a: [0] }
]},
{ id: "o10-direct", o: "O10", r: "overview",
  e: "A user who is also a DIRECT member of a Safe gets their own (user) permissions on it - they override the groups' permissions, even if narrower.",
  v: [
  { y: "mc", q: "Alice is a direct member of the Linux Safe with List accounts only; her group has Use and Retrieve there. What can she do?",
    o: ["Only list accounts: her direct membership overrides the group's", "List, use and retrieve: permissions are always combined", "Nothing: the conflict blocks her access to the Safe", "Use and retrieve, but not list accounts"], a: [0] }
]},
{ id: "o10-grant-own", o: "O10", r: "manMember",
  e: "Safe members: you can only assign the permissions your own user has, and you can only edit or remove members who have the same or fewer permissions than you. All of it requires Manage Safe Members.",
  v: [
  { y: "tf", q: "When adding a Safe member, you can only assign permissions that your own user has.", a: true },
  { y: "mc", q: "Raj has Manage Safe Members but not Retrieve accounts on a Safe. He tries to give the Ops group Retrieve accounts. What happens?",
    o: ["He can't: you can only assign permissions you hold", "It works: Manage Safe Members allows any permission", "It works, but only for LDAP groups", "It works after a dual-control approval"], a: [0] },
  { y: "mc", q: "Which Safe members are you allowed to remove from a Safe?",
    o: ["Members with the same or fewer permissions than you", "Any member, as long as you hold Manage Safe Members", "Only members you added yourself", "Only members who are internal CyberArk users"], a: [0] }
]},
{ id: "o10-msm", o: "O10", r: "addMember",
  e: "Manage Safe Members (a Safe permission) lets a user add existing Vault users and groups and LDAP users/groups as Safe members, set and update their permissions, and remove members.",
  v: [
  { y: "mc", q: "Which Safe permission lets a team lead add AD users and groups to their own Safe?",
    o: ["Manage Safe Members", "Manage Safe", "Add accounts", "Access Safe without confirmation"], a: [0] }
]},
{ id: "o10-ldap-member", o: "O10", r: "ldapSafe",
  e: "To have AD drive Safe access, add the LDAP group itself as a Safe member. New members get access at their next logon - no CyberArk change needed. Maps don't carry Safe permissions.",
  v: [
  { y: "mc", q: "New DBAs should get Safe access automatically once HR adds them to the AD group DBA-Team. What's the best approach?",
    o: ["Add the LDAP group DBA-Team as a member of the DBA Safes", "Create each DBA manually and add them to the Safes", "Put the Safe permissions in a directory map's template", "Add DBA-Team to the Vault Admins group"], a: [0] }
]}
];
