// ============================================================
// Trackyo Appium Test Runner — 300 Mobile E2E Test Cases
// APK: trackyo.apk (com.trackyo.trackyo)
// Framework: WebdriverIO v8 + Appium 2.x
// ============================================================

const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const { testCases, APP_USER } = require('./test-cases');

// ── Configuration ─────────────────────────────────────────────
const APK_PATH = process.env.APK_PATH || path.resolve(__dirname, '..', 'tracko.apk');
const APPIUM_HOST = process.env.APPIUM_HOST || 'localhost';
const APPIUM_PORT = parseInt(process.env.APPIUM_PORT || '4723', 10);

const CAPABILITIES = {
  platformName: 'Android',
  'appium:deviceName': process.env.DEVICE_NAME || 'emulator-5554',
  'appium:platformVersion': process.env.ANDROID_VERSION || '13',
  'appium:automationName': 'UiAutomator2',
  'appium:app': APK_PATH,
  'appium:appPackage': 'com.trackyo.trackyo',
  'appium:appActivity': '.MainActivity',
  'appium:noReset': false,
  'appium:fullReset': false,
  'appium:newCommandTimeout': 90,
  'appium:autoGrantPermissions': true,
  'appium:chromedriverAutodownload': true,
};

// ── Output Dirs ───────────────────────────────────────────────
const OUTPUT_DIR = path.resolve(__dirname, '..', 'test results', 'Appium');
const EXCEL_DIR  = path.join(OUTPUT_DIR, 'Excel');
const HTML_DIR   = path.join(OUTPUT_DIR, 'HTML');
const SHOTS_DIR  = path.join(OUTPUT_DIR, 'Screenshots');
const LOGS_DIR   = path.join(OUTPUT_DIR, 'Logs');

[OUTPUT_DIR, EXCEL_DIR, HTML_DIR, SHOTS_DIR, LOGS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
const EXCEL_PATH   = path.join(EXCEL_DIR,  `Appium_Test_Report_${now}.xlsx`);
const HTML_PATH    = path.join(HTML_DIR,   `appium-report-${now}.html`);
const LOG_PATH     = path.join(LOGS_DIR,   `appium-run-${now}.log`);
const SUMMARY_PATH = path.join(OUTPUT_DIR, 'summary.md');

// ── Logger ────────────────────────────────────────────────────
const logs = [];
function log(level, msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `[${ts}] [${level}] ${msg}`;
  logs.push({ ts: new Date(), level, msg });
  console.log(line);
}

// ── Main Runner ───────────────────────────────────────────────
async function main() {
  const startTime = new Date();
  const results = [];

  log('INFO', '====================================================');
  log('INFO', 'Trackyo Appium Mobile E2E Test Suite — 300 Cases');
  log('INFO', `APK: ${APK_PATH}`);
  log('INFO', `Appium: ${APPIUM_HOST}:${APPIUM_PORT}`);
  log('INFO', `Test Cases: ${testCases.length}`);
  log('INFO', '====================================================');

  let driver = null;

  try {
    log('INFO', 'Connecting to Appium server...');
    driver = await remote({
      hostname: APPIUM_HOST,
      port: APPIUM_PORT,
      path: '/wd/hub',
      capabilities: CAPABILITIES,
      logLevel: 'warn',
    });
    log('INFO', 'Appium session started successfully!');
    log('INFO', `Session ID: ${driver.sessionId}`);

    // Run all 300 test cases
    for (const tc of testCases) {
      const tStart = Date.now();
      log('INFO', `[${tc.category}] ${tc.id}: ${tc.name}`);

      try {
        // Reset app state before each test
        try { await driver.reset(); } catch {}
        await driver.pause(1000);

        await tc.run(driver);
        const duration = Date.now() - tStart;

        results.push({ ...tc, status: 'PASSED', duration, error: null, screenshot: null });
        log('INFO', `  ✅ PASSED in ${(duration/1000).toFixed(2)}s`);

      } catch (err) {
        const duration = Date.now() - tStart;
        let screenshotPath = null;

        // Capture failure screenshot
        try {
          const shot = await driver.takeScreenshot();
          screenshotPath = path.join(SHOTS_DIR, `${tc.id}_FAILED.png`);
          fs.writeFileSync(screenshotPath, shot, 'base64');
        } catch {}

        results.push({ ...tc, status: 'FAILED', duration, error: err.message || String(err), screenshot: screenshotPath });
        log('ERROR', `  ❌ FAILED: ${err.message || err}`);
      }
    }

  } catch (fatal) {
    log('ERROR', `FATAL: ${fatal.stack || fatal.message || fatal}`);
  } finally {
    if (driver) {
      try { await driver.deleteSession(); } catch {}
      log('INFO', 'Appium session closed.');
    }

    const endTime = new Date();

    // ── Reports ────────────────────────────────────────────────
    log('INFO', 'Generating reports...');

    await generateExcelReport(results, logs, startTime, endTime, EXCEL_PATH);
    generateHtmlReport(results, logs, startTime, endTime, HTML_PATH);
    generateSummary(results, startTime, endTime, SUMMARY_PATH);

    const logText = logs.map(l => `[${l.ts.toISOString().replace('T',' ').slice(0,19)}] [${l.level}] ${l.msg}`).join('\n');
    fs.writeFileSync(LOG_PATH, logText, 'utf8');

    // ── Final Stats ────────────────────────────────────────────
    const passed  = results.filter(r => r.status === 'PASSED').length;
    const failed  = results.filter(r => r.status === 'FAILED').length;
    const total   = results.length;
    const rate    = total > 0 ? ((passed/total)*100).toFixed(1) : '0.0';

    log('INFO', '====================================================');
    log('INFO', `TOTAL:  ${total}`);
    log('INFO', `PASSED: ${passed} ✅`);
    log('INFO', `FAILED: ${failed} ❌`);
    log('INFO', `RATE:   ${rate}%`);
    log('INFO', `EXCEL:  ${EXCEL_PATH}`);
    log('INFO', `HTML:   ${HTML_PATH}`);
    log('INFO', '====================================================');
  }
}

// ── Excel Report ──────────────────────────────────────────────
async function generateExcelReport(results, logs, startTime, endTime, filePath) {
  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Trackyo Appium Runner';
    wb.created = new Date();

    // ── Sheet 1: Summary ──────────────────────────────────────
    const ws1 = wb.addWorksheet('Summary');
    ws1.addRow(['Trackyo Appium Mobile Test Report']);
    ws1.addRow([]);
    ws1.addRow(['Start Time',    startTime.toLocaleString()]);
    ws1.addRow(['End Time',      endTime.toLocaleString()]);
    ws1.addRow(['Duration (s)',  ((endTime-startTime)/1000).toFixed(1)]);
    ws1.addRow([]);
    ws1.addRow(['Total',   results.length]);
    ws1.addRow(['Passed',  results.filter(r=>r.status==='PASSED').length]);
    ws1.addRow(['Failed',  results.filter(r=>r.status==='FAILED').length]);
    ws1.addRow(['Pass %',  results.length > 0 ? `${((results.filter(r=>r.status==='PASSED').length/results.length)*100).toFixed(1)}%` : '0%']);

    // ── Sheet 2: Test Results ─────────────────────────────────
    const ws2 = wb.addWorksheet('Test Results');
    const headers = ['ID','Category','Test Name','Description','Status','Duration (ms)','Error'];
    const headerRow = ws2.addRow(headers);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
    });

    ws2.columns = [
      { key: 'id',       width: 12 },
      { key: 'cat',      width: 20 },
      { key: 'name',     width: 35 },
      { key: 'desc',     width: 40 },
      { key: 'status',   width: 12 },
      { key: 'duration', width: 15 },
      { key: 'error',    width: 50 },
    ];

    results.forEach(r => {
      const row = ws2.addRow([r.id, r.category, r.name, r.description||'', r.status, r.duration, r.error||'']);
      row.getCell(5).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: r.status === 'PASSED' ? 'FF22c55e' : 'FFef4444' }
      };
      row.getCell(5).font = { color: { argb: 'FFFFFFFF' } };
    });

    // ── Sheet 3: Logs ─────────────────────────────────────────
    const ws3 = wb.addWorksheet('Execution Logs');
    ws3.addRow(['Timestamp','Level','Message']);
    logs.forEach(l => ws3.addRow([l.ts.toISOString().replace('T',' ').slice(0,19), l.level, l.msg]));

    await wb.xlsx.writeFile(filePath);
    log('INFO', `Excel report saved: ${filePath}`);
  } catch (err) {
    log('ERROR', `Excel generation failed: ${err.message}`);
  }
}

// ── HTML Report ───────────────────────────────────────────────
function generateHtmlReport(results, logs, startTime, endTime, filePath) {
  const total   = results.length;
  const passed  = results.filter(r=>r.status==='PASSED').length;
  const failed  = results.filter(r=>r.status==='FAILED').length;
  const rate    = total > 0 ? ((passed/total)*100).toFixed(1) : '0.0';
  const dur     = ((endTime-startTime)/1000).toFixed(1);

  const rows = results.map(r => `
    <tr class="${r.status==='PASSED'?'pass':'fail'}">
      <td>${r.id}</td>
      <td>${esc(r.category)}</td>
      <td><strong>${esc(r.name)}</strong></td>
      <td>${r.status}</td>
      <td>${r.duration}ms</td>
      <td>${r.error?`<pre>${esc(r.error.slice(0,200))}</pre>`:''}</td>
      ${r.screenshot?`<td><a href="../Screenshots/${path.basename(r.screenshot)}">📸</a></td>`:'<td>—</td>'}
    </tr>`).join('');

  const logLines = logs.map(l=>
    `<div class="${l.level==='ERROR'?'err':'inf'}">
      <span class="ts">[${l.ts.toISOString().replace('T',' ').slice(0,19)}]</span>
      <span class="lv">[${l.level}]</span>
      <span>${esc(l.msg)}</span>
    </div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Trackyo Appium Report</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:20px}
    .container{max-width:1400px;margin:0 auto}
    h1{color:#38bdf8;margin:0 0 5px}
    .meta{color:#94a3b8;font-size:.9rem;margin-bottom:30px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
    .card{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;text-align:center}
    .card h3{margin:0 0 8px;font-size:.8rem;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8}
    .card .val{font-size:2rem;font-weight:bold}
    .card.p{border-color:#22c55e;color:#4ade80}
    .card.f{border-color:#ef4444;color:#f87171}
    .card.r{border-color:#eab308;color:#facc15}
    table{width:100%;border-collapse:collapse;margin-bottom:32px;font-size:.9rem}
    th,td{border:1px solid #334155;padding:10px;text-align:left;vertical-align:top}
    th{background:#1e293b;color:#38bdf8;font-size:.8rem;text-transform:uppercase}
    tr.pass{background:rgba(34,197,94,.05)}
    tr.fail{background:rgba(239,68,68,.05)}
    pre{margin:0;white-space:pre-wrap;color:#f87171;font-size:.8rem;max-height:80px;overflow:auto}
    .logs{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;max-height:400px;overflow-y:auto;font-family:monospace;font-size:.85rem}
    .ts{color:#64748b}.lv{font-weight:bold;margin:0 5px}.inf{color:#38bdf8;margin-bottom:3px}.err{color:#f87171;margin-bottom:3px}
  </style>
</head>
<body>
<div class="container">
  <h1>📱 Trackyo Appium Mobile Test Report</h1>
  <div class="meta">Started: ${startTime.toLocaleString()} | Ended: ${endTime.toLocaleString()} | Duration: ${dur}s</div>
  <div class="grid">
    <div class="card"><h3>Total</h3><div class="val">${total}</div></div>
    <div class="card p"><h3>Passed</h3><div class="val">${passed}</div></div>
    <div class="card f"><h3>Failed</h3><div class="val">${failed}</div></div>
    <div class="card r"><h3>Pass Rate</h3><div class="val">${rate}%</div></div>
  </div>
  <h2>Test Results</h2>
  <table>
    <thead><tr><th>ID</th><th>Category</th><th>Name</th><th>Status</th><th>Duration</th><th>Error</th><th>Screenshot</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Execution Logs</h2>
  <div class="logs">${logLines}</div>
</div>
</body>
</html>`;

  fs.writeFileSync(filePath, html, 'utf8');
  log('INFO', `HTML report saved: ${filePath}`);
}

// ── Summary Markdown ──────────────────────────────────────────
function generateSummary(results, startTime, endTime, filePath) {
  const total  = results.length;
  const passed = results.filter(r=>r.status==='PASSED').length;
  const failed = results.filter(r=>r.status==='FAILED').length;
  const rate   = total > 0 ? ((passed/total)*100).toFixed(1) : '0.0';

  const failedList = results.filter(r=>r.status==='FAILED')
    .map(r => `- **${r.id}** ${r.name} — ${(r.error||'Unknown').split('\n')[0].slice(0,120)}`)
    .join('\n') || '_None_';

  const content = `# Trackyo Appium Mobile Test Summary

| Metric | Value |
|---|---|
| Total Tests | ${total} |
| Passed | ${passed} |
| Failed | ${failed} |
| Pass Rate | ${rate}% |
| Start | ${startTime.toLocaleString()} |
| End | ${endTime.toLocaleString()} |

## Failed Tests
${failedList}
`;
  fs.writeFileSync(filePath, content, 'utf8');
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
