# Hướng dẫn luyện tập — mở rộng framework từng bước

> Bản chi tiết, "how-to" của [roadmap.md](../roadmap.md). Mỗi task giải thích **làm gì · cài gì · các bước · code mẫu · xong khi nào**, để bạn tự luyện bài bản. Tập trung vào **7 task ưu tiên** (value/effort cao nhất).

## Cách luyện tập bài bản (quy trình lặp cho MỌI task)

Làm mỗi task như một mini-project để rèn đúng quy trình chuyên nghiệp:

1. **Tạo nhánh:** `git checkout -b feat/a11y` (mỗi task 1 nhánh).
2. **Probe nếu cần** (selector/endpoint mới) — chạy thử, `console.log`, xoá script tạm. _(xem [docker.md](./docker.md), cách week 1 probe)._
3. **Viết code** — thêm POM/helper/test theo đúng pattern hiện có.
4. **Gắn tag** phù hợp (`@regression` + tag riêng như `@a11y`, `@security`, `@visual`).
5. **Chạy local xanh:** `npm run app:reset && npx playwright test <spec> --project=chromium`.
6. **Quality gate:** `npm run typecheck && npm run lint && npm run format`.
7. **Commit + push**, xem CI (Actions) xanh.
8. _(tuỳ)_ mở **Pull Request** → tự review diff của mình.

> Giữ đúng chuẩn của framework ở mọi task: **per-test data (parallel-safe)**, **không `sleep`**, **web-first assertion**, **có tag**.

---

## Task 1 — Accessibility testing (axe) · `S`

**Là gì / vì sao:** kiểm trang có lỗi tiếp cận (a11y) không — thiếu label, tương phản kém, thiếu alt… Rất "ăn điểm", ít người làm.

**Cài:**

```bash
npm i -D @axe-core/playwright
```

**Các bước:**

1. Tạo `tests/a11y/a11y.spec.ts`.
2. Chạy axe trên vài trang chính (home, login, basket).
3. Chạy lần đầu để **xem app có bao nhiêu vi phạm** → quyết định assert (giống pattern "probe trước").

**Code mẫu:**

```ts
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../src/fixtures/index.js';

test(
  'home page has no critical/serious a11y violations',
  { tag: ['@a11y', '@regression'] },
  async ({ page }) => {
    await page.goto('/#/search');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((v) =>
      ['critical', 'serious'].includes(v.impact ?? '')
    );
    expect(serious).toEqual([]); // app có lỗi thật -> có thể nới xuống 'critical' only, hoặc ghi FINDING
  }
);
```

**Xong khi:** có a11y spec chạy trên 2–3 trang, tích hợp vào suite. **Học được:** WCAG cơ bản, axe, cách đọc `violations`.

---

## Task 2 — `npm audit` + CodeQL trong CI · `S`

**Là gì / vì sao:** tự động soi **thư viện có lỗ hổng** (npm audit — A06) và **quét code tĩnh** (CodeQL — SAST). Tín hiệu bảo mật miễn phí.

**Các bước:**

1. **npm audit** — thêm 1 step vào `.github/workflows/smoke.yml`:
   ```yaml
   - name: Dependency audit
     run: npm audit --audit-level=high
   ```
2. **CodeQL** — cách dễ nhất: GitHub → **Settings → Code security → Code scanning → Set up → Default (CodeQL)**. GitHub tự tạo workflow quét mỗi push/PR. _(Hoặc tự thêm `.github/workflows/codeql.yml` dùng `github/codeql-action`.)_

**Xong khi:** CI có bước audit + tab **Security → Code scanning** hiện kết quả CodeQL. **Học được:** supply-chain security, SAST, DevSecOps cơ bản.

---

## Task 3 — Thêm 2 test `@security` · `S`

**Là gì / vì sao:** phủ thêm OWASP (A07/A05). Xem lý thuyết ở [security-testing.md](./security-testing.md).

**Các bước:** thêm vào `tests/security/security.spec.ts`, tái dùng fixtures.

**Code mẫu (defensive — kiểm app từ chối token hỏng):**

```ts
test(
  'a tampered JWT is rejected',
  { tag: ['@security', '@api', '@regression'] },
  async ({ basketApi, session }) => {
    basketApi.setToken(session.token.slice(0, -4) + 'AAAA'); // làm hỏng chữ ký
    const res = await basketApi.getRaw(session.bid);
    expect([401, 403]).toContain(res.status()); // server PHẢI từ chối
  }
);
```

Test thứ 2 — **security headers**: `GET /` rồi kiểm `res.headers()` (probe trước xem app trả gì, rồi assert + comment kỳ vọng).

**Xong khi:** 2 test `@security` mới xanh (suite 54 → 56). **Học được:** JWT validation, HTTP security headers.

---

## Task 4 — Test sharding trong CI · `S–M`

**Là gì / vì sao:** chia suite ra **nhiều runner song song** cho nhanh khi test ngày càng nhiều.

**Các bước (trong nightly):**

1. Thêm matrix chia phần:
   ```yaml
   strategy:
     matrix:
       shard: ['1/3', '2/3', '3/3']
   steps:
     - run: npx playwright test --grep @regression --shard=${{ matrix.shard }} --reporter=blob
     - uses: actions/upload-artifact@v4
       with: { name: blob-${{ strategy.job-index }}, path: blob-report }
   ```
2. Job sau **gộp report:** tải các `blob-*` về rồi `npx playwright merge-reports --reporter=html ./all-blobs`.

**Xong khi:** nightly chạy 3 shard song song, report gộp lại làm một. **Học được:** parallelization CI, blob report + merge.

---

## Task 5 — Coverage cho Profile management · `M`

**Là gì / vì sao:** lấp nốt flow P3 (đổi mật khẩu, đổi profile) — thêm chiều sâu thật.

**Các bước:**

1. **Probe** trang profile & change-password để lấy route/selector thật (đừng đoán):
   - Profile: khả năng `/#/profile`; đổi mật khẩu: `/#/privacy-security/change-password` → **xác nhận bằng probe**.
2. Viết POM `src/pages/profile/*` (theo mẫu POM hiện có).
3. Viết test, ưu tiên dùng lại pattern **"UI action → API verify"**: đổi mật khẩu qua UI → verify **login bằng mật khẩu mới thành công qua API**, mật khẩu cũ bị từ chối.
4. Tag `@regression`.

**Xong khi:** ~3–5 test profile xanh. **Học được:** mở rộng POM cho module mới + tái dùng pattern verify.

---

## Task 6 — Visual regression · `M`

**Là gì / vì sao:** chụp ảnh trang và so sánh giữa các lần chạy để bắt **UI drift** (lệch layout, mất element).

**Các bước:**

1. Dùng API sẵn có của Playwright: `await expect(page).toHaveScreenshot('login.png')`.
2. Chạy lần đầu để **tạo baseline** (Playwright tự sinh ảnh gốc), commit baseline.
3. Lần sau tự so sánh; muốn cập nhật có chủ đích: `--update-snapshots`.
4. Chọn trang **ổn định** (login, catalog); tag `@visual`, chạy **chromium-only**.

**Code mẫu:**

```ts
test('login page looks right', { tag: ['@visual'] }, async ({ page }) => {
  await page.goto('/#/login');
  await expect(page).toHaveScreenshot('login.png', { maxDiffPixelRatio: 0.02 });
});
```

> ⚠️ **Bẫy cần biết:** ảnh baseline **phụ thuộc OS/độ phân giải** — render trên Windows (máy bạn) khác Linux (CI). Nên **tạo baseline trong cùng môi trường CI** (hoặc trong Docker) để không đỏ giả. Đây chính là lý do nhiều team chạy visual test trong container.

**Xong khi:** vài visual test có baseline commit kèm. **Học được:** snapshot testing, quản lý baseline, gotcha cross-OS.

---

## Task 7 — OWASP ZAP baseline (DAST) trong nightly · `M`

**Là gì / vì sao:** thêm một lớp **quét động tự động** (DAST) — ZAP tự bò trang + quét thụ động, tìm lỗ hổng phổ biến. **Baseline = passive**, không tấn công phá hoại → an toàn cho môi trường của mình.

**Các bước (thêm 1 job vào nightly, chạy trên app local):**

```yaml
- run: docker compose up -d
- run: npm run app:wait
- name: ZAP baseline scan
  uses: zaproxy/action-baseline@v0.12.0
  with:
    target: 'http://localhost:3000'
```

Action sẽ tạo **report + issue** về các cảnh báo (thiếu header, cookie flags…). Đọc report → cái nào thật thì mở **bug report**.

**Xong khi:** nightly có job ZAP sinh report. **Học được:** DAST, kết hợp scanner với test tự viết.

---

## Thứ tự luyện gợi ý (từ dễ, ăn điểm nhanh → khó dần)

| Thứ tự | Task                        | Effort | Vì sao trước                                |
| ------ | --------------------------- | ------ | ------------------------------------------- |
| 1      | Task 1 — a11y (axe)         | S      | Dễ, tín hiệu cao, 1 buổi xong               |
| 2      | Task 3 — 2 test security    | S      | Tái dùng ngay kiến thức security-testing.md |
| 3      | Task 2 — npm audit + CodeQL | S      | Gần như bấm nút, thêm tín hiệu bảo mật      |
| 4      | Task 4 — sharding           | S–M    | Học cơ chế CI nâng cao                      |
| 5      | Task 5 — profile coverage   | M      | Áp dụng lại POM + UI→API verify             |
| 6      | Task 6 — visual regression  | M      | Học snapshot + gotcha môi trường            |
| 7      | Task 7 — ZAP baseline       | M      | Ghép scanner ngoài vào pipeline             |

Ước lượng: 3 task `S` đầu ≈ **1–2 buổi**; cả 7 ≈ **~1–1.5 tuần** ở nhịp 8–10h/tuần.

## Mẹo chung

- **Mỗi task một PR nhỏ** → dễ review, giống môi trường làm việc thật, và làm đẹp lịch sử commit.
- **Probe trước khi code** khi gặp selector/endpoint/tool mới — đừng đoán.
- **Chạy CI sau mỗi task** để chắc nó xanh trên cloud, không chỉ máy bạn.
- Task nào phát hiện lỗ hổng/bug → mở **bug report** trong [docs/bug-reports/](../bug-reports/) cho nhất quán.
- Cập nhật **số liệu** trong README/PORTFOLIO khi số test đổi (giữ trung thực).
