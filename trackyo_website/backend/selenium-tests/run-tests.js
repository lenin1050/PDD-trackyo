const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { MongoMemoryServer } = require('mongodb-memory-server');

const testCases = require('./test-cases');
const { generateReport } = require('./report-generator');

// Output report directory and path setup
const testResultsDir = path.resolve(__dirname, '..', '..', '..', 'Test Results');
const excelDir = path.join(testResultsDir, 'Excel');
const htmlDir = path.join(testResultsDir, 'HTML');
const screenshotsDir = path.join(testResultsDir, 'Screenshots');
const logsDir = path.join(testResultsDir, 'Logs');
const summaryDir = path.join(testResultsDir, 'Summary');

// Make sure output directories exist
fs.mkdirSync(excelDir, { recursive: true });
fs.mkdirSync(htmlDir, { recursive: true });
fs.mkdirSync(screenshotsDir, { recursive: true });
fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(summaryDir, { recursive: true });

const outputPath = path.join(excelDir, 'Automation_Test_Report.xlsx');
const outputHtmlPath = path.join(htmlDir, 'execution-report.html');
const outputSummaryPath = path.join(summaryDir, 'summary.md');
const outputLogPath = path.join(logsDir, 'execution-log.log');

let mongodServer = null;
let backendProcess = null;
let frontendProcess = null;
let driver = null;

// Helpers to check if endpoints are active
function checkEndpoint(url, timeout = 15000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          clearInterval(interval);
          resolve(true);
        }
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          resolve(false);
        }
      });
    }, 500);
  });
}

// Runs a shell command synchronously as a promise
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { cwd, shell: true });
    process.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${command} exited with code ${code}`));
    });
  });
}

async function main() {
  const startTime = new Date();
  const logs = [];
  const results = [];

  const logMessage = (level, message) => {
    const now = new Date();
    logs.push({ timestamp: now, level, message });
    console.log(`[${now.toISOString().replace('T', ' ').substring(0, 19)}] [${level}] ${message}`);
  };

  logMessage('INFO', 'Starting E2E Test Suite for Trackyo AI Expense Tracker');
  logMessage('INFO', `Seeding database and launching local test environment`);

  try {
    // 1. Launch In-Memory MongoDB Server on 27017
    logMessage('INFO', 'Spinning up virtual MongoDB Memory Server on port 27017...');
    mongodServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'trackyo'
      }
    });
    logMessage('INFO', 'Virtual MongoDB started successfully!');

    // 2. Seed Mock Database Data
    logMessage('INFO', 'Running utils/seedData.js...');
    await runCommand('node', ['utils/seedData.js'], path.join(__dirname, '..'));
    logMessage('INFO', 'Mock database tables successfully seeded!');

    // 3. Start Backend Express Server
    logMessage('INFO', 'Launching Trackyo Backend Server (Port 5000)...');
    backendProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      env: { ...process.env, PORT: 5000, MONGODB_URI: 'mongodb://127.0.0.1:27017/trackyo' }
    });
    
    // Wait for backend to be online
    const backendOnline = await checkEndpoint('http://localhost:5000/');
    if (!backendOnline) {
      throw new Error('Backend failed to start or respond on port 5000 within timeout.');
    }
    logMessage('INFO', 'Backend server is operational!');

    // 4. Start Frontend React/Vite Client
    logMessage('INFO', 'Launching Trackyo Frontend Vite Server (Port 5173)...');
    frontendProcess = spawn('npx', ['vite', '--port', '5173', '--strictPort'], {
      cwd: path.join(__dirname, '..', '..', 'frontend'),
      shell: true
    });

    // Wait for frontend to be online
    const frontendOnline = await checkEndpoint('http://localhost:5173/');
    if (!frontendOnline) {
      throw new Error('Frontend failed to start or respond on port 5173 within timeout.');
    }
    logMessage('INFO', 'Frontend web application is operational!');

    // 5. Initialize Selenium Chrome WebDriver in headless mode
    logMessage('INFO', 'Initializing Selenium Chrome WebDriver (Headless mode)...');
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    await driver.manage().window().setRect({ width: 1280, height: 800 });

    const baseUrl = process.env.BASE_URL || 'http://localhost:5173/';
    logMessage('INFO', `Selenium Chrome session established. Navigating to ${baseUrl}`);
    await driver.get(baseUrl);

    // 6. Run all 105 Test Cases
    const context = {
      isLoggedIn: false,
      newEmail: null,
      newPassword: null
    };

    logMessage('INFO', `Starting test execution of ${testCases.length} E2E cases...`);

    for (const testCase of testCases) {
      const tStart = Date.now();
      logMessage('INFO', `Running test: [${testCase.category}] ${testCase.name}`);
      try {
        await testCase.run(driver, context);
        const tDuration = Date.now() - tStart;
        results.push({
          id: testCase.id,
          category: testCase.category,
          name: testCase.name,
          description: testCase.description,
          status: 'PASSED',
          duration: tDuration,
          error: null
        });
        logMessage('INFO', `[${testCase.category}] ${testCase.name} -> PASSED in ${(tDuration/1000).toFixed(2)}s`);
      } catch (err) {
        const tDuration = Date.now() - tStart;
        results.push({
          id: testCase.id,
          category: testCase.category,
          name: testCase.name,
          description: testCase.description,
          status: 'FAILED',
          duration: tDuration,
          error: err.stack || err.message
        });
        logMessage('ERROR', `[${testCase.category}] ${testCase.name} -> FAILED: ${err.message}`);
        
        // Capture screenshot of failure
        if (driver) {
          try {
            const screenshot = await driver.takeScreenshot();
            const screenshotName = `${testCase.name}_failed.png`;
            const screenshotPath = path.join(screenshotsDir, screenshotName);
            fs.writeFileSync(screenshotPath, screenshot, 'base64');
            logMessage('INFO', `Screenshot captured for failed test: ${screenshotPath}`);
          } catch (screenshotErr) {
            logMessage('ERROR', `Failed to capture screenshot: ${screenshotErr.message}`);
          }
        }
      }
    }

    logMessage('INFO', 'E2E Test Execution finished successfully.');

  } catch (error) {
    logMessage('ERROR', `E2E suite encountered fatal runner error: ${error.stack || error.message}`);
  } finally {
    // 7. Tear down processes and server sessions cleanly
    logMessage('INFO', 'Tearing down test environment...');
    if (driver) {
      try { await driver.quit(); } catch (e) {}
    }
    if (backendProcess) {
      try { backendProcess.kill('SIGINT'); } catch (e) {}
    }
    if (frontendProcess) {
      try { frontendProcess.kill('SIGINT'); } catch (e) {}
    }
    if (mongodServer) {
      try { await mongodServer.stop(); } catch (e) {}
    }
    logMessage('INFO', 'Processes shut down successfully.');

    // 8. Generate reports
    const endTime = new Date();
    logMessage('INFO', 'Generating E2E Reports...');
    
    // Save text log file
    try {
      const logLines = logs.map(l => `[${l.timestamp.toISOString().replace('T', ' ').substring(0, 19)}] [${l.level}] ${l.message}`).join('\n');
      fs.writeFileSync(outputLogPath, logLines, 'utf8');
      logMessage('INFO', `Text execution log saved to: ${outputLogPath}`);
    } catch (logError) {
      console.error('Failed to write log file: ', logError);
    }

    // Generate Excel report
    try {
      await generateReport(results, logs, startTime, endTime, outputPath);
      logMessage('INFO', `E2E Excel report saved to: ${outputPath}`);
    } catch (excelError) {
      console.error('Failed to create Excel report: ', excelError);
    }

    // Generate HTML report
    try {
      generateHtmlReport(results, logs, startTime, endTime, outputHtmlPath);
      logMessage('INFO', `E2E HTML report saved to: ${outputHtmlPath}`);
    } catch (htmlError) {
      console.error('Failed to create HTML report: ', htmlError);
    }

    // Generate Summary markdown
    try {
      generateSummaryMarkdown(results, startTime, endTime, outputSummaryPath);
      logMessage('INFO', `E2E Summary markdown saved to: ${outputSummaryPath}`);
    } catch (summaryError) {
      console.error('Failed to create Summary markdown: ', summaryError);
    }
  }
}

function generateHtmlReport(results, logs, startTime, endTime, outputHtmlPath) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  let testRows = '';
  results.forEach(r => {
    const statusClass = r.status === 'PASSED' ? 'status-passed' : 'status-failed';
    const errHtml = r.error ? `<div class="error-details">${escapeHtml(r.error)}</div>` : '';
    testRows += `
      <tr class="${statusClass}">
        <td>${r.id}</td>
        <td>${escapeHtml(r.category)}</td>
        <td><strong>${escapeHtml(r.name)}</strong></td>
        <td>${r.status}</td>
        <td>${r.duration}ms</td>
        <td>${errHtml}</td>
      </tr>
    `;
  });

  let logRows = '';
  logs.forEach(l => {
    const levelClass = l.level === 'ERROR' ? 'log-error' : 'log-info';
    logRows += `
      <div class="log-item ${levelClass}">
        <span class="log-ts">[${l.timestamp.toISOString().replace('T', ' ').substring(0, 19)}]</span>
        <span class="log-level">[${l.level}]</span>
        <span class="log-msg">${escapeHtml(l.message)}</span>
      </div>
    `;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trackyo Automation Test Execution Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #0f172a;
      color: #e2e8f0;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      border-bottom: 1px solid #334155;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      margin: 0 0 10px 0;
      color: #38bdf8;
    }
    .meta {
      font-size: 0.9rem;
      color: #94a3b8;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .card h3 {
      margin: 0 0 10px 0;
      font-size: 1rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card .val {
      font-size: 2rem;
      font-weight: bold;
    }
    .card.pass { border-color: #22c55e; color: #4ade80; }
    .card.fail { border-color: #ef4444; color: #f87171; }
    .card.rate { border-color: #eab308; color: #facc15; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }
    th, td {
      border: 1px solid #334155;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #1e293b;
      color: #38bdf8;
    }
    tr.status-passed {
      background-color: rgba(34, 197, 94, 0.05);
    }
    tr.status-failed {
      background-color: rgba(239, 68, 68, 0.05);
    }
    .error-details {
      color: #f87171;
      font-family: monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      max-height: 100px;
      overflow-y: auto;
      margin-top: 5px;
    }
    .logs-panel {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 0.9rem;
    }
    .log-item {
      margin-bottom: 5px;
      line-height: 1.4;
    }
    .log-error { color: #f87171; }
    .log-info { color: #38bdf8; }
    .log-ts { color: #64748b; }
    .log-level { font-weight: bold; margin: 0 5px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Trackyo E2E Automation Test Report</h1>
      <div class="meta">
        Run started: ${startTime.toLocaleString()} | Ended: ${endTime.toLocaleString()} | Total Duration: ${duration}s
      </div>
    </header>
    
    <div class="summary-grid">
      <div class="card">
        <h3>Total Tests</h3>
        <div class="val">${total}</div>
      </div>
      <div class="card pass">
        <h3>Passed</h3>
        <div class="val">${passed}</div>
      </div>
      <div class="card fail">
        <h3>Failed</h3>
        <div class="val">${failed}</div>
      </div>
      <div class="card rate">
        <h3>Pass Rate</h3>
        <div class="val">${passRate}%</div>
      </div>
    </div>

    <h2>Test Execution Details</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 50px;">ID</th>
          <th style="width: 200px;">Category</th>
          <th style="width: 300px;">Test Name</th>
          <th style="width: 100px;">Status</th>
          <th style="width: 100px;">Duration</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${testRows}
      </tbody>
    </table>

    <h2>System Logs</h2>
    <div class="logs-panel">
      ${logRows}
    </div>
  </div>
</body>
</html>`;
  fs.writeFileSync(outputHtmlPath, html, 'utf8');
}

function generateSummaryMarkdown(results, startTime, endTime, outputSummaryPath) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
  const baseUrl = process.env.BASE_URL || 'https://lenin1050.github.io/PDD-trackyo/';

  let failedList = '';
  const failedTests = results.filter(r => r.status === 'FAILED');
  if (failedTests.length === 0) {
    failedList = '*None*';
  } else {
    failedTests.forEach(t => {
      failedList += `- **${t.name}** (${t.category})\n  *Reason:* ${t.error ? t.error.split('\n')[0] : 'Unknown error'}\n`;
    });
  }

  const content = `# Live GitHub Pages E2E Test Summary

**Deployment URL:** [${baseUrl}](${baseUrl})

| Metric | Value |
| --- | --- |
| **Total Tests** | ${total} |
| **Passed** | ${passed} |
| **Failed** | ${failed} |
| **Skipped** | ${skipped} |
| **Pass Percentage** | ${passRate}% |

### Failed Tests:
${failedList}
`;
  fs.writeFileSync(outputSummaryPath, content, 'utf8');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

main();
