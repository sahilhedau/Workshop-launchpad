# 🚀 Workshop Launchpad v2.0

> **Growth Engineering, Referral Attribution & Campaign Pacing Engine**  
> Supporting NxtWave's Campaign: **“Build Your First AI Project in 60 Minutes”**  
> **Target:** 500 Registrations in 7 Days · **Budget:** ₹2,000 · **Target CAC:** ₹4.00  
> **Candidate:** Growth Intern Role at NxtWave

---

## 📌 Executive Summary

**Workshop Launchpad** is a purpose-built growth management platform designed to execute, measure, and optimize NxtWave's acquisition campaign for the free workshop *“Build Your First AI Project in 60 Minutes”*.

Instead of relying on scattered spreadsheets and disconnected forms, Workshop Launchpad provides a unified interface connecting:
1. **Link Studio:** Generates collision-resistant referral codes, UTM-tagged URLs, and multi-angle WhatsApp messaging templates.
2. **Registration Demo Gateway:** An end-to-end simulated student lead capture experience that records attribution, tracks clicks, and triggers an instant viral referral loop.
3. **Live Dashboard & Pacing Engine:** Real-time actual vs. target pacing curves, daily ingestion volume bars, channel attribution splits, a referral leaderboard, and automatic contingency trigger alerts.
4. **Funnel Hypothesis Model & Simulator:** Live sensitivity calculator modeling Wave 1 direct acquisition, Wave 2 viral amplification ($K = 0.30$), and a conditional ₹800 paid reserve activator.

---

## ⚡ Quick Start Guide

Workshop Launchpad is engineered with **dual-mode architecture**: it runs as a lightweight, zero-dependency Node.js HTTP server with atomic file persistence, and can also run 100% client-side if `index.html` is opened directly in a browser.

### Option 1: Live Server with REST API & Persistence (Recommended)

Requires Node.js (v18+). Zero external npm installations required.

```bash
# 1. Clone or navigate to the project workspace
cd "c:/Users/sahil/Downloads/Nxt wave/project next wave"

# 2. Start the local server
npm start
# or: node server.js

# 3. Open your browser
# Dashboard:   http://localhost:3000/
# Student Reg: http://localhost:3000/register.html?ref=ADI-7KQ&src=wa
```

### Option 2: Standalone Browser Mode (Zero Setup)

Double-click `index.html` in your file explorer or open it directly in Google Chrome, Microsoft Edge, or Safari:
```
file:///c:/Users/sahil/Downloads/Nxt wave/project next wave/index.html
```
The application will automatically detect standalone mode and use `localStorage` with built-in seed demo data.

---

## 🌐 Public Demo (GitHub Pages)

The static demo is deployed at **https://sahilhedau.github.io/Workshop-launchpad/**. It runs in the browser and does not use a hosted backend: dashboard changes stay in that browser, and the registration page is a preview only. It does not reserve seats or submit registration details. Use fictional sample information.

The Node.js API and file persistence require running the server separately; GitHub Pages cannot host the Node.js backend.

---

## 🧪 Running Automated Tests

A comprehensive test suite verifies code generation, collision resistance, funnel arithmetic, pacing curves, non-destructive state switching, and attribution synchronization:

```bash
npm test
# or: node tests/run-tests.js
```

### Test Suite Output
```text
🧪 Running Workshop Launchpad Test Suite...

--- 1. Referral Code Generation ---
  ✅ PASS: Format conforms to XXX-YYY with valid random suffix chars
  ✅ PASS: Collision resistance across 2,000 generated codes

--- 2. Funnel Model Calculations ---
  ✅ PASS: Base Case produces exactly 507 registrations (250 + 140 + 117)
  ✅ PASS: Boundary & edge cases: handles 0, negative values, and non-numeric inputs
  ✅ PASS: Contingency Paid Reserve: +50 registrations when ₹800 deployed @ ₹16 CPL

--- 3. Pacing Engine & Trajectory ---
  ✅ PASS: Day 4 at 262 registrations triggers Behind Pace (<90% of 300 target)
  ✅ PASS: Day 4 at 310 registrations evaluates to On Track (>=100% of target)
  ✅ PASS: Non-destructive Day switching: array length does not truncate

--- 4. Attribution Consistency ---
  ✅ PASS: Registration attribution synchronizes links, channels, and daily total
  ✅ PASS: Budget metrics: ₹2,000 for 500 registrations yields ₹4.00 CAC

==========================================
Results: 10 passed, 0 failed
==========================================
🎉 All core calculations, pacing algorithms, and attribution assertions passed!
```

---

## 🎯 Screen-Share Demonstration Flow (Interview Guide)

Follow this 5-minute walkthrough during your interview to demonstrate growth engineering rigor:

```
[1. Open Dashboard]  ──>  [2. Explain Pacing Gap]  ──>  [3. Generate Tracked Link]
        │                         │                               │
        ▼                         ▼                               ▼
[4. Student Form]    ──>  [5. Viral Multiplier]    ──>  [6. Funnel & K-Factor]
```

### Step 1: Open Live Dashboard (`http://localhost:3000/`)
- Point out the campaign goal: **500 registrations in 7 days** with a **₹2,000 budget** (Target CAC: **₹4.00**).
- Show the **Pacing Curve**: Explain that planned milestones follow `[40, 120, 210, 300, 390, 450, 500]`.
- Note that the current demo baseline represents **Day 4 at 262 cumulative registrations** (vs. target of 300).

### Step 2: Highlight the Fallback Contingency Alert
- Show the prominent red contingency banner.
- Explain why it triggered: At Day 4, pacing is at **87.3%** ($262 / 300$), which breaches the **90% threshold (< 270)** defined in Slide 4 of the growth plan.
- Walk through the three pre-committed operational triggers:
  1. *Deploy ₹800 Paid Test Reserve:* Run targeted Meta/Instagram ads to final-year B.Tech students in tier-2/3 colleges (estimated +40–50 sign-ups).
  2. *Recruit 5 Replacement Connectors:* Onboard student connectors from colleges with low current engagement.
  3. *Referral Leaderboard Nudge:* Contact top-3 referrers with spot prize updates (₹300 / ₹200 / ₹100).

### Step 3: Create a Referral Link in Link Studio (Tab 1)
- Enter a campus connector name (e.g. `Aditi Sharma`, College: `VNR VJIET`, Channel: `WhatsApp Connector`).
- Click **Generate Tracked Link**.
- Show the assigned code (e.g. `ADI-7KQ`) and the generated campaign URL with UTM parameters (`?ref=ADI-7KQ&src=wa`).
- Toggle between WhatsApp copy angles:
  - *Angle 1 (Placement Urgency):* "Don't sit for AI interviews with an empty GitHub..."
  - *Angle 2 (Community Pitch):* "Exclusive live build session..."
  - *Angle 3 (Peer Referral):* "I just registered, join with me..."
- Click **Copy WhatsApp Message** and show the instant confirmation toast.

### Step 4: Demonstrate the Student Registration Gateway (Tab 4 or Standalone)
- Click **Test Form Flow** or open `http://localhost:3000/register.html?ref=ADI-7KQ&src=wa`.
- Point out the verified attribution banner: *"Exclusive Campus Invite: Referred by Aditi Sharma (Campus Connector)"*.
- Fill out a sample student registration (e.g., *Pooja Kulkarni, B.Tech CSE Final Year*) and click **Complete Free Registration**.
- Emphasize to the interviewer: *“A link click is not a registration. Here we demonstrate genuine attribution capture upon form submission.”*

### Step 5: Reveal the Viral Loop (Channel C in Action)
- Show the registration confirmation screen.
- Highlight the viral prompt: *"Unlock the 50-Prompt AI Interview Cheatsheet by sharing your personal invite link with 3 classmates"*.
- Point out that this student now has their own personal referral code (`POO-XYZ`), closing the viral amplification loop.

### Step 6: Verify Real-Time Dashboard Attribution
- Return to the Live Dashboard.
- Show that the registration count immediately incremented to **263**, Aditi's code incremented to **53**, the WhatsApp channel increased, and an entry appeared in the **Live Activity Feed**.

### Step 7: Funnel Sensitivity & K-Factor Analysis (Tab 3)
- Switch to the **Funnel Model**.
- Walk through the organic base case:
  - WhatsApp: $5,000 \text{ reach} \times 5\% = \mathbf{250}$
  - Clubs & Communities: $3,500 \text{ reach} \times 4\% = \mathbf{140}$
  - Wave 1 Direct Total: $250 + 140 = \mathbf{390}$
  - Referral Amplification: $390 \times 25\% \text{ share rate} \times 1.2 \text{ sign-ups} = \mathbf{117}$
  - **Total Organic Base Case: 507 registrations (+7 buffer)**
- Highlight the **Viral Coefficient ($K$)**: $K = 0.25 \times 1.2 = \mathbf{0.30}$. Explain why $K = 0.30$ represents realistic viral amplification without false "infinite virality" claims.
- Toggle the **₹800 Paid Test Reserve Activator** to show how deploying contingency capital adds +50 registrations at ₹16 CPL, lifting total projected registrations to **557**.

---

## 📁 Project Structure

```
project next wave/
├── original_backup/                          # Pristine backups of user's original deliverables
│   ├── Growth Plan 500 Registrations in 7 Days.pptx
│   └── Workshop Launchpad_ Referral & Attribution Tracker.html
├── data/
│   └── campaign-store.json                   # Atomic JSON file persistence for backend mode
├── public/                                   # Web application source files
│   ├── index.html                            # Main SaaS application UI
│   ├── register.html                         # Dedicated student registration gateway
│   ├── app.js                                # Reactive client application & chart engine
│   └── style.css                             # Production SaaS design system (Light/Dark)
├── tests/
│   └── run-tests.js                          # Automated test runner (10/10 tests)
├── .env.example                              # Environment configuration template
├── package.json                              # Project metadata & npm run scripts
├── server.js                                 # Zero-dependency Node.js HTTP server & REST API
├── Growth Plan 500 Registrations in 7 Days (Updated).pptx # Updated presentation with notes
├── CHANGELOG_AND_DECISIONS.md                # Comprehensive audit & engineering rationale
└── README.md                                 # Documentation and demonstration guide
```

---

## 🔌 REST API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the main Workshop Launchpad dashboard |
| `GET` | `/register.html` | Serves the student registration gateway |
| `GET` | `/api/health` | Returns service health and uptime |
| `GET` | `/api/state` | Returns full campaign state, links, and pacing data |
| `POST` | `/api/links` | Generates a collision-resistant referral code & tracked link |
| `POST` | `/api/click` | Records a visit/click event on a referral code |
| `POST` | `/api/register` | Records a completed student registration with attribution |
| `POST` | `/api/simulate` | Simulates a registration batch (+1 / +10) for demo |
| `POST` | `/api/day` | Updates the active evaluation day (non-destructive) |
| `POST` | `/api/reset` | Resets state to default or custom scenario presets |
| `GET` | `/api/export` | Downloads campaign data as a formatted CSV |

---

## 🔒 Privacy, Security & Data Minimization

- **Zero Student PII Retention:** Referral codes store only connector names, channels, and colleges. No personal phone numbers or email addresses are stored without explicit registration consent.
- **Data Minimization:** In demo mode, student names in the activity stream are stored with anonymized initials (e.g. *P.K.*) to demonstrate adherence to privacy-by-design principles.
- **No Fabricated Services:** All simulated registrations are clearly watermarked as `DEMO DATA`. Zero external third-party tracking scripts or opaque CDN dependencies.

---

## 💼 Core Growth Values Demonstrated

| Value | How It Is Exemplified in This Project |
| :--- | :--- |
| **Learnability** | Deep-dived into NxtWave's audience dynamics (placement season urgency, tier-2/3 student resumes) and built tailored copy angles. |
| **Ownership** | Audited the existing prototype, identified critical defects (array truncation, missing click tracking), and fixed them without prompting. |
| **Intent to Grow** | Extended a static HTML demo into a dual-mode full-stack product with automated tests, REST APIs, and viral K-factor analytics. |
| **Bias to Ship** | Delivered zero-dependency, immediately runnable code that works right out of the box with `npm start` or double-clicking `index.html`. |
| **Problem-Solving & Judgment** | Grounded all funnel math in realistic assumptions ($K=0.30$, gated connector thank-yous, strict ₹2,000 budget discipline). |
