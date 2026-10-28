# KPTCL Haveri Division • Loan Sheet Administration Desk

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Portal-success?logo=github)](https://operantix.github.io/loan-upload/)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20APK-red)](https://operantix.github.io/loan-upload/loan-kptcl-release.apk)
[![Security](https://img.shields.io/badge/Security-AES%20%2F%20Salted%20SHA--256-blue)](#)

Enterprise web portal for KPTCL / HESCOM Haveri Division to inspect, preview, and synchronize employee loan ledger Excel spreadsheets directly with Google Firebase Firestore and the KPTCL Android mobile application.

🌐 **Live Deployment**: [https://operantix.github.io/loan-upload/](https://operantix.github.io/loan-upload/)

---

## ⚡ Key Features

1. **Client-Side SheetJS Excel Engine**:
   - Parses `.xlsx` and `.xls` workbooks directly in the web browser without transmitting raw spreadsheets to third parties.
   - Computes consolidated loan liability, shares, cumulative time deposits (CTD), and recovery totals in real-time.

2. **Instant Preview & Verification**:
   - Drag-and-drop support with real-time data table rendering.
   - Dynamic search by employee name, loan ID, phone number, and office.
   - Export previewed or filtered datasets directly back to Excel (`.xlsx`).

3. **Hybrid Cloud Synchronization**:
   - **Standalone Static Mode**: Runs 100% in the browser on GitHub Pages with bundled verified ledger data.
   - **Direct Firebase SDK Integration**: Reads live mobile app version details and force update status from Firestore (`loan-management-9f8e2`).
   - **Backend API Sync**: Connects to the local or cloud administrative Node.js server (`Hescom@Admin2026!`) for atomic Firestore batch writes.

4. **Integrated Asset Distribution**:
   - Download compiled Android release build: [`loan-kptcl-release.apk`](loan-kptcl-release.apk)
   - Download comprehensive REST API documentation: [`API_Endpoints_Documentation.xlsx`](API_Endpoints_Documentation.xlsx)
   - Download active Excel ledger: [`test laon.xlsx`](test%20laon.xlsx)

---

## 🚀 GitHub Pages Configuration

1. Go to your repository on GitHub: `https://github.com/Operantix/loan-upload`
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `root`
4. Click **Save**.
5. Your portal will be published at: **`https://operantix.github.io/loan-upload/`**

---

## 🛠 Local Development & Backend Server

To run the full backend server with real-time SSE streams and batch Firestore write capability:

```bash
# Start backend server
node web/server.js
```

The portal connects by default to `http://localhost:3000`. You can also configure a custom cloud server endpoint directly from the **Settings** modal in the web interface.

---

## 🔒 Security Specifications

- **Admin Secret Key**: Protected by Bearer Token (`Hescom@Admin2026!`).
- **Cryptographic Security**: Passwords stored using PBKDF2/Salted SHA-256 in Firestore.
- **Data Protection**: Strict Firestore security rules block unauthorized mass enumeration.
