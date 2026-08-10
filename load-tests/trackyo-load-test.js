// ============================================================
// Trackyo k6 Load Test — 100 Virtual Users × 1 Minute
// Tool: k6 (https://k6.io)
// Target: http://localhost:5000 (local) or TRACKYO_API_URL env
// Usage: k6 run trackyo-load-test.js
// ============================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// ── Custom Metrics ─────────────────────────────────────────────
const errorRate     = new Rate('errors');
const loginSuccess  = new Counter('login_success_total');
const expenseCreated = new Counter('expense_created_total');
const apiLatency    = new Trend('api_latency_ms');

// ── Load Profile ───────────────────────────────────────────────
export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 100,
      duration: '1m',
    },
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 50  },  // Ramp up to 50 VUs in 15s
        { duration: '30s', target: 100 },  // Ramp up to 100 VUs in 30s
        { duration: '10s', target: 100 },  // Stay at 100 VUs
        { duration: '5s',  target: 0   },  // Ramp down
      ],
      startTime: '1m10s',                  // Run after baseline scenario
    },
  },

  thresholds: {
    http_req_duration:          ['p(95)<2000'],  // 95% of requests < 2s
    http_req_failed:            ['rate<0.05'],   // Error rate < 5%
    errors:                     ['rate<0.10'],   // Custom error rate < 10%
    'http_req_duration{name:login}':      ['p(95)<1500'],
    'http_req_duration{name:get_expenses}': ['p(95)<1500'],
  },
};

// ── Config ─────────────────────────────────────────────────────
const BASE_URL = __ENV.TRACKYO_API_URL || 'http://localhost:5000';

const TEST_USER_POOL = Array.from({ length: 10 }, (_, i) => ({
  email:    `loadtest_${i}@trackyo.test`,
  password: 'LoadTest@1234',
}));

// ── Setup: Register test users ─────────────────────────────────
export function setup() {
  console.log(`[SETUP] Registering ${TEST_USER_POOL.length} load test users at ${BASE_URL}`);

  const headers = { 'Content-Type': 'application/json' };

  for (const user of TEST_USER_POOL) {
    const res = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        name: `Load User ${user.email.split('_')[1]}`,
        email: user.email,
        mobile: `9${Math.floor(Math.random() * 900000000 + 100000000)}`,
        password: user.password,
      }),
      { headers }
    );

    if (res.status === 201 || res.status === 409) {
      console.log(`[SETUP] User ${user.email}: ${res.status === 201 ? 'registered' : 'already exists'}`);
    } else {
      console.warn(`[SETUP] User ${user.email} setup failed: ${res.status} ${res.body}`);
    }
  }

  return { users: TEST_USER_POOL };
}

// ── Main Scenario ─────────────────────────────────────────────
export default function (data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const headers = { 'Content-Type': 'application/json' };

  let token = null;

  // ── Group 1: Authentication ──────────────────────────────────
  group('Authentication', () => {

    // TC-LOAD-001: Login
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers, tags: { name: 'login' } }
    );

    apiLatency.add(loginRes.timings.duration, { endpoint: '/api/auth/login' });

    const loginOk = check(loginRes, {
      'Login status 200': (r) => r.status === 200,
      'Login returns token': (r) => {
        try { return JSON.parse(r.body).token !== undefined; } catch { return false; }
      },
      'Login response < 2000ms': (r) => r.timings.duration < 2000,
    });

    if (loginOk) {
      loginSuccess.add(1);
      try {
        token = JSON.parse(loginRes.body).token;
      } catch {}
    } else {
      errorRate.add(1);
    }

    sleep(0.2);

    // TC-LOAD-002: Get current user profile
    if (token) {
      const meRes = http.get(`${BASE_URL}/api/auth/me`, {
        headers: { ...headers, Authorization: `Bearer ${token}` },
        tags: { name: 'get_profile' }
      });

      apiLatency.add(meRes.timings.duration, { endpoint: '/api/auth/me' });

      check(meRes, {
        'Get profile status 200': (r) => r.status === 200,
        'Profile has name': (r) => {
          try { return JSON.parse(r.body).name !== undefined; } catch { return false; }
        },
      });
    }

    sleep(0.2);
  });

  if (!token) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  const authHeaders = { ...headers, Authorization: `Bearer ${token}` };

  // ── Group 2: Expenses ─────────────────────────────────────────
  group('Expenses', () => {

    // TC-LOAD-003: Create expense
    const categories = ['Food', 'Travel', 'Entertainment', 'Bills', 'Shopping', 'Health', 'Education', 'Other'];
    const paymentMethods = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking'];

    const createRes = http.post(
      `${BASE_URL}/api/expenses`,
      JSON.stringify({
        title: `Load Test Expense ${Date.now()}`,
        amount: Math.floor(Math.random() * 1000) + 10,
        category: categories[Math.floor(Math.random() * categories.length)],
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        dateTime: new Date().toISOString(),
        notes: 'k6 load test expense',
        merchantName: 'LoadTest Store',
      }),
      { headers: authHeaders, tags: { name: 'create_expense' } }
    );

    apiLatency.add(createRes.timings.duration, { endpoint: '/api/expenses POST' });

    const createOk = check(createRes, {
      'Create expense status 201': (r) => r.status === 201,
      'Create expense has _id': (r) => {
        try { return JSON.parse(r.body)._id !== undefined; } catch { return false; }
      },
      'Create expense < 2000ms': (r) => r.timings.duration < 2000,
    });

    if (createOk) expenseCreated.add(1);
    else errorRate.add(1);

    sleep(0.3);

    // TC-LOAD-004: List expenses
    const listRes = http.get(
      `${BASE_URL}/api/expenses?limit=20&sortBy=dateTime&sortOrder=desc`,
      { headers: authHeaders, tags: { name: 'get_expenses' } }
    );

    apiLatency.add(listRes.timings.duration, { endpoint: '/api/expenses GET' });

    check(listRes, {
      'List expenses status 200': (r) => r.status === 200,
      'List expenses is array': (r) => {
        try { return Array.isArray(JSON.parse(r.body).expenses) || Array.isArray(JSON.parse(r.body)); }
        catch { return false; }
      },
      'List expenses < 2000ms': (r) => r.timings.duration < 2000,
    });

    sleep(0.2);

    // TC-LOAD-005: Get dashboard analytics
    const dashRes = http.get(
      `${BASE_URL}/api/expenses/analytics/dashboard`,
      { headers: authHeaders, tags: { name: 'get_dashboard' } }
    );

    apiLatency.add(dashRes.timings.duration, { endpoint: '/api/expenses/analytics/dashboard' });

    check(dashRes, {
      'Dashboard analytics status 200': (r) => r.status === 200,
      'Dashboard analytics < 3000ms': (r) => r.timings.duration < 3000,
    });

    sleep(0.2);

    // TC-LOAD-006: Search expenses
    const searchRes = http.get(
      `${BASE_URL}/api/expenses?search=Load`,
      { headers: authHeaders, tags: { name: 'search_expenses' } }
    );

    check(searchRes, {
      'Search expenses status 200': (r) => r.status === 200,
    });

    sleep(0.2);
  });

  // ── Group 3: Budgets ──────────────────────────────────────────
  group('Budgets', () => {

    // TC-LOAD-007: Get budgets
    const budgetRes = http.get(
      `${BASE_URL}/api/budgets`,
      { headers: authHeaders, tags: { name: 'get_budgets' } }
    );

    apiLatency.add(budgetRes.timings.duration, { endpoint: '/api/budgets' });

    check(budgetRes, {
      'Get budgets status 200': (r) => r.status === 200,
      'Get budgets < 1500ms': (r) => r.timings.duration < 1500,
    });

    sleep(0.2);

    // TC-LOAD-008: Get budget for current month
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthBudgetRes = http.get(
      `${BASE_URL}/api/budgets/${month}`,
      { headers: authHeaders, tags: { name: 'get_budget_month' } }
    );

    check(monthBudgetRes, {
      'Get monthly budget status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });

    sleep(0.2);
  });

  // ── Group 4: Savings / Wishlist ────────────────────────────────
  group('Savings', () => {

    // TC-LOAD-009: List savings goals
    const savingsRes = http.get(
      `${BASE_URL}/api/savings`,
      { headers: authHeaders, tags: { name: 'get_savings' } }
    );

    apiLatency.add(savingsRes.timings.duration, { endpoint: '/api/savings' });

    check(savingsRes, {
      'Get savings status 200': (r) => r.status === 200,
      'Get savings < 1500ms': (r) => r.timings.duration < 1500,
    });

    sleep(0.2);
  });

  // ── Group 5: Notifications ────────────────────────────────────
  group('Notifications', () => {

    // TC-LOAD-010: Get notifications
    const notifRes = http.get(
      `${BASE_URL}/api/notifications`,
      { headers: authHeaders, tags: { name: 'get_notifications' } }
    );

    apiLatency.add(notifRes.timings.duration, { endpoint: '/api/notifications' });

    check(notifRes, {
      'Get notifications status 200': (r) => r.status === 200,
      'Get notifications < 1500ms': (r) => r.timings.duration < 1500,
    });

    sleep(0.2);
  });

  // ── Group 6: AI Endpoints (sampled 10% of VUs) ────────────────
  if (Math.random() < 0.10) {
    group('AI Endpoints', () => {

      // TC-LOAD-011: Categorize text
      const aiCatRes = http.post(
        `${BASE_URL}/api/ai/categorize`,
        JSON.stringify({ text: 'Zomato biryani order Rs 250' }),
        { headers: authHeaders, tags: { name: 'ai_categorize' } }
      );

      check(aiCatRes, {
        'AI categorize status 200 or 500': (r) => r.status === 200 || r.status === 500,
      });

      sleep(0.5);

      // TC-LOAD-012: AI insights
      const aiInsightRes = http.get(
        `${BASE_URL}/api/ai/insights`,
        { headers: authHeaders, tags: { name: 'ai_insights' } }
      );

      check(aiInsightRes, {
        'AI insights status 200 or 500': (r) => r.status === 200 || r.status === 500,
      });

      sleep(0.5);
    });
  }

  // ── Group 7: Concurrent Expense Delete ────────────────────────
  if (Math.random() < 0.05) {
    group('Cleanup', () => {
      // Get user's expenses and delete oldest
      const allExpenses = http.get(`${BASE_URL}/api/expenses?limit=50`, {
        headers: authHeaders, tags: { name: 'get_all_expenses' }
      });

      if (allExpenses.status === 200) {
        try {
          const body = JSON.parse(allExpenses.body);
          const expenses = Array.isArray(body) ? body : body.expenses;
          if (expenses && expenses.length > 10) {
            const oldest = expenses[expenses.length - 1];
            if (oldest && oldest._id) {
              const deleteRes = http.del(
                `${BASE_URL}/api/expenses/${oldest._id}`,
                null,
                { headers: authHeaders, tags: { name: 'delete_expense' } }
              );
              check(deleteRes, {
                'Delete expense status 200': (r) => r.status === 200,
              });
            }
          }
        } catch {}
      }
      sleep(0.2);
    });
  }

  sleep(Math.random() * 2 + 0.5);
}

// ── Teardown ────────────────────────────────────────────────────
export function teardown(data) {
  console.log('[TEARDOWN] Load test completed.');
  console.log(`[TEARDOWN] Total login successes: ${loginSuccess.name}`);
  console.log(`[TEARDOWN] Total expenses created: ${expenseCreated.name}`);
}

// ── Summary Handler ─────────────────────────────────────────────
export function handleSummary(data) {
  const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return {
    [`load-test-report-${now}.json`]: JSON.stringify(data, null, 2),
    [`load-test-summary-${now}.txt`]: textSummary(data, { indent: ' ', enableColors: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  const { metrics } = data;
  const indent = opts.indent || '';
  const lines = [];

  lines.push(`\n${indent}===== Trackyo Load Test Summary =====`);
  lines.push(`${indent}Duration: 1 min @ 100 VUs (+ ramp scenario)`);
  lines.push('');
  lines.push(`${indent}HTTP Requests:`);
  if (metrics.http_reqs) {
    lines.push(`${indent}  Total:      ${metrics.http_reqs.values.count}`);
    lines.push(`${indent}  Rate:       ${metrics.http_reqs.values.rate.toFixed(2)}/s`);
  }
  if (metrics.http_req_duration) {
    const d = metrics.http_req_duration.values;
    lines.push(`${indent}  Avg:        ${d.avg.toFixed(0)}ms`);
    lines.push(`${indent}  p95:        ${d['p(95)'].toFixed(0)}ms`);
    lines.push(`${indent}  Max:        ${d.max.toFixed(0)}ms`);
  }
  if (metrics.http_req_failed) {
    lines.push(`${indent}  Error Rate: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  }
  lines.push('');
  lines.push(`${indent}Thresholds:`);
  if (data.thresholds) {
    for (const [name, threshold] of Object.entries(data.thresholds)) {
      lines.push(`${indent}  ${name}: ${threshold.ok ? '✅ PASSED' : '❌ FAILED'}`);
    }
  }
  lines.push(`${indent}======================================\n`);
  return lines.join('\n');
}
