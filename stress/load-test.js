/**
 * MyTwin AI – اختبار ضغط لـ 50,000 مستخدم
 * ============================================
 * للتشغيل:
 *   k6 run --vus 100 --duration 300s stress/load-test.js
 *
 * هذا يحاكي 100 مستخدم متزامن لمدة 5 دقائق.
 * لاختبار 50,000 مستخدم تراكمي، شغل لمدة أطول مع VUs أعلى.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://my-twin-pro-production-b744.up.railway.app';

export let options = {
  stages: [
    { duration: '1m', target: 50 },   // ramp-up to 50 users
    { duration: '3m', target: 200 },  // ramp-up to 200 users
    { duration: '2m', target: 500 },  // ramp-up to 500 users
    { duration: '4m', target: 500 },  // sustain 500 users
    { duration: '1m', target: 0 },    // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'],    // less than 5% errors
  },
};

export default function () {
  // 1. Chat API
  const chatRes = http.post(`${BASE_URL}/api/chat`, JSON.stringify({
    message: 'مرحباً',
    lang: 'ar',
    user_id: `user_${__VU}_${__ITER}`,
  }), { headers: { 'Content-Type': 'application/json' } });
  check(chatRes, { 'chat status 200': (r) => r.status === 200 });

  // 2. Consciousness Status
  const consRes = http.get(`${BASE_URL}/api/consciousness/status?user_id=test`);
  check(consRes, { 'consciousness status 200': (r) => r.status === 200 });

  // 3. Health Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, { 'health status 200': (r) => r.status === 200 });

  sleep(1);
}

export function teardown() {
  console.log('✅ Load test completed');
}
