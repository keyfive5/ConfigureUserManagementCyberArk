# User Management Lab: CyberArk PAM-DEF

**Live:** https://keyfive5.github.io/ConfigureUserManagementCyberArk/

A focused study app for the **Configure User Management** content area of the CyberArk
Defender – PAM (PAM-DEF) exam. It's built to move a learner from 0% to confident on this
one domain. Every fact is checked against the official
[PAM Self-Hosted documentation](https://docs.cyberark.com/pam-self-hosted/latest/en/content/landing%20pages/lpusermanagement.htm),
and every question links to the page that proves its answer.

## What's inside

| Mode | What it does |
|---|---|
| **Learn** | 10 lessons, one per objective. Each one teaches first: concept cards, exam traps, a *say-it-out-loud* prompt with a model answer, then a 3-question check. |
| **Smart Drill** | 84 facts asked in 165 different wordings and formats (single answer, choose-N, true/false, ordering, matching). A miss comes back a few questions later **in different words**, so you prove understanding instead of recognition. |
| **Lab Missions** | 12 hands-on tasks in simulated **PrivateArk Client** and **PVWA** screens: unsuspend a user, delegate Activate Users, lock a contractor to PVWA, fix map order, add an LDAP group to a Vault group, enable RADIUS, and more. The app grades the resulting configuration and then shows the real path. |
| **Ace Check** | Exam conditions: 30 questions, 40 minutes, 3 per objective, no feedback until the end, optional hidden answer numbers. 85%+ twice = exam-ready. |
| **Confidence check** | Every answer records whether you were *sure*. "Sure but wrong" answers become misconceptions that the drill chases first. |
| **Cheat sheet** | One printable page with every key point. |
| **Sign in & sync** | Optional free sign-in (Puter, the same account as the PAM-DEF Trainer). Progress follows you to any device. |

The 10 objectives: the user model and hierarchy · user types and authorized interfaces · Vault
authorizations · predefined users and groups · LDAP integration setup · directory maps and
external users · authentication methods · restrictions, suspension and network areas · where
to do it (PrivateArk, PVWA, REST, PACLI) · how users and groups meet Safes.

## Design notes

- **No build, no dependencies.** Plain HTML/CSS/JS. Open `index.html` directly or serve the folder.
- Progress is saved in the browser (`localStorage`). Signing in syncs it to your Puter account
  (`assets/sync.js`). Sync **merges and never overwrites**: on sign-in, on load and whenever the tab
  regains focus, the app reads the cloud copy, merges it with this device and uploads the result.
  Each fact keeps its most recent streak, the history of correctly answered wordings is combined,
  lessons, missions and exams are combined, and confidence counters are kept per device so nothing
  is double-counted. Nothing is uploaded until the cloud copy has been read. If the Puter SDK
  can't load, the app stays local-only, and export/import remain on the About page.
- **The answer can't be guessed from its shape.** Options are shuffled every time, and
  `tests/check.mjs` fails the build if the correct option is the longest one in more than
  40% of single-answer questions. It currently sits at 29% longest and 18% shortest, close to
  the 25% you'd expect by chance with four options.
- Keyboard: `1–9` pick, arrows move, `Space` toggles, `Enter` submits as *sure*,
  `Shift+Enter` submits as *not sure*, then `Enter` continues.

## Checks

```bash
node tests/check.mjs
```

This validates every lesson, question, reference and mission. It loads the full app against a
tiny fake DOM, renders and grades all 165 variants with a correct and a wrong answer, walks
every route, proves that each lab mission fails on a fresh state and passes once solved, and
runs a two-device sign-in scenario against a fake Puter to prove that progress merges and is never lost.
CI runs the same script on every push.

---

Built by **M. Hasan Zafar**. Independent study aid, not affiliated with or endorsed by CyberArk.
The lab screens are simplified simulations modeled on the documented PrivateArk and PVWA
screens. They aren't CyberArk software.
