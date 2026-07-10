# Kế hoạch Project: E2E Test Automation Framework cho OWASP Juice Shop

> **Mục tiêu:** Xây dựng framework kiểm thử tự động hoàn chỉnh (UI + API + CI/CD) bằng Playwright + TypeScript cho một hệ thống e-commerce thật, đủ chất lượng để đưa vào CV vị trí QA/QC Engineer và làm chủ đề thảo luận trong phỏng vấn.

---

## 1. Tổng quan

| Hạng mục | Lựa chọn |
|---|---|
| Hệ thống under test | [OWASP Juice Shop](https://github.com/juice-shop/juice-shop) — e-commerce SPA (Angular) + REST API (Express/Node), chạy bằng Docker |
| Ngôn ngữ / Framework | TypeScript + Playwright Test |
| Test data | @faker-js/faker (sinh dữ liệu động) |
| Reporting | Playwright HTML Report + Allure Report, publish lên GitHub Pages |
| CI/CD | GitHub Actions (smoke on push, nightly full regression) |
| Môi trường | Docker Compose (Juice Shop chạy local + trong CI) |
| Tên repo gợi ý | `juice-shop-e2e-playwright` |

**Vì sao Juice Shop phù hợp:**
- Là e-commerce đầy đủ: đăng ký/đăng nhập, catalog, search, basket, checkout (address → delivery → payment → order), review sản phẩm — đúng mục tiêu luyện thiết kế automation cho hệ thống e-commerce.
- Có REST API rõ ràng (`/rest/*`, `/api/*`) → luyện được cả API testing và kỹ thuật "API-first setup" (tạo dữ liệu/đăng nhập qua API để UI test chạy nhanh).
- Chạy được hoàn toàn bằng 1 container Docker → CI dựng được toàn bộ hệ thống, không phụ thuộc site public.
- Là app của OWASP (nổi tiếng trong giới) → interviewer nhận ra ngay, tạo thiện cảm.

**Lưu ý kỹ thuật:** Juice Shop dùng SQLite nhúng trong container nên không verify DB trực tiếp từ bên ngoài như MySQL. Thay vào đó, tầng verification sẽ là **API-level state check** (sau khi UI thao tác → gọi API xác nhận state). Đây vẫn là kỹ năng tương đương và hiện đại hơn trong ngữ cảnh SPA/API-driven app.

---

## 2. Kiến trúc framework

```
juice-shop-e2e-playwright/
├── .github/workflows/
│   ├── smoke.yml              # chạy khi push/PR
│   └── nightly-regression.yml # cron hằng đêm + publish report
├── docker-compose.yml         # dựng Juice Shop local & CI
├── playwright.config.ts       # projects: chromium/firefox/webkit, retry, trace
├── src/
│   ├── pages/                 # Page Object Model
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   ├── register.page.ts
│   │   ├── home.page.ts       # catalog + search
│   │   ├── product.detail.component.ts
│   │   ├── basket.page.ts
│   │   └── checkout/          # address, delivery, payment, order-summary
│   ├── api/                   # API client layer (RestClient wrapper)
│   │   ├── auth.api.ts        # login, register qua API
│   │   ├── basket.api.ts
│   │   └── product.api.ts
│   ├── fixtures/              # Playwright custom fixtures
│   │   ├── auth.fixture.ts    # storageState — login 1 lần, tái dùng
│   │   └── test-data.fixture.ts
│   ├── data/
│   │   ├── factories/         # faker-based data factory (user, address, card)
│   │   └── constants.ts
│   └── utils/                 # helpers: env config, logger, custom assertions
├── tests/
│   ├── ui/
│   │   ├── auth/              # register, login, logout, negative cases
│   │   ├── catalog/           # search, filter, product detail
│   │   ├── basket/            # add/update/remove, price calculation
│   │   └── checkout/          # full purchase flow E2E
│   ├── api/
│   │   ├── auth.api.spec.ts
│   │   ├── products.api.spec.ts
│   │   └── basket.api.spec.ts
│   └── e2e/
│       └── purchase-journey.spec.ts  # hành trình mua hàng đầy-đủ
├── docs/
│   ├── test-strategy.md       # chiến lược test, risk-based analysis
│   ├── test-cases.md          # test case design (có traceability)
│   └── bug-reports/           # sample bug reports chuẩn JIRA-style
└── README.md                  # kiến trúc, badge CI, link report, hướng dẫn chạy
```

**Nguyên tắc thiết kế cần thể hiện (điểm nói trong phỏng vấn):**
1. **POM + fixtures** — tách locator/action khỏi test logic; test đọc như đặc tả nghiệp vụ.
2. **API-first setup** — đăng nhập & seed data qua API, chỉ test UI ở phần cần test UI → suite nhanh, ít flaky.
3. **Data factory** — không hardcode data; mỗi test tự sinh user/data riêng → chạy song song an toàn.
4. **Tagging** — `@smoke`, `@regression`, `@api` → CI chọn suite theo ngữ cảnh.
5. **Không sleep cứng** — chỉ dùng web-first assertions / auto-waiting của Playwright.

---

## 3. Phạm vi test (Test Scope)

### 3.1 UI Tests (~40–50 test cases)

| Module | Flows chính | Ưu tiên |
|---|---|---|
| **Auth** | Đăng ký (hợp lệ, email trùng, password yếu, security question), đăng nhập (đúng/sai, SQLi input handling), logout, forgot password | P1 |
| **Catalog & Search** | Search có/không kết quả, xem product detail, pagination, review sản phẩm | P2 |
| **Basket** | Thêm/xoá/tăng giảm số lượng, tính tổng tiền, basket giữ nguyên sau reload, coupon | P1 |
| **Checkout** | Thêm/chọn address, chọn delivery option, thêm/chọn payment card, đặt hàng thành công, order confirmation + lịch sử đơn | P1 |
| **Profile** | Đổi thông tin, đổi password | P3 |

### 3.2 API Tests (~25–30 test cases)
- **Auth API:** login (200), sai credentials (401), register (201), email trùng (4xx), schema validation cho response.
- **Products API:** GET list/detail, search param, response schema (dùng zod hoặc JSON schema).
- **Basket API:** thêm item (có token), thao tác không token (401), truy cập basket người khác (authorization check — negative).
- **Kỹ thuật thể hiện:** status code + body + schema assertion, token handling, negative/boundary testing.

### 3.3 E2E Journey (2–3 kịch bản "đinh")
- **Guest → đăng ký → tìm sản phẩm → thêm giỏ → checkout đầy đủ → verify order qua API.** Đây là test demo trong README (quay GIF).

### 3.4 (Tùy chọn — Lớp nâng cao) Security-aware tests
Juice Shop là app cố tình có lỗ hổng → viết 3–5 test "security smoke" (vd: SQL injection ở login, XSS ở search) đánh dấu `@security`, kèm giải thích trong docs. Điểm khác biệt lớn so với ứng viên khác, và mở chuyện được với công ty coi trọng security.

---

## 4. Lộ trình 6 tuần (8–10 giờ/tuần)

### Tuần 1 — Nền móng ✅
- [x] Học nhanh Playwright + TS (docs chính thức, phần Test/Fixtures/POM) — 3–4h
- [x] Init repo: `npm init playwright@latest`, cấu trúc thư mục, ESLint + Prettier
- [x] Docker Compose chạy Juice Shop local (pinned `bkimminich/juice-shop:v17.1.1`); explore app bằng tay → `docs/exploratory-notes.md`
- [x] Viết `docs/test-strategy.md`: scope, risk analysis, cái gì automate/cái gì không
- **Milestone:** ✅ repo chạy được test against Juice Shop local (không chỉ 1 test mẫu — cả suite xanh).

### Tuần 2 — Auth + POM foundation ✅
- [x] Base page + login/register pages (+ navbar component, forgot-password page)
- [x] Auth UI tests (positive + negative): login, register, logout, forgot-password
- [x] Auth API client + API tests; fixture `storageState` (login qua API 1 lần, inject token/bid → `loggedInPage`)
- [x] Data factory với faker (user, address, card)
- **Milestone:** ✅ vượt mục tiêu — Auth UI + Auth API xanh, chạy song song, mỗi test tự sinh user riêng (không hardcode data).

### Tuần 3 — Catalog + Basket ✅
- [x] Home/search/product pages + tests (catalog, search hit/miss, product-detail dialog, pagination)
- [x] Basket page + tests (add/increase/decrease/remove, verify tổng tiền, persistence)
- [x] Basket/Products API tests; pattern "UI action → API verify state" (dùng xuyên suốt basket suite)
- **Milestone:** ✅ **47 tests** (vượt ~35), tagging `@smoke`/`@regression`/`@api`/`@security` hoàn chỉnh; full suite ~14s.

### Tuần 4 — Checkout + E2E + CI ✅
- [x] Checkout pages (address/delivery/payment/order-summary/confirmation) + tests (4 test, UI + API verify)
- [x] E2E purchase journey (register → shop → checkout → pay, full UI, verify qua API)
- [x] GitHub Actions: workflow smoke (push/PR) — dựng Juice Shop bằng Docker trong CI, chạy suite @smoke (14 test)
- **Milestone:** ✅ CI workflow `smoke.yml` sẵn sàng + badge trong README; **52 test** tổng, smoke 14 test ~15s. (Badge sẽ xanh sau khi push lên GitHub.)

### Tuần 5 — Reporting + độ ổn định ✅
- [x] Allure Report tích hợp (reporter + `allure:generate/open/serve`); nightly regression workflow (cron `0 18 * * *`) + publish report lên GitHub Pages (giữ trend history)
- [x] Trace/screenshot/video on failure; retry strategy (2 CI / 1 local); xử lý flaky (fix race menu Firefox, stock depletion → fresh container / `app:reset`)
- [x] Chạy đa trình duyệt (chromium/firefox/webkit projects) — **156/156 xanh** (~1.6 phút)
- **Milestone:** ✅ Allure report tự publish lên GitHub Pages qua nightly (`https://OWNER.github.io/juice-shop-e2e-playwright/`); badge nightly trong README. (Public sau khi push lên GitHub + bật Pages.)

### Tuần 6 — Polish & "bán hàng"
- [ ] README hoàn chỉnh: sơ đồ kiến trúc (mermaid), badge, GIF demo, hướng dẫn chạy 1 lệnh
- [ ] `docs/test-cases.md` (traceability: requirement → test case → automated spec)
- [ ] 3–5 sample bug reports chuẩn (severity/priority/steps/actual/expected) — thể hiện kỹ năng manual song song
- [ ] (Tùy chọn) 3–5 security smoke tests
- [ ] Dọn commit history, viết bullet points cho CV
- **Milestone:** repo public, sẵn sàng để link vào CV.

---

## 5. CI/CD chi tiết

**smoke.yml** (push/PR):
1. Checkout → setup Node → `npm ci` → cache Playwright browsers
2. `docker compose up -d` Juice Shop → wait for healthy (curl retry)
3. `npx playwright test --grep @smoke`
4. Upload HTML report + trace làm artifact khi fail

**nightly-regression.yml** (cron `0 18 * * *` ≈ 1h sáng VN):
1. Như trên nhưng chạy full suite, cả 3 browser
2. Generate Allure → deploy lên nhánh `gh-pages` → GitHub Pages

---

## 6. Định nghĩa "Hoàn thành" (Definition of Done)

- [ ] ≥ 70 test cases tự động (UI + API), pass ổn định, chạy song song < 10 phút
- [ ] CI xanh, nightly report public trên GitHub Pages
- [ ] README + test strategy + sample bug reports đầy đủ
- [ ] Bạn tự giải thích được **mọi quyết định thiết kế** trong repo (câu hỏi phỏng vấn chắc chắn gặp: "Tại sao dùng fixture thay vì beforeEach?", "Xử lý flaky test thế nào?", "Tại sao login qua API?")

## 7. Bullet points dự kiến cho CV

- Designed and built an E2E test automation framework (Playwright + TypeScript) for a dockerized e-commerce application, covering 70+ UI/API test cases across auth, catalog, basket, and checkout flows
- Implemented API-first test setup (auth via API, storage state reuse) and faker-based data factories, enabling fully parallel execution in under 10 minutes
- Built GitHub Actions CI pipelines: smoke suite on every push and nightly cross-browser regression with Allure reports auto-published to GitHub Pages
- Authored risk-based test strategy and traceable test case documentation; included security smoke tests (SQLi/XSS) leveraging OWASP Juice Shop

## 8. Rủi ro & cách né

| Rủi ro | Cách xử lý |
|---|---|
| Ôm đồm quá scope, bỏ dở | Bám milestone tuần; Lớp security & webkit là optional — cắt trước nếu thiếu thời gian |
| Flaky tests làm CI đỏ | Chỉ dùng auto-waiting; mỗi test tự tạo data riêng; trace on retry để debug |
| Juice Shop update làm vỡ test | Pin version image trong docker-compose (vd `bkimminich/juice-shop:v17.x`) |
| Học TS/Playwright chậm hơn dự kiến | Tuần 1 chỉ cần đủ để viết test đầu tiên; học tiếp trong lúc làm |
