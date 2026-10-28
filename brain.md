# Comprehensive Project Brain & Progress Documentation (brain.md)
**Project**: KPTCL / HESCOM Haveri Division Loan Ledger & Mobile Application  
**Repository**: [https://github.com/Operantix/loan-upload](https://github.com/Operantix/loan-upload)  
**Live Web Portal**: [https://operantix.github.io/loan-upload/](https://operantix.github.io/loan-upload/)  
**Firebase Cloud Project**: `loan-management-9f8e2`  
**Last Updated**: October 29, 2026, 00:57 IST  

---

## 1. Executive Summary

Over the course of testing, penetration auditing, vulnerability remediation, and deployment, the KPTCL / HESCOM Haveri Division Loan Management platform was transformed from a local prototype vulnerable to database scraping and denial of service into an enterprise-grade, high-concurrency system capable of handling 2,000+ active field staff. 

Key milestones achieved:
1. **Security Vulnerability Remediation (Strix Methodology)**: Resolved catastrophic 8,000,000 read bottleneck, enforced salted SHA-256 password hashing, deployed hardened Cloud Firestore security rules blocking unauthorized enumeration.
2. **REST API Documentation & Decoupling**: Replaced all temporary `localhost:3000` URLs with live Google Cloud Firestore REST API v1 endpoints and cloud production services, documented across 6 tabs in `API_Endpoints_Documentation.xlsx`.
3. **Android Release Package**: Compiled native release APK (`loan-kptcl-release.apk`, v1.0.3, VersionCode: 4) using Hermes bytecode, verified on physical device via ADB USB, and published to GitHub.
4. **Serverless Web Administration Portal**: Built and hosted on GitHub Pages (`https://operantix.github.io/loan-upload/`), featuring client-side SheetJS Excel parsing and direct in-browser Firestore batch commits (`syncDirectToFirestore`) requiring zero backend Node server.

---

## 2. Architecture & System Components

### 2.1 Technology Stack
* **Mobile Frontend**: React Native / Expo SDK 58 (Android package: `com.hescom.loanmangement`, version `1.0.3`, build `4`).
* **Web Administration Portal**: Vanilla HTML5, CSS3 (glassmorphic design system), JavaScript (ES6+), SheetJS (`xlsx@0.18.5`), and Firebase Compat SDK v10.12.0.
* **Database & Cloud Backend**: Google Cloud Firestore (`loan-management-9f8e2`) with multi-regional persistence and atomic document batching.
* **Authentication**: Phone Number + Salted SHA-256 / PBKDF2 hash verification (`KPTCL_HAVERI_LOAN_SALT_2026`), with Loan ID lookup indexing.
* **Hosting**: GitHub Pages via automated GitHub Actions workflow (`.github/workflows/pages.yml`).

---

## 3. Detailed Milestones & Accomplishments

### 3.1 Security & Concurrency Hardening (Strix Methodology)
* **The 8,000,000 Read Bottleneck**:
  * *Original Issue*: Each user login performed full collection queries, meaning 2,000 users attempting login generated up to 8,000,000 read operations, risking severe Firestore billing exhaustion and latency spikes.
  * *Fix*: Implemented indexed, direct $O(1)$ single-document lookups by document ID (phone number: `/users/{phoneNumber}` and `/loan_lookups/{loanId}`). Reduced total reads from $O(N)$ to strictly $O(1)$.
* **Plaintext Password Elimination**:
  * *Original Issue*: Default passwords were stored in plaintext.
  * *Fix*: Implemented salted SHA-256 cryptographic hashing in `src/utils/crypto.js` with salt `KPTCL_HAVERI_LOAN_SALT_2026`. Created safe update rules allowing employees to change their password hash without permitting modification of loan balances or financial figures.
* **Firestore Security Rules**:
  * Deployed ruleset `fc7c0e73-2915-4eb1-8000-5636a18ff94f` via Firebase Rules REST API.
  * Blocked mass enumeration (`allow list: if false;`).
  * Authorized single document gets (`allow get: if true;`) and authenticated portal writes.

### 3.2 Master Excel Documentation Sheet (`API_Endpoints_Documentation.xlsx`)
All endpoints were transitioned from `localhost:3000` to production Google Cloud endpoints and organized into 6 tabs:
1. **`Firebase_Cloud_Endpoints`**: 14 production endpoints hosted on `https://loan-management-9f8e2.web.app` (Cluster health, admin auth, ledger retrieval, file preview, batch sync, SSE stream).
2. **`Firestore_REST_API`**: Direct Google Cloud Firestore v1 REST operations (`/users/{phoneNumber}`, `/loan_lookups/{loanId}`, `/app_details/release`, subcollections, and atomic batch writes).
3. **`Firebase_Auth_API`**: Identity Platform endpoints (`:signInWithPassword`, `:lookup`, `:update`).
4. **`GitHub_Pages_Portal`**: Production CDN download links for the portal, APK, documentation, and ledger templates.
5. **`Auth_Keys_&_Secrets`**: Master key (`Hescom@Admin2026!`), Firebase Web API Key (`AIzaSyDKwjQmmS0YcX92JSFpqUQvwIjdSKaevy4`), Project ID (`loan-management-9f8e2`), and Service Account details.
6. **`Security_&_Rate_Limiting`**: Rate limiter configuration (200 req/min/IP), Firestore security rules, CORS headers, and salted SHA-256 password hashing.

### 3.3 Android Release Build & Distribution
* **Build Configuration**:
  * Version Name: `1.0.3`
  * Version Code: `4`
  * Package: `com.hescom.loanmangement`
  * Signing: Signed release configuration with Hermes optimization.
* **Compilation Details**: Built via Gradle 9.4.1 (`gradlew.bat assembleRelease`) in 8m 7s with 411 tasks verified.
* **Output Package**: `android/app/build/outputs/apk/release/app-release.apk` (30,312,052 bytes).
* **Physical Device Testing**: Deployed and launched on physical Samsung Galaxy device (`RZCXA0T2J1B`) via ADB USB.
* **Remote Version Enforcement**: Configured in Firestore `/app_details/release`:
  * `apkLink`: `https://operantix.github.io/loan-upload/loan-kptcl-release.apk`
  * `githubUrl`: `https://github.com/Operantix/loan-upload`
  * `isForceUpdate`: `false` (smooth entry for version 1.0.3)

### 3.4 Web Administration Portal & GitHub Pages
* **Repository**: [https://github.com/Operantix/loan-upload](https://github.com/Operantix/loan-upload)
* **Live Deployment**: [https://operantix.github.io/loan-upload/](https://operantix.github.io/loan-upload/)
* **Client-Side Capabilities**:
  * **In-Browser SheetJS Engine**: Instant drag-and-drop `.xlsx` parsing computing employee counts, loan principal liability, share capital, and CTD deposits without server roundtrips.
  * **Interactive Preview & Export**: Search, filter, and export datasets directly to formatted `.xlsx` using `XLSX.writeFile`.
  * **Serverless Direct Firestore Sync (`syncDirectToFirestore`)**:
    * Chunks records into atomic Firestore batches of 120 employees (360 ops: user doc + loan lookup doc + monthly slip subcollection, within Firestore's 500 limit).
    * Commits directly from browser to Google Cloud Firestore using Firebase Compat SDK.
    * Real-time progress bar reporting live batch commit status.
    * Eliminates requirement for local Node.js server (`node web/server.js`) during spreadsheet uploads.
  * **Integrated Asset Distribution**: Direct download buttons for APK, API documentation spreadsheet, and template Excel ledgers.

---

## 4. Master Credentials & Configuration Reference

| Key Parameter | Production Value | Usage / Scope |
| :--- | :--- | :--- |
| **Firebase Project ID** | `loan-management-9f8e2` | Google Cloud & Firestore Project |
| **Firebase Web API Key** | `AIzaSyDKwjQmmS0YcX92JSFpqUQvwIjdSKaevy4` | Client SDK & REST API URL parameter |
| **Admin Secret Key** | `Hescom@Admin2026!` | Header: `Authorization: Bearer <KEY>` or `x-admin-key` |
| **Password Salt** | `KPTCL_HAVERI_LOAN_SALT_2026` | SHA-256 hashing in `src/utils/crypto.js` |
| **Service Account Email** | `firebase-adminsdk-fbsvc@loan-management-9f8e2.iam.gserviceaccount.com` | Backend IAM & Google Auth Client |
| **Git User** | `Operantix` | Remote GitHub Repository Owner |

---

## 5. File System & Artifact Inventory

* `brain.md`: This comprehensive historical and architectural reference.
* `API_Endpoints_Documentation.xlsx`: 6-tab production API reference spreadsheet.
* `loan-kptcl-release.apk`: Compiled Android release package (v1.0.3, build 4).
* `firestore.rules`: Active Cloud Firestore security ruleset.
* `src/components/ForceUpdateModal.js`: In-app auto-update and download component.
* `src/utils/crypto.js`: Salted SHA-256 cryptographic utility.
* `scripts/serviceAccountKey.json`: Google Cloud IAM credentials for administrative tools.
* `scripts/deploy_new_rules.js`: Automated rules deployment script via GoogleAuth.
* `scripts/initAppDetails.js`: Remote configuration initializer script.
* `scripts/generateApiEndpointsSheet.js`: Generator for multi-sheet API documentation.
* `web_deploy/`: GitHub Pages deployment directory (synced to `main` branch of `Operantix/loan-upload`).
  * `index.html`: Portal markup with drag-and-drop zone and KPI cards.
  * `style.css`: Glassmorphic stylesheet with responsive breakpoints.
  * `app.js`: In-browser SheetJS parsing and `syncDirectToFirestore` batch engine.
  * `active_ledger.json`: Pre-rendered verified ledger snapshot for instant load.
  * `loan-kptcl-release.apk`: Live downloadable release build.
  * `API_Endpoints_Documentation.xlsx`: Downloadable API reference workbook.
  * `.github/workflows/pages.yml`: Automated GitHub Actions deployment workflow.
  * `.nojekyll`: Bypasses Jekyll processing on GitHub Pages.
