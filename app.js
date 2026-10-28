// Sheet Manager Administration Portal Logic (Hybrid: GitHub Pages + Node Backend)
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const kpiEmployees = document.getElementById('kpiEmployees');
  const kpiTotalLoan = document.getElementById('kpiTotalLoan');
  const kpiCycle = document.getElementById('kpiCycle');
  const kpiTotalShares = document.getElementById('kpiTotalShares');
  const kpiTotalCtd = document.getElementById('kpiTotalCtd');
  const kpiFileName = document.getElementById('kpiFileName');
  const kpiFileSize = document.getElementById('kpiFileSize');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const browseFileBtn = document.getElementById('browseFileBtn');
  const filePreviewBanner = document.getElementById('filePreviewBanner');
  const previewFileName = document.getElementById('previewFileName');
  const previewFileMeta = document.getElementById('previewFileMeta');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  const exportPreviewBtn = document.getElementById('exportPreviewBtn');
  const confirmSyncBtn = document.getElementById('confirmSyncBtn');
  const syncBanner = document.getElementById('syncBanner');
  const syncStatusTitle = document.getElementById('syncStatusTitle');
  const syncStatusDesc = document.getElementById('syncStatusDesc');

  const tableTitle = document.getElementById('tableTitle');
  const tableSubtitle = document.getElementById('tableSubtitle');
  const modeBadge = document.getElementById('modeBadge');
  const searchInput = document.getElementById('searchInput');
  const tableBody = document.getElementById('tableBody');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportTableBtn = document.getElementById('exportTableBtn');
  const downloadCurrentSheetNavBtn = document.getElementById('downloadCurrentSheetNavBtn');
  const downloadActiveSheetBtn = document.getElementById('downloadActiveSheetBtn');
  const syncActiveBtn = document.getElementById('syncActiveBtn');
  const clearDbBtn = document.getElementById('clearDbBtn');

  // App Details & Force Update Elements
  const cfgAppVersion = document.getElementById('cfgAppVersion');
  const cfgVersionCode = document.getElementById('cfgVersionCode');
  const cfgForceUpdate = document.getElementById('cfgForceUpdate');
  const cfgApkLink = document.getElementById('cfgApkLink');
  const cfgReleaseNotes = document.getElementById('cfgReleaseNotes');
  const saveAppDetailsBtn = document.getElementById('saveAppDetailsBtn');
  const forceUpdateStatusBadge = document.getElementById('forceUpdateStatusBadge');

  // Settings Modal Elements
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const settingApiUrl = document.getElementById('settingApiUrl');
  const settingAdminKey = document.getElementById('settingAdminKey');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const testConnectionBtn = document.getElementById('testConnectionBtn');
  const pingResultText = document.getElementById('pingResultText');
  const dbStatusPill = document.getElementById('dbStatusPill');
  const dbStatusText = document.getElementById('dbStatusText');
  const dbStatusDot = document.getElementById('dbStatusDot');

  // Firebase Config for Direct Static Client
  const firebaseConfig = {
    apiKey: "AIzaSyDKwjQmmS0YcX92JSFpqUQvwIjdSKaevy4",
    authDomain: "loan-management-9f8e2.firebaseapp.com",
    projectId: "loan-management-9f8e2",
    storageBucket: "loan-management-9f8e2.firebasestorage.app",
    messagingSenderId: "1029054112905",
    appId: "1:1029054112905:web:a633563164377244231258"
  };

  let firestoreDb = null;
  try {
    if (window.firebase && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      firestoreDb = firebase.firestore();
      console.log('✓ Firebase Client Initialized (Direct Browser Mode)');
    } else if (window.firebase) {
      firestoreDb = firebase.firestore();
    }
  } catch (fbErr) {
    console.warn('Firebase client init note:', fbErr.message);
  }

  // State
  let activeEmployees = [];
  let previewEmployees = null;
  let stagedFile = null;
  let stagedFileRawData = null;
  let isBackendOnline = false;

  // ----------------------------------------------------
  // Backend & Auth Configuration Helpers
  // ----------------------------------------------------
  function getDefaultApiBase() {
    if (window.location.hostname.endsWith('github.io')) {
      return localStorage.getItem('kptcl_backend_url') || 'https://loan-management-9f8e2.web.app';
    }
    return localStorage.getItem('kptcl_backend_url') || '';
  }

  function getApiBase() {
    let base = localStorage.getItem('kptcl_backend_url');
    if (base === null) {
      base = getDefaultApiBase();
    }
    return base.replace(/\/+$/, '');
  }

  function getAdminToken() {
    return localStorage.getItem('kptcl_admin_key') || sessionStorage.getItem('hescom_admin_token') || 'Hescom@Admin2026!';
  }

  function buildUrl(endpoint) {
    const base = getApiBase();
    if (!base) return endpoint;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    return `${base}${cleanEndpoint}`;
  }

  async function authFetch(endpoint, options = {}) {
    const url = buildUrl(endpoint);
    const token = getAdminToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('X-Admin-Key', token);
    }
    const opts = { ...options, headers };
    let res = await fetch(url, opts);

    if (res.status === 401) {
      const userKey = prompt('🔒 Admin Authorization Required\nPlease enter Admin Key (Default: Hescom@Admin2026!):');
      if (userKey && userKey.trim()) {
        localStorage.setItem('kptcl_admin_key', userKey.trim());
        sessionStorage.setItem('hescom_admin_token', userKey.trim());
        headers.set('Authorization', `Bearer ${userKey.trim()}`);
        res = await fetch(url, { ...options, headers });
      }
    }
    return res;
  }

  // Format currency helper
  function formatINR(val) {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN');
  }

  // Toast Notification
  function showToast(msg, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-banner toast-${type}`;
    toast.style.pointerEvents = 'auto';
    toast.innerHTML = `
      <span>${escapeHtml(msg)}</span>
      <button onclick="this.parentElement.remove()" style="background:none; border:none; color:inherit; cursor:pointer; font-weight:700; margin-left:12px; font-size:16px;">&times;</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Render Cell helper
  function renderAmountCell(val, customColor = '') {
    const num = Number(val) || 0;
    if (num <= 0) {
      return `<span class="badge-inactive" title="Nil balance (₹0)">INACTIVE</span>`;
    }
    const colorStyle = customColor ? ` style="color: ${customColor}; font-weight: 700;"` : '';
    return `<span${colorStyle}>${formatINR(num)}</span>`;
  }

  // Render Table
  function renderTable(list) {
    if (!list || !list.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="15" class="loading-td">No matching employee records found.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map((emp) => `
      <tr>
        <td style="font-weight: 700; color: #64748B;">${emp.slNo || '—'}</td>
        <td class="emp-name-cell">${escapeHtml(emp.employeeName)}</td>
        <td>${escapeHtml(emp.designation || 'Staff')}</td>
        <td>${escapeHtml(emp.office || 'Haveri')}</td>
        <td><span class="loan-id-tag">#${escapeHtml(emp.loanId)}</span></td>
        <td><span class="phone-tag">${escapeHtml(emp.mobile)}</span></td>
        <td class="num-col">${renderAmountCell(emp.longLoan)}</td>
        <td class="num-col">${renderAmountCell(emp.shortLoan, '#0284C7')}</td>
        <td class="num-col">${renderAmountCell(emp.medicalLoan, '#059669')}</td>
        <td class="num-col total-col">${renderAmountCell(emp.totalLoan, '#8B1D1D')}</td>
        <td class="num-col">${renderAmountCell(emp.shareAmount, '#7E22CE')}</td>
        <td class="num-col">${renderAmountCell(emp.longTermCtd, '#0891B2')}</td>
        <td class="num-col">${renderAmountCell(emp.shortTermCtd, '#0891B2')}</td>
        <td class="num-col total-col">${renderAmountCell(emp.totalCtd || ((emp.longTermCtd||0) + (emp.shortTermCtd||0)), '#0E7490')}</td>
        <td><span class="badge-tag">${(emp.month || 'OCT').toUpperCase()} ${emp.year || 2026}</span></td>
      </tr>
    `).join('');
  }

  // Filter Table
  function applyFilter() {
    const query = searchInput.value.trim().toLowerCase();
    const sourceList = previewEmployees || activeEmployees;

    if (!query) {
      renderTable(sourceList);
      return;
    }

    const filtered = sourceList.filter(e =>
      (e.employeeName && e.employeeName.toLowerCase().includes(query)) ||
      (e.loanId && String(e.loanId).includes(query)) ||
      (e.mobile && String(e.mobile).includes(query)) ||
      (e.office && e.office.toLowerCase().includes(query)) ||
      (e.designation && e.designation.toLowerCase().includes(query))
    );

    renderTable(filtered);
  }

  // Client-Side Excel Export using SheetJS
  function exportRowsToExcel(employeeList, fileName = 'KPTCL_Loan_Ledger.xlsx') {
    if (!window.XLSX) {
      showToast('SheetJS library is loading, please wait...', 'error');
      return;
    }
    if (!employeeList || !employeeList.length) {
      showToast('No employee records available to export.', 'error');
      return;
    }

    const excelData = employeeList.map((emp, idx) => ({
      'SLNO': emp.slNo || (idx + 1),
      'EMPLOYEE NAME': emp.employeeName || '',
      'DIGN': emp.designation || '',
      'OFFICE': emp.office || '',
      'LOAN ID': emp.loanId || '',
      'Mobile': emp.mobile || '',
      'Long loan': emp.longLoan || 0,
      'Short loan': emp.shortLoan || 0,
      'Medical loan': emp.medicalLoan || 0,
      'Total loan': emp.totalLoan || 0,
      'share amout': emp.shareAmount || 0,
      'long term ctd': emp.longTermCtd || 0,
      'short term ctd': emp.shortTermCtd || 0,
      'Total CTD': emp.totalCtd || 0,
      'Month': (emp.month || 'OCT').toUpperCase(),
      'Year': emp.year || 2026
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Loan Ledger');
    XLSX.writeFile(wb, fileName);
    showToast(`✓ Exported ${employeeList.length} records to "${fileName}"`, 'success');
  }

  // Client-Side Excel Workbook Parser
  function parseWorkbookClient(arrayBuffer) {
    if (!window.XLSX) {
      throw new Error('SheetJS library is not ready.');
    }
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const rows = rawRows.map((r, i) => {
      const slNo = Number(r.SLNO) || (i + 1);
      const employeeName = String(r['EMPLOYEE NAME'] || r.EmployeeName || r.Name || '').trim();
      const designation = String(r['DIGN'] || r.Designation || '').trim();
      const office = String(r['OFFICE'] || r.Office || '').trim();
      const loanId = String(r['LOAN ID'] || r.LoanId || '').trim();
      const mobile = String(r.Mobile || r.PhoneNumber || '').replace(/\D/g, '');
      const longLoan = Number(r['Long loan'] || r.LongLoan) || 0;
      const shortLoan = Number(r['Short loan'] || r.ShortLoan) || 0;
      const medicalLoan = Number(r['Medical loan'] || r.MedicalLoan) || 0;
      const totalLoan = longLoan + shortLoan + medicalLoan;

      const shareAmount = Number(r['share amout'] || r['share amount'] || r.ShareAmount || r['Share amount'] || r['SHARE AMOUNT']) || 0;
      const longTermCtd = Number(r['long term ctd'] || r['Long term ctd'] || r.LongTermCtd || r['LONG TERM CTD']) || 0;
      const shortTermCtd = Number(r['short term ctd'] || r['Short term ctd'] || r.ShortTermCtd || r['SHORT TERM CTD']) || 0;
      const totalCtd = longTermCtd + shortTermCtd;
      const totalShareAndCtd = shareAmount + totalCtd;

      const month = String(r.Month || 'oct').toLowerCase();
      const year = Number(r.Year) || 2026;

      return {
        slNo,
        employeeName,
        designation,
        office,
        loanId,
        mobile,
        longLoan,
        shortLoan,
        medicalLoan,
        totalLoan,
        shareAmount,
        longTermCtd,
        shortTermCtd,
        totalCtd,
        totalShareAndCtd,
        month,
        year
      };
    });

    return {
      sheetNames: wb.SheetNames,
      activeSheet: sheetName,
      totalRecords: rows.length,
      rows
    };
  }

  // Update Status Pill
  function updateStatusPill(status, msg, color) {
    if (dbStatusText) dbStatusText.textContent = msg;
    if (dbStatusDot) dbStatusDot.style.background = color;
  }

  // Load Current Active Data
  async function loadCurrentData() {
    tableBody.innerHTML = `
      <tr>
        <td colspan="15" class="loading-td">
          <div class="spinner-sm"></div> Fetching active ledger records...
        </td>
      </tr>
    `;

    // Try backend API first
    let loadedFromApi = false;
    try {
      const res = await authFetch('/api/current');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.employees) {
          loadedFromApi = true;
          isBackendOnline = true;
          updateStatusPill('online', 'API Live (Connected)', '#10B981');
          applyDataPayload(data);
          return;
        }
      }
    } catch (apiErr) {
      // Backend not running or unreachable
      console.log('Backend not reachable, checking static data...', apiErr.message);
    }

    // Fallback: load bundled static active_ledger.json
    try {
      const staticRes = await fetch('active_ledger.json');
      if (staticRes.ok) {
        const data = await staticRes.json();
        if (data.success && data.employees) {
          updateStatusPill('static', 'GitHub Pages (Static Mode)', '#0284C7');
          applyDataPayload(data);
          return;
        }
      }
    } catch (staticErr) {
      console.warn('Static active_ledger.json fetch failed:', staticErr.message);
    }

    // If both failed
    tableBody.innerHTML = `
      <tr>
        <td colspan="15" class="loading-td" style="color: #DC2626;">
          Unable to reach backend API or load static ledger. Drag & drop any .xlsx file to inspect records.
        </td>
      </tr>
    `;
    updateStatusPill('disconnected', 'Offline / Configure API', '#EF4444');
  }

  function applyDataPayload(data) {
    activeEmployees = data.employees || [];
    previewEmployees = null;
    stagedFile = null;

    kpiEmployees.textContent = data.totalEmployees || activeEmployees.length;
    kpiTotalLoan.textContent = formatINR(data.totalPortfolio);
    if (kpiTotalShares) kpiTotalShares.textContent = formatINR(data.totalShares);
    if (kpiTotalCtd) kpiTotalCtd.textContent = formatINR(data.totalCtd);
    kpiFileName.textContent = data.fileName || 'test laon.xlsx';
    kpiFileSize.textContent = data.fileSize ? `Size: ${data.fileSize}` : 'Verified Ledger';

    tableTitle.textContent = 'Current Active Records';
    tableSubtitle.textContent = `Displaying ${data.totalEmployees || activeEmployees.length} employees loaded from verified ledger`;
    modeBadge.textContent = isBackendOnline ? 'Active Database' : 'Static Ledger';
    modeBadge.style.background = isBackendOnline ? 'rgba(139, 29, 29, 0.08)' : '#F0F9FF';
    modeBadge.style.color = isBackendOnline ? '#8B1D1D' : '#0284C7';

    filePreviewBanner.style.display = 'none';
    syncBanner.style.display = 'none';

    renderTable(activeEmployees);
  }

  // Handle Local File Selection & In-Browser Parsing
  async function handleFileSelect(file) {
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showToast('Invalid file format. Please upload an Excel sheet (.xlsx or .xls)', 'error');
      return;
    }

    stagedFile = file;

    tableBody.innerHTML = `
      <tr>
        <td colspan="15" class="loading-td">
          <div class="spinner-sm"></div> In-browser SheetJS analyzing rows and columns...
        </td>
      </tr>
    `;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseWorkbookClient(buffer);

      const totalPortfolio = parsed.rows.reduce((sum, r) => sum + r.totalLoan, 0);
      const totalShares = parsed.rows.reduce((sum, r) => sum + (r.shareAmount || 0), 0);
      const totalCtd = parsed.rows.reduce((sum, r) => sum + (r.totalCtd || 0), 0);

      previewEmployees = parsed.rows;
      stagedFileRawData = {
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        totalEmployees: parsed.totalRecords,
        totalPortfolio,
        totalShares,
        totalCtd,
        employees: parsed.rows
      };

      // Show preview banner
      previewFileName.textContent = file.name;
      previewFileMeta.textContent = `${(file.size / 1024).toFixed(1)} KB • ${parsed.totalRecords} employee records • Total Loan: ${formatINR(totalPortfolio)} • Shares: ${formatINR(totalShares)} • CTD: ${formatINR(totalCtd)}`;
      filePreviewBanner.style.display = 'flex';

      // Switch table to Preview Mode
      tableTitle.textContent = `Preview: ${file.name}`;
      tableSubtitle.textContent = `Reviewing ${parsed.totalRecords} records parsed client-side (Pending Database Sync)`;
      modeBadge.textContent = 'Previewing Sheet';
      modeBadge.style.background = '#FFFBEB';
      modeBadge.style.color = '#B45309';

      renderTable(previewEmployees);
      showToast(`Sheet "${file.name}" parsed (${parsed.totalRecords} records).`, 'info');
      filePreviewBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error('File parsing error:', err);
      showToast('Error parsing file: ' + err.message, 'error');
      loadCurrentData();
    }
  }

  // Confirm Sync to Database
  async function handleConfirmSync() {
    if (!stagedFile) {
      showToast('No file staged for sync.', 'error');
      return;
    }

    const clearOldDataCheckbox = document.getElementById('clearOldDataCheckbox');
    const clearOld = clearOldDataCheckbox ? clearOldDataCheckbox.checked : false;

    // Show Progress Banner
    syncBanner.style.display = 'flex';
    syncStatusTitle.textContent = 'Synchronizing with Database...';
    syncStatusDesc.textContent = isBackendOnline
      ? 'Sending to backend server for Firestore synchronization...'
      : 'Connecting to backend API endpoint...';

    confirmSyncBtn.disabled = true;
    cancelUploadBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append('sheet', stagedFile);
      formData.append('clearOld', clearOld ? 'true' : 'false');

      const res = await authFetch('/api/upload-and-sync', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server rejected synchronization');
      }

      syncStatusTitle.textContent = 'Synchronization Successful!';
      syncStatusDesc.textContent = `${data.message || 'Records committed cleanly to Firestore.'}`;
      showToast(`✓ Synchronized ${data.totalEmployees || previewEmployees.length} employees to Firestore!`, 'success', 5000);

      setTimeout(() => {
        loadCurrentData();
      }, 1500);
    } catch (err) {
      console.warn('Sync failed:', err);
      syncStatusTitle.textContent = 'Backend Connection Required for Sync';
      syncStatusDesc.textContent = `Could not reach ${getApiBase() || 'local server'}. Click "Settings" to configure your backend URL or start the server with: node web/server.js`;
      showToast('Backend offline: ' + err.message + '. Use Settings to configure API.', 'error', 6000);
    } finally {
      confirmSyncBtn.disabled = false;
      cancelUploadBtn.disabled = false;
    }
  }

  // App Details & Force Update Management
  async function loadAppDetails() {
    // 1. Try Firebase client SDK directly
    if (firestoreDb) {
      try {
        const docSnap = await firestoreDb.collection('app_details').doc('release').get();
        if (docSnap.exists) {
          const d = docSnap.data();
          applyAppDetails(d);
          return;
        }
      } catch (fbErr) {
        console.log('Client SDK get app_details note:', fbErr.message);
      }
    }

    // 2. Try Backend API
    try {
      const res = await authFetch('/api/app-details');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          applyAppDetails(json.data);
          return;
        }
      }
    } catch (err) {}

    // Default Fallback
    applyAppDetails({
      latestVersion: '1.0.3',
      versionCode: 4,
      isForceUpdate: false,
      apkLink: 'loan-kptcl-release.apk',
      releaseNotes: ['Enhanced client-side Excel parsing', 'Salted password security & offline ledger view']
    });
  }

  function applyAppDetails(d) {
    if (cfgAppVersion) cfgAppVersion.value = d.latestVersion || '1.0.3';
    if (cfgVersionCode) cfgVersionCode.value = d.versionCode || 4;
    if (cfgForceUpdate) cfgForceUpdate.checked = Boolean(d.isForceUpdate);
    if (cfgApkLink) cfgApkLink.value = d.apkLink || 'loan-kptcl-release.apk';
    if (cfgReleaseNotes) {
      cfgReleaseNotes.value = Array.isArray(d.releaseNotes)
        ? d.releaseNotes.map(n => '• ' + n).join('\n')
        : String(d.releaseNotes || '');
    }

    if (forceUpdateStatusBadge) {
      if (d.isForceUpdate) {
        forceUpdateStatusBadge.textContent = 'FORCE UPDATE ACTIVE';
        forceUpdateStatusBadge.style.background = '#FEE2E2';
        forceUpdateStatusBadge.style.color = '#8B1D1D';
      } else {
        forceUpdateStatusBadge.textContent = 'OPTIONAL UPDATE';
        forceUpdateStatusBadge.style.background = '#F1F5F9';
        forceUpdateStatusBadge.style.color = '#64748B';
      }
    }
  }

  if (saveAppDetailsBtn) {
    saveAppDetailsBtn.addEventListener('click', async () => {
      const originalText = saveAppDetailsBtn.innerHTML;
      saveAppDetailsBtn.disabled = true;
      saveAppDetailsBtn.innerHTML = '<div class="spinner-sm" style="display:inline-block; border-color:white; border-top-color:transparent; margin-right:6px;"></div> Saving...';

      const payload = {
        latestVersion: cfgAppVersion.value.trim(),
        versionCode: Number(cfgVersionCode.value) || 4,
        isForceUpdate: cfgForceUpdate.checked,
        apkLink: cfgApkLink.value.trim(),
        releaseNotes: cfgReleaseNotes.value
      };

      try {
        const res = await authFetch('/api/app-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to update app details');
        }
        showToast(`🚀 Force Update settings saved to Firebase! (v${payload.latestVersion}, Build: ${payload.versionCode})`, 'success', 5000);
        loadAppDetails();
      } catch (err) {
        console.error(err);
        showToast('Failed to save app details: ' + err.message + ' (Check backend or API settings)', 'error');
      } finally {
        saveAppDetailsBtn.disabled = false;
        saveAppDetailsBtn.innerHTML = originalText;
      }
    });
  }

  // Realtime Server-Sent Events (SSE) Stream
  function initRealtimeStream() {
    try {
      const streamUrl = buildUrl(`/api/stream?adminKey=${encodeURIComponent(getAdminToken())}`);
      const evtSource = new EventSource(streamUrl);

      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'REALTIME_UPDATE') {
            isBackendOnline = true;
            updateStatusPill('online', `Realtime: ${data.totalEmployees} Users Live`, '#10B981');
            if (!previewEmployees) {
              activeEmployees = data.employees || [];
              kpiEmployees.textContent = data.totalEmployees;
              kpiTotalLoan.textContent = formatINR(data.totalPortfolio);
              if (kpiTotalShares) kpiTotalShares.textContent = formatINR(data.totalShares);
              if (kpiTotalCtd) kpiTotalCtd.textContent = formatINR(data.totalCtd);
              renderTable(activeEmployees);
            }
          }
        } catch (parseErr) {}
      };

      evtSource.onerror = () => {
        if (isBackendOnline) {
          updateStatusPill('offline', 'Reconnecting API...', '#F59E0B');
        }
      };

      evtSource.onopen = () => {
        isBackendOnline = true;
        updateStatusPill('online', 'Realtime Connected', '#10B981');
      };
    } catch (streamErr) {}
  }

  // Drag & Drop Listeners
  if (dropzone) {
    dropzone.addEventListener('click', (e) => {
      if (e.target !== browseFileBtn && !browseFileBtn.contains(e.target)) {
        fileInput.click();
      }
    });
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  if (browseFileBtn) {
    browseFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  if (cancelUploadBtn) {
    cancelUploadBtn.addEventListener('click', () => {
      fileInput.value = '';
      loadCurrentData();
      showToast('Upload discarded. Displaying active ledger records.', 'info');
    });
  }

  if (exportPreviewBtn) {
    exportPreviewBtn.addEventListener('click', () => {
      if (previewEmployees) {
        exportRowsToExcel(previewEmployees, `KPTCL_Preview_${Date.now()}.xlsx`);
      }
    });
  }

  if (confirmSyncBtn) {
    confirmSyncBtn.addEventListener('click', handleConfirmSync);
  }

  // Export visible / filtered table
  if (exportTableBtn) {
    exportTableBtn.addEventListener('click', () => {
      const query = searchInput.value.trim().toLowerCase();
      const currentList = previewEmployees || activeEmployees;
      const listToExport = query
        ? currentList.filter(e =>
            (e.employeeName && e.employeeName.toLowerCase().includes(query)) ||
            (e.loanId && String(e.loanId).includes(query)) ||
            (e.mobile && String(e.mobile).includes(query)) ||
            (e.office && e.office.toLowerCase().includes(query)) ||
            (e.designation && e.designation.toLowerCase().includes(query))
          )
        : currentList;

      exportRowsToExcel(listToExport, `KPTCL_Loan_Ledger_${(new Date()).toISOString().slice(0, 10)}.xlsx`);
    });
  }

  // Download active sheet button
  const triggerActiveSheetDownload = () => {
    if (activeEmployees && activeEmployees.length) {
      exportRowsToExcel(activeEmployees, 'test laon.xlsx');
    } else {
      window.location.href = 'test laon.xlsx';
    }
  };

  if (downloadCurrentSheetNavBtn) {
    downloadCurrentSheetNavBtn.addEventListener('click', triggerActiveSheetDownload);
  }
  if (downloadActiveSheetBtn) {
    downloadActiveSheetBtn.addEventListener('click', triggerActiveSheetDownload);
  }

  // Settings Modal Handlers
  function openSettings() {
    settingApiUrl.value = getApiBase();
    settingAdminKey.value = getAdminToken();
    pingResultText.textContent = 'Ping status: Untested';
    settingsModal.style.display = 'flex';
  }

  function closeSettings() {
    settingsModal.style.display = 'none';
  }

  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (dbStatusPill) dbStatusPill.addEventListener('click', openSettings);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);

  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettings();
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const url = settingApiUrl.value.trim();
      const key = settingAdminKey.value.trim();
      localStorage.setItem('kptcl_backend_url', url);
      if (key) {
        localStorage.setItem('kptcl_admin_key', key);
        sessionStorage.setItem('hescom_admin_token', key);
      }
      showToast('Settings saved. Refreshing connection...', 'success');
      closeSettings();
      loadCurrentData();
    });
  }

  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', async () => {
      const originalText = testConnectionBtn.textContent;
      testConnectionBtn.textContent = 'Testing...';
      testConnectionBtn.disabled = true;
      pingResultText.textContent = 'Sending ping to endpoint...';

      const startTime = performance.now();
      try {
        const testBase = settingApiUrl.value.trim().replace(/\/+$/, '');
        const targetUrl = testBase ? `${testBase}/api/current` : '/api/current';
        const key = settingAdminKey.value.trim() || 'Hescom@Admin2026!';

        const res = await fetch(targetUrl, {
          headers: {
            'Authorization': `Bearer ${key}`,
            'X-Admin-Key': key
          }
        });

        const elapsed = Math.round(performance.now() - startTime);
        if (res.ok) {
          pingResultText.innerHTML = `<span style="color:#059669; font-weight:700;">✓ Connected! (${elapsed}ms) - Status ${res.status}</span>`;
        } else {
          pingResultText.innerHTML = `<span style="color:#D97706; font-weight:700;">⚠ Server responded with status ${res.status} (${elapsed}ms)</span>`;
        }
      } catch (err) {
        pingResultText.innerHTML = `<span style="color:#DC2626; font-weight:700;">✕ Connection failed: ${err.message}</span>`;
      } finally {
        testConnectionBtn.textContent = originalText;
        testConnectionBtn.disabled = false;
      }
    });
  }

  // Clear DB & Resync Handler
  if (clearDbBtn) {
    clearDbBtn.addEventListener('click', async () => {
      const confirmAction = confirm(
        '⚠️ Are you sure you want to COMPLETELY CLEAR the old Firestore database and re-sync clean records?\n\nThis will purge old test data and rebuild users and loans cleanly.'
      );
      if (!confirmAction) return;

      const originalText = clearDbBtn.innerHTML;
      clearDbBtn.disabled = true;
      clearDbBtn.innerHTML = '<div class="spinner-sm" style="display:inline-block; border-color:#DC2626; border-top-color:transparent; margin-right:6px;"></div> Clearing...';

      try {
        const res = await authFetch('/api/clear-and-sync', { method: 'POST' });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Clear database failed');
        }
        showToast(`🔥 Old database purged (${data.clearedUsers} users removed) and re-synced freshly!`, 'success', 5000);
        loadCurrentData();
      } catch (err) {
        console.error(err);
        showToast('Clear DB failed: ' + err.message, 'error');
      } finally {
        clearDbBtn.disabled = false;
        clearDbBtn.innerHTML = originalText;
      }
    });
  }

  // Sync Active Button
  if (syncActiveBtn) {
    syncActiveBtn.addEventListener('click', async () => {
      const originalText = syncActiveBtn.innerHTML;
      syncActiveBtn.disabled = true;
      syncActiveBtn.innerHTML = '<div class="spinner-sm" style="display:inline-block; border-color:white; border-top-color:transparent; margin-right:6px;"></div> Syncing...';

      try {
        const res = await authFetch('/api/sync-active', { method: 'POST' });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Sync active sheet failed');
        }
        showToast(`🎉 Active Sheet Synchronized! (${data.totalEmployees} employees refreshed in Firestore)`, 'success');
        loadCurrentData();
      } catch (err) {
        console.error(err);
        showToast('Active sync failed: ' + err.message, 'error');
      } finally {
        syncActiveBtn.disabled = false;
        syncActiveBtn.innerHTML = originalText;
      }
    });
  }

  // Search filter
  searchInput.addEventListener('input', applyFilter);

  // Refresh button
  refreshBtn.addEventListener('click', () => {
    loadCurrentData();
    showToast('Refreshed active records.', 'info', 2000);
  });

  // Initial load
  loadCurrentData();
  loadAppDetails();
  initRealtimeStream();
});
