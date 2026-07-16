# Roadmap Implementation — giải thích từng bước (tiếng Việt)

> Tài liệu này ghi lại **chi tiết, cặn kẽ** những gì đã làm để hoàn thành **cả 6
> nhóm (themes)** trong [roadmap.md](./roadmap.md). Viết cho người mới: mỗi phần
> đều nói rõ **làm gì · vì sao · các file liên quan · cách chạy để kiểm chứng**.

---

## 0. Tổng quan — trước và sau

| Hạng mục             | Trước                         | Sau                                                                                      |
| -------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| Test E2E/API         | 54 (× 3 trình duyệt = 162)    | **67** (× 3 = **201**)                                                                   |
| Loại test            | UI · API · E2E · security     | + **a11y** · **performance** · **visual** · **unit (Vitest)**                            |
| Test security        | 5                             | **7** (thêm JWT-tampering + security headers)                                            |
| CI                   | smoke + nightly               | + `checks` (typecheck/lint/unit/audit) · **CodeQL** · **Dependabot** · nightly **shard** |
| Report               | Allure trend                  | + **Allure categories** (phân loại lỗi)                                                  |
| Coverage chức năng   | mua hàng (đăng ký→thanh toán) | + **đổi mật khẩu** · **đánh giá sản phẩm** · **admin fixture**                           |
| Developer eXperience | ESLint/Prettier/tsc           | + **husky + lint-staged** · **CONTRIBUTING** · **ADRs**                                  |

**Nguyên tắc xuyên suốt (giữ đúng chuẩn cũ):** dữ liệu **riêng cho mỗi test**
(chạy song song an toàn), **không `sleep`** (chỉ dùng web-first assertion), **có
tag** để CI chọn được, và **có tài liệu**.

> ⚙️ **Cách "probe trước khi code":** với mỗi endpoint/hành vi chưa chắc, mình
> dùng `curl`/script nhỏ để xác minh **sự thật của app** rồi mới viết assertion —
> không đoán. Ví dụ: đã xác minh token hỏng → app trả `401`, `/api/Products` →
> `200` còn `/rest/products` → `500`, đổi mật khẩu sai `current` → `401`…

---

## Theme 1 — Mở rộng coverage chức năng

### 1a. Đổi mật khẩu (Profile) — `tests/api/profile.spec.ts`

**Làm gì:** kiểm luồng đổi mật khẩu — một khoảng trống P3 (profile management).

**Cách hoạt động (pattern "hành động → kiểm chứng trạng thái thật"):**

1. Tạo user mới (factory) + đăng nhập qua API.
2. Gọi đổi mật khẩu: Juice Shop dùng `GET /rest/user/change-password?current=&new=&repeat=` (kèm token).
3. **Kiểm chứng thật:** đăng nhập bằng mật khẩu **mới** phải `200`, bằng mật khẩu **cũ** phải `401`.
4. Hai case âm: sai `current` → `401` (và mật khẩu cũ vẫn dùng được), `new`≠`repeat` → `401`.

**File liên quan:**

- `src/api/auth.api.ts` — thêm `changePassword(current, next, repeat?)` và tách
  `loginToSession(email, password)` (đăng nhập không cần đăng ký, dùng lại cho admin).
- `src/data/constants.ts` — thêm `ENDPOINTS.changePassword`, `ROUTES.changePassword`.

**Chạy thử:** `npx playwright test tests/api/profile.spec.ts --project=chromium`

### 1b. Đánh giá sản phẩm (Reviews) — `tests/api/reviews.spec.ts`

**Làm gì:** đọc + thêm review — luồng e-commerce phổ biến.

**Cách hoạt động:**

- Đọc công khai: `GET /rest/products/{id}/reviews` → `{status:'success', data:[...]}`.
- Thêm (cần đăng nhập): `PUT /rest/products/{id}/reviews` với `{message, author}` → `201`.
- **Parallel-safe:** `message` gắn timestamp duy nhất, rồi đọc lại để chứng minh nó đã lưu.

**File liên quan:** `src/api/review.api.ts` (client mới, theo mẫu `BaseApi`), fixture
`reviewApi` trong `auth.fixture.ts`, `ENDPOINTS.productReviews(id)`.

---

## Theme 2 — Loại test mới

### 2a. Accessibility (a11y) bằng axe — `tests/a11y/a11y.spec.ts`

**Làm gì:** quét lỗi tiếp cận theo chuẩn WCAG 2 A/AA bằng `@axe-core/playwright`.

**Điểm hay (probe quyết định assertion):** Juice Shop **không** accessible hoàn toàn,
nên "0 vi phạm" sẽ luôn đỏ. Mình quét thử trước và phát hiện:

- Trang **catalog**: không có lỗi mức `critical`.
- Trang **login**: có lỗi `label` (mức **critical**) — ô nhập không có nhãn cho screen-reader.

Vì vậy dùng **2 kiểu bổ trợ nhau**:

1. **Chốt chặn (guard)** ở catalog: không được có lỗi `critical` **mới** ngoài lỗi
   `label` đã biết (allow-list) → vẫn bắt được lỗi mới phát sinh.
2. **Ghi nhận finding** ở login: khẳng định lỗi `label` đang tồn tại (giống cách
   spec security ghi nhận lỗ hổng), kèm comment `FINDING` nói app chuẩn phải sửa.

**Chạy thử:** `npm run test:a11y`

### 2b. Performance smoke — `tests/performance/performance.spec.ts`

**Làm gì:** "lan can" hiệu năng rẻ tiền — khẳng định API trả lời **dưới ngân sách** (`800ms`).

**Cách hoạt động:** đo thời gian gọi `GET /api/Products` (catalog) và một lần đọc
basket đã đăng nhập. Đo được thực tế ~5–20ms nên ngân sách 800ms **không flaky**
nhưng vẫn bắt được sụt tốc kiểu N+1 query. Có helper `timed()` trả `[kết quả, ms]`.

**Chạy thử:** `npm run test:performance`

### 2c. Visual regression — `tests/visual/visual.spec.ts`

**Làm gì:** chụp ảnh trang ổn định (login, register) và so sánh với **baseline** để
bắt "trôi giao diện" (`toHaveScreenshot`).

**Bẫy đã xử lý (quan trọng):** ảnh baseline **phụ thuộc HĐH** (Windows ≠ Linux CI).
Do đó:

- Tag **`@visual` thôi** (không gắn `@regression`) → CI smoke/nightly **bỏ qua**, không đỏ giả.
- `test.skip` khi trình duyệt ≠ chromium → lệnh `npm test` đầy đủ vẫn xanh.
- Baseline chromium/Windows đã commit trong `tests/visual/visual.spec.ts-snapshots/`.
- Muốn cập nhật có chủ đích: `npm run test:visual:update`.

### 2d. Unit test bằng Vitest — `tests/unit/*.test.ts`

**Làm gì:** test **logic của chính framework** (không cần trình duyệt/app), chạy cực nhanh.

- `currency.test.ts`: `parsePrice`, `roundMoney`, `calcTotal` (nền tảng cho mọi
  assertion tổng tiền giỏ hàng).
- `user.factory.test.ts`: factory tạo user **hợp lệ + duy nhất** (nền tảng cho
  chiến lược "dữ liệu riêng mỗi test").

**Tách khỏi Playwright ra sao:** Playwright mặc định cũng nhận file `*.test.ts`,
nên dễ đụng nhau. Cách xử lý:

- `playwright.config.ts` → `testIgnore: ['**/unit/**']`.
- `vitest.config.ts` → chỉ chạy `tests/unit/**/*.test.ts`.

**Chạy thử:** `npm run test:unit` (9 test).

---

## Theme 3 — Đào sâu security (phòng thủ, không tấn công)

> Tất cả chỉ chạy trên app training chạy **local của mình**; không có mã khai thác
> phá hoại. Xem triết lý ở [ADR-0005](./adr/0005-security-tests-assert-current-behaviour.md).

### 3a. Hai test `@security` mới — `tests/security/security.spec.ts`

- **JWT bị sửa phải bị từ chối:** lấy token hợp lệ, làm hỏng 4 ký tự chữ ký, gọi
  endpoint cần xác thực → app trả `401/403`. Đây là test **phòng thủ** (chứng minh
  auth được thực thi), ngược với các test "ghi nhận lỗ hổng".
- **Security headers:** `GET /` rồi khẳng định `x-content-type-options: nosniff` và
  `x-frame-options` **đang có**; comment `FINDING` nêu app chuẩn nên có thêm **CSP**
  và **HSTS** (Juice Shop thiếu).

### 3b. `npm audit` trong CI — `.github/workflows/smoke.yml`

Thêm job `checks`: `npm audit --audit-level=high` → chặn build nếu có lỗ hổng
dependency mức cao/nghiêm trọng (OWASP A06). Hiện tại **0 lỗ hổng**.

### 3c. CodeQL (SAST) — `.github/workflows/codeql.yml`

Quét mã tĩnh TypeScript mỗi push/PR + hằng tuần; kết quả ở tab **Security → Code
scanning**. Dùng bộ truy vấn `security-and-quality`.

### 3d. Dependabot — `.github/dependabot.yml`

Tự mở PR cập nhật **npm**, **GitHub Actions**, và **Docker image** (Juice Shop),
gom nhóm để dễ review.

---

## Theme 4 — CI/CD & mở rộng: Test sharding

**File:** `.github/workflows/nightly-regression.yml`

**Làm gì:** chia suite `@regression` thành **3 phần chạy song song** trên 3 runner
(`--shard=1/3`, `2/3`, `3/3`) để nhanh hơn khi test ngày càng nhiều.

**Khó ở đâu & cách giải:** vẫn phải giữ **Allure trend report** đẹp. Mỗi shard sinh
`allure-results` riêng (tên file là UUID nên **không đụng nhau**). Luồng mới:

1. Job `regression` (matrix 3 shard) — mỗi shard tự dựng Docker, chạy phần của mình,
   **upload `allure-results`** (kể cả khi fail: `if: always()`).
2. Job `report` — tải hết kết quả các shard, **gộp** vào một thư mục, thêm lịch sử
   trend + `categories.json`, rồi `allure generate`.
3. Job `deploy` — publish lên GitHub Pages.
4. Job `status` — nếu **bất kỳ shard nào fail** thì cả run đỏ (báo hiệu rõ ràng).

---

## Theme 5 — Reporting & tín hiệu chất lượng: Allure categories

**File:** `allure/categories.json` + `scripts/prepare-allure.mjs`

**Làm gì:** khi có test fail, Allure **tự phân loại** vào các nhóm để triage nhanh:

- **Infrastructure & environment** (ECONNREFUSED, browser closed…)
- **Timeouts (possible flake)**
- **Product defect (app under test)** — khớp comment `FINDING`
- **Test defect (assertion mismatch)** — lỗi `expect(...)`
- **Ignored / known issues** — test skip

**Cách nối vào:** `scripts/prepare-allure.mjs` copy `categories.json` vào
`allure-results/` **trước khi** generate (chạy được cả Windows lẫn Linux, không dùng
`cp` của shell). Đã gắn vào `npm run allure:generate` và bước generate trong nightly.

---

## Theme 6 — Framework & developer experience

### 6a. Admin-role fixture — `src/fixtures/auth.fixture.ts` + `tests/api/admin.spec.ts`

**Làm gì:** thêm fixture `adminSession` đăng nhập bằng tài khoản admin có sẵn
(`admin@juice-sh.op`) — mở đường cho các luồng/authz chỉ dành cho admin.

**Chi tiết khéo:** `adminSession` dùng **instance `AuthApi` riêng** để không đụng
token với user thường (`session`) trong cùng một test. Test giải mã payload JWT và
khẳng định `role === 'admin'`; user thường thì `role !== 'admin'` (tách vai trò).

### 6b. Pre-commit hooks — husky + lint-staged

**Làm gì:** trước mỗi commit, tự chạy `lint-staged` trên **file đang stage**:
`eslint --fix` + `prettier --write` cho code, `prettier --write` cho json/md/yaml
→ chặn code bẩn ngay từ nguồn.

**File:** `.husky/pre-commit`, cấu hình `lint-staged` + script `prepare: husky`
trong `package.json`.

### 6c. CONTRIBUTING.md + ADRs

- **`CONTRIBUTING.md`** — cách setup, bảng script, cấu trúc thư mục, **5 quy tắc mọi
  test phải theo**, checklist thêm test, ghi chú visual cross-OS.
- **`docs/adr/`** — 5 Architecture Decision Records ghi lại **vì sao** framework
  được thiết kế như vậy (POM+fixtures, API-first + storageState, per-test data,
  cách test security ghi nhận hành vi hiện tại).

---

## Cách kiểm chứng toàn bộ (local)

```bash
npm run app:up && npm run app:wait      # bật Juice Shop (Docker)

# Chất lượng (giống job `checks` trên CI)
npm run typecheck && npm run lint && npm run test:unit

# Các loại test mới
npm run test:security      # 7 test (chromium)
npm run test:a11y          # 2 test
npm run test:performance   # 2 test
npm run test:visual        # 2 test (chromium)

# Toàn bộ suite trên 1 engine
npx playwright test --project=chromium   # 69 case, xanh

# Report Allure (đã có categories) — cần JRE
npm run allure:generate && npm run allure:open
```

**Kết quả đã xác minh khi làm:** 69/69 case chromium xanh; a11y + performance xanh
trên cả **firefox & webkit**; 9/9 unit test xanh; `typecheck`/`lint` sạch.

---

## Bản đồ file đã thêm/sửa (tra cứu nhanh)

**Thêm mới**

- `tests/a11y/a11y.spec.ts`, `tests/performance/performance.spec.ts`,
  `tests/visual/visual.spec.ts` (+ snapshots), `tests/unit/currency.test.ts`,
  `tests/unit/user.factory.test.ts`
- `tests/api/profile.spec.ts`, `tests/api/reviews.spec.ts`, `tests/api/admin.spec.ts`
- `src/api/review.api.ts`
- `vitest.config.ts`, `scripts/prepare-allure.mjs`, `allure/categories.json`
- `.github/workflows/codeql.yml`, `.github/dependabot.yml`, `.husky/pre-commit`
- `CONTRIBUTING.md`, `docs/adr/*` (README + 5 ADR), `docs/roadmap-implementation.md` (file này)

**Sửa**

- `tests/security/security.spec.ts` (+2 test), `src/api/auth.api.ts`,
  `src/fixtures/auth.fixture.ts`, `src/data/constants.ts`
- `playwright.config.ts` (`testIgnore` unit), `package.json` (deps + scripts +
  lint-staged + prepare)
- `.github/workflows/smoke.yml` (job `checks`), `.github/workflows/nightly-regression.yml` (sharding + categories)
- `README.md`, `docs/roadmap.md`, `docs/test-cases.md`, `docs/test-strategy.md`
