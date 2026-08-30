# Trackyo Load Test Report

**Build:** 3
**Date:** 2026-08-30 08:43 UTC
**VUs:** 100
**Duration:** 1m
**Target URL:** https://trackyo-api.onrender.com

## Results
```
time="2026-08-30T08:42:57Z" level=warning msg="\"env\" level configuration overrode scenarios configuration entirely"

         /\      Grafana   /‾‾/  
    /\  /  \     |\  __   /  /   
   /  \/    \    | |/ /  /   ‾‾\ 
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/ 


     execution: local
        script: load-tests/trackyo-load-test.js
        output: json (load-test-results/raw-results.json)

     scenarios: (100.00%) 1 scenario, 100 max VUs, 1m30s max duration (incl. graceful stop):
              * default: 100 looping VUs for 1m0s (gracefulStop: 30s)

time="2026-08-30T08:42:57Z" level=info msg="[SETUP] Registering 10 load test users at https://trackyo-api.onrender.com" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_0@trackyo.test setup failed: 404 Not Found\n" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_1@trackyo.test setup failed: 404 Not Found\n" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_2@trackyo.test setup failed: 404 Not Found\n" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_3@trackyo.test setup failed: 404 Not Found\n" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_4@trackyo.test setup failed: 404 Not Found\n" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_5@trackyo.test setup failed: 404 Not Found\n" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_6@trackyo.test setup failed: 404 Not Found\n" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_7@trackyo.test setup failed: 404 Not Found\n" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_8@trackyo.test setup failed: 404 Not Found\n" source=console
time="2026-08-30T08:42:57Z" level=warning msg="[SETUP] User loadtest_9@trackyo.test setup failed: 404 Not Found\n" source=console

running (0m01.0s), 100/100 VUs, 0 complete and 0 interrupted iterations
default   [   0% ] 100 VUs  0m00.2s/1m0s

running (0m02.0s), 100/100 VUs, 0 complete and 0 interrupted iterations
default   [   2% ] 100 VUs  0m01.2s/1m0s

running (0m03.0s), 100/100 VUs, 100 complete and 0 interrupted iterations
default   [   4% ] 100 VUs  0m02.2s/1m0s

running (0m04.0s), 100/100 VUs, 195 complete and 0 interrupted iterations
default   [   5% ] 100 VUs  0m03.2s/1m0s

running (0m05.0s), 100/100 VUs, 200 complete and 0 interrupted iterations
default   [   7% ] 100 VUs  0m04.2s/1m0s

running (0m06.0s), 100/100 VUs, 300 complete and 0 interrupted iterations
default   [   9% ] 100 VUs  0m05.2s/1m0s

running (0m07.0s), 100/100 VUs, 399 complete and 0 interrupted iterations
default   [  10% ] 100 VUs  0m06.2s/1m0s

running (0m08.0s), 100/100 VUs, 400 complete and 0 interrupted iterations
default   [  12% ] 100 VUs  0m07.2s/1m0s

running (0m09.0s), 100/100 VUs, 500 complete and 0 interrupted iterations
default   [  14% ] 100 VUs  0m08.2s/1m0s

running (0m10.0s), 100/100 VUs, 600 complete and 0 interrupted iterations
default   [  15% ] 100 VUs  0m09.2s/1m0s

running (0m11.0s), 100/100 VUs, 600 complete and 0 interrupted iterations
default   [  17% ] 100 VUs  0m10.2s/1m0s

running (0m12.0s), 100/100 VUs, 700 complete and 0 interrupted iterations
default   [  19% ] 100 VUs  0m11.2s/1m0s

running (0m13.0s), 100/100 VUs, 800 complete and 0 interrupted iterations
default   [  20% ] 100 VUs  0m12.2s/1m0s

running (0m14.0s), 100/100 VUs, 800 complete and 0 interrupted iterations
default   [  22% ] 100 VUs  0m13.2s/1m0s

running (0m15.0s), 100/100 VUs, 900 complete and 0 interrupted iterations
default   [  24% ] 100 VUs  0m14.2s/1m0s

running (0m16.0s), 100/100 VUs, 1000 complete and 0 interrupted iterations
default   [  25% ] 100 VUs  0m15.2s/1m0s

running (0m17.0s), 100/100 VUs, 1024 complete and 0 interrupted iterations
default   [  27% ] 100 VUs  0m16.2s/1m0s

running (0m18.0s), 100/100 VUs, 1100 complete and 0 interrupted iterations
default   [  29% ] 100 VUs  0m17.2s/1m0s

running (0m19.0s), 100/100 VUs, 1200 complete and 0 interrupted iterations
default   [  30% ] 100 VUs  0m18.2s/1m0s

running (0m20.0s), 100/100 VUs, 1263 complete and 0 interrupted iterations
default   [  32% ] 100 VUs  0m19.2s/1m0s

running (0m21.0s), 100/100 VUs, 1300 complete and 0 interrupted iterations
default   [  34% ] 100 VUs  0m20.2s/1m0s

running (0m22.0s), 100/100 VUs, 1400 complete and 0 interrupted iterations
default   [  35% ] 100 VUs  0m21.2s/1m0s

running (0m23.0s), 100/100 VUs, 1480 complete and 0 interrupted iterations
default   [  37% ] 100 VUs  0m22.2s/1m0s

running (0m24.0s), 100/100 VUs, 1500 complete and 0 interrupted iterations
default   [  39% ] 100 VUs  0m23.2s/1m0s

running (0m25.0s), 100/100 VUs, 1600 complete and 0 interrupted iterations
default   [  40% ] 100 VUs  0m24.2s/1m0s

running (0m26.0s), 100/100 VUs, 1694 complete and 0 interrupted iterations
default   [  42% ] 100 VUs  0m25.2s/1m0s

running (0m27.0s), 100/100 VUs, 1700 complete and 0 interrupted iterations
default   [  44% ] 100 VUs  0m26.2s/1m0s

running (0m28.0s), 100/100 VUs, 1800 complete and 0 interrupted iterations
default   [  45% ] 100 VUs  0m27.2s/1m0s

running (0m29.0s), 100/100 VUs, 1898 complete and 0 interrupted iterations
default   [  47% ] 100 VUs  0m28.2s/1m0s

running (0m30.0s), 100/100 VUs, 1900 complete and 0 interrupted iterations
default   [  49% ] 100 VUs  0m29.2s/1m0s

running (0m31.0s), 100/100 VUs, 2000 complete and 0 interrupted iterations
default   [  50% ] 100 VUs  0m30.2s/1m0s

running (0m32.0s), 100/100 VUs, 2100 complete and 0 interrupted iterations
default   [  52% ] 100 VUs  0m31.2s/1m0s

running (0m33.0s), 100/100 VUs, 2100 complete and 0 interrupted iterations
default   [  54% ] 100 VUs  0m32.2s/1m0s

running (0m34.0s), 100/100 VUs, 2200 complete and 0 interrupted iterations
default   [  55% ] 100 VUs  0m33.2s/1m0s

running (0m35.0s), 100/100 VUs, 2300 complete and 0 interrupted iterations
default   [  57% ] 100 VUs  0m34.2s/1m0s

running (0m36.0s), 100/100 VUs, 2313 complete and 0 interrupted iterations
default   [  59% ] 100 VUs  0m35.2s/1m0s

running (0m37.0s), 100/100 VUs, 2400 complete and 0 interrupted iterations
default   [  60% ] 100 VUs  0m36.2s/1m0s

running (0m38.0s), 100/100 VUs, 2500 complete and 0 interrupted iterations
default   [  62% ] 100 VUs  0m37.2s/1m0s

running (0m39.0s), 100/100 VUs, 2533 complete and 0 interrupted iterations
default   [  64% ] 100 VUs  0m38.2s/1m0s

running (0m40.0s), 100/100 VUs, 2600 complete and 0 interrupted iterations
default   [  65% ] 100 VUs  0m39.2s/1m0s

running (0m41.0s), 100/100 VUs, 2700 complete and 0 interrupted iterations
default   [  67% ] 100 VUs  0m40.2s/1m0s

running (0m42.0s), 100/100 VUs, 2769 complete and 0 interrupted iterations
default   [  69% ] 100 VUs  0m41.2s/1m0s

running (0m43.0s), 100/100 VUs, 2800 complete and 0 interrupted iterations
default   [  70% ] 100 VUs  0m42.2s/1m0s

running (0m44.0s), 100/100 VUs, 2900 complete and 0 interrupted iterations
default   [  72% ] 100 VUs  0m43.2s/1m0s

running (0m45.0s), 100/100 VUs, 2983 complete and 0 interrupted iterations
default   [  74% ] 100 VUs  0m44.2s/1m0s

running (0m46.0s), 100/100 VUs, 3000 complete and 0 interrupted iterations
default   [  75% ] 100 VUs  0m45.2s/1m0s

running (0m47.0s), 100/100 VUs, 3100 complete and 0 interrupted iterations
default   [  77% ] 100 VUs  0m46.2s/1m0s

running (0m48.0s), 100/100 VUs, 3195 complete and 0 interrupted iterations
default   [  79% ] 100 VUs  0m47.2s/1m0s

running (0m49.0s), 100/100 VUs, 3200 complete and 0 interrupted iterations
default   [  80% ] 100 VUs  0m48.2s/1m0s

running (0m50.0s), 100/100 VUs, 3300 complete and 0 interrupted iterations
default   [  82% ] 100 VUs  0m49.2s/1m0s

running (0m51.0s), 100/100 VUs, 3399 complete and 0 interrupted iterations
default   [  84% ] 100 VUs  0m50.2s/1m0s

running (0m52.0s), 100/100 VUs, 3401 complete and 0 interrupted iterations
default   [  85% ] 100 VUs  0m51.2s/1m0s

running (0m53.0s), 100/100 VUs, 3500 complete and 0 interrupted iterations
default   [  87% ] 100 VUs  0m52.2s/1m0s

running (0m54.0s), 100/100 VUs, 3599 complete and 0 interrupted iterations
default   [  89% ] 100 VUs  0m53.2s/1m0s

running (0m55.0s), 100/100 VUs, 3610 complete and 0 interrupted iterations
default   [  90% ] 100 VUs  0m54.2s/1m0s

running (0m56.0s), 100/100 VUs, 3700 complete and 0 interrupted iterations
default   [  92% ] 100 VUs  0m55.2s/1m0s

running (0m57.0s), 100/100 VUs, 3800 complete and 0 interrupted iterations
default   [  94% ] 100 VUs  0m56.2s/1m0s

running (0m58.0s), 100/100 VUs, 3829 complete and 0 interrupted iterations
default   [  95% ] 100 VUs  0m57.2s/1m0s

running (0m59.0s), 100/100 VUs, 3900 complete and 0 interrupted iterations
default   [  97% ] 100 VUs  0m58.2s/1m0s

running (1m00.0s), 100/100 VUs, 4000 complete and 0 interrupted iterations
default   [  99% ] 100 VUs  0m59.2s/1m0s

running (1m01.0s), 053/100 VUs, 4055 complete and 0 interrupted iterations
default ↓ [ 100% ] 100 VUs  1m0s

running (1m02.0s), 008/100 VUs, 4100 complete and 0 interrupted iterations
default ↓ [ 100% ] 100 VUs  1m0s
time="2026-08-30T08:43:59Z" level=info msg="[TEARDOWN] Load test completed." source=console
time="2026-08-30T08:43:59Z" level=info msg="[TEARDOWN] Total login successes: login_success_total" source=console
time="2026-08-30T08:43:59Z" level=info msg="[TEARDOWN] Total expenses created: expense_created_total" source=console

 ===== Trackyo Load Test Summary =====
 Duration: 1 min @ 100 VUs (+ ramp scenario)

 HTTP Requests:
   Total:      4118
   Rate:       66.14/s
   Avg:        64ms
   p95:        83ms
   Max:        285ms
   Error Rate: 100.00%

 Thresholds:
 ======================================

running (1m02.3s), 000/100 VUs, 4108 complete and 0 interrupted iterations
default ✓ [ 100% ] 100 VUs  1m0s
time="2026-08-30T08:43:59Z" level=error msg="thresholds on metrics 'errors, http_req_failed' have been crossed"
```
