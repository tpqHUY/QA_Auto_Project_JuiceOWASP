# CI/CD trong project này — và cách setup cho project automation khác

> Note cho người mới, học từ thực tế. Nửa đầu: **CI của project này hoạt động ra sao** (2 workflow GitHub Actions). Nửa sau: **bản chất + công thức tái dùng** để sau này project automation nào bạn cũng tự dựng được CI.

**CI** (Continuous Integration) = mỗi khi có thay đổi code, **máy trên cloud tự chạy test** → biết ngay có vỡ gì không.
**CD** (Continuous Delivery/Deployment) = sau khi CI xanh, **tự đưa artifact ra ngoài** (ở đây: publish Allure report lên GitHub Pages).

> 🔗 **Xem CI được dựng thực tế theo tiến trình:** [Tuần 4 — CI smoke](../processes/week4-process.md) (Bước 7) và [Tuần 5 — nightly + Allure→Pages](../processes/week5-process.md) (Bước 4). Môi trường mà CI dựng lên (Docker) giải thích ở [docs/setup/docker.md](./docker.md).

---

## 1. Khái niệm nền (5 từ khoá)

| Khái niệm    | Là gì                                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| **Workflow** | 1 file `.yml` trong `.github/workflows/` = 1 quy trình tự động                  |
| **Trigger**  | Điều kiện chạy workflow: `push`, `pull_request`, `schedule` (cron), thủ công    |
| **Job**      | 1 khối chạy trên **1 máy ảo riêng** (runner). Nhiều job chạy song song/nối tiếp |
| **Step**     | 1 lệnh trong job: `run: <shell>` hoặc `uses: <action>` (khối dựng sẵn)          |
| **Runner**   | Máy ảo GitHub cấp (vd `ubuntu-latest`) — sạch trơn mỗi lần chạy                 |
| **Artifact** | File xuất ra khi chạy (report/trace) để tải về xem                              |

Cấu trúc: **Workflow → (nhiều) Job → (nhiều) Step**.

---

## 2. Hai workflow của project (giải mã)

### 2.1 `smoke.yml` — nhanh, chạy MỖI push/PR

```yaml
on:
  push: { branches: [main, master] }
  pull_request:
  workflow_dispatch: # cho bấm chạy tay
jobs:
  smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4 # (1) lấy code
      - uses: actions/setup-node@v4 # (2) cài Node + cache npm
        with: { node-version: 20, cache: npm }
      - run: npm ci # (3) cài deps đúng lockfile
      - uses: actions/cache@v4 # (4) cache browser Playwright
        with: { path: ~/.cache/ms-playwright, key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }} }
      - run: npx playwright install --with-deps chromium # (5) cài browser + lib hệ thống
      - run: docker compose up -d # (6) dựng app (Juice Shop)
      - run: npm run app:wait # (7) chờ app sẵn sàng
      - run: npx playwright test --grep @smoke --project=chromium # (8) chạy subset nhanh
      - if: always()
        run: docker compose down # (9) luôn dọn app
      - if: failure() # (10) fail thì upload report để debug
        uses: actions/upload-artifact@v4
        with: { name: playwright-report, path: "playwright-report/\ntest-results/", retention-days: 7 }
```

**Ý đồ từng phần:**

- **(1)–(3)** khung chuẩn mọi CI Node: lấy code → cài Node (cache npm cho nhanh) → `npm ci` (dùng `ci` chứ không `install` để bám đúng `package-lock.json`, tái lập được).
- **(4)–(5)** cache **browser** Playwright (nặng ~100MB) theo hash lockfile → lần sau khỏi tải lại. `--with-deps` cài luôn thư viện OS mà browser cần.
- **(6)–(7)** dựng SUT bằng Docker + **chờ ready** (không `sleep`). Chi tiết ở [docker.md](./docker.md).
- **(8)** chỉ chạy `@smoke` trên chromium → **nhanh** (mục tiêu của smoke: feedback tức thì).
- **(9)** `if: always()` → dọn app kể cả khi test đỏ.
- **(10)** `if: failure()` → chỉ upload report/trace khi có lỗi (chạy xanh thì khỏi, cho gọn).

### 2.2 `nightly-regression.yml` — sâu, chạy theo LỊCH

Khác biệt chính so với smoke:

```yaml
on:
  schedule: [{ cron: '0 18 * * *' }] # 18:00 UTC ≈ 01:00 VN
  workflow_dispatch:
permissions: # quyền tối thiểu để deploy Pages
  contents: read
  pages: write
  id-token: write
concurrency: { group: pages } # không cho 2 lần deploy đè nhau
jobs:
  regression: # chạy FULL @regression trên CẢ 3 browser + build Allure
    outputs: { result: '${{ steps.regression.outcome }}' }
    steps:
      # ... setup giống smoke, thêm:
      - uses: actions/setup-java@v4 # Allure CLI cần Java (JRE)
        with: { distribution: temurin, java-version: 21 }
      - run: npx playwright install --with-deps chromium firefox webkit # CẢ 3 engine
      - id: regression
        run: npx playwright test --grep @regression
        continue-on-error: true # KHÔNG fail job ngay -> để còn deploy report
      # ... generate Allure (giữ history qua actions/cache) -> upload-pages-artifact
  deploy: # đẩy report lên GitHub Pages
    needs: regression
    if: always()
    environment: { name: github-pages }
    steps: [{ uses: actions/deploy-pages@v4 }]
  status: # báo đỏ nếu có test fail (report vẫn đã publish)
    needs: regression
    if: always()
    steps:
      - if: "${{ needs.regression.outputs.result == 'failure' }}"
        run: exit 1
```

**3 điểm kỹ thuật đáng học:**

1. **Pattern "continue-on-error → publish → fail ở job riêng":** muốn report **luôn được publish** dù test đỏ, nhưng overall run vẫn **đỏ** để cảnh báo → tách việc "báo đỏ" sang job `status`.
2. **`permissions` least-privilege + `id-token: write`:** deploy Pages qua cơ chế chính thức cần đúng quyền, không hơn.
3. **`concurrency`:** chặn 2 lần deploy chồng nhau.

---

## 3. Bản chất: một CI cho automation cần gì (áp dụng project nào cũng đúng)

Bỏ qua chi tiết Juice Shop, mọi CI test tự động đều xoay quanh **6 câu hỏi**:

| #   | Câu hỏi                            | Cách project này trả lời                                     |
| --- | ---------------------------------- | ------------------------------------------------------------ |
| 1   | **Khi nào chạy?** (trigger)        | push/PR → smoke nhanh; cron → regression sâu                 |
| 2   | **Chạy trên môi trường nào?**      | runner sạch + **Docker dựng SUT** (tái lập được)             |
| 3   | **SUT lấy đâu ra?**                | `docker compose up` + `wait-for-app`                         |
| 4   | **Chạy bao nhiêu test?** (phạm vi) | tag: `@smoke` cho push, `@regression` cho nightly            |
| 5   | **Làm sao nhanh?**                 | cache deps (npm) + cache browser; song song (workers/matrix) |
| 6   | **Xong thì sao?** (kết quả)        | artifact khi fail + publish report (CD)                      |

Nắm 6 câu này là **thiết kế được CI cho bất kỳ project automation nào**.

---

## 4. Recipe tái dùng — khung workflow tối thiểu cho project mới

Copy khung này rồi điền vào chỗ `# TODO`:

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request:
  workflow_dispatch:
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      # 1) DỰNG SUT — chọn 1 trong 3 tuỳ project (xem mục 5)
      #    docker compose up -d   |   services: (DB)   |   dùng BASE_URL staging (bỏ bước này)
      - run: docker compose up -d # TODO: hoặc bỏ nếu test chống staging
      - run: npm run wait-for-app # TODO: script chờ SUT ready (đừng sleep)
      # 2) CHẠY TEST
      - run: npm test # TODO: --grep @smoke nếu muốn subset nhanh
      # 3) DỌN + ARTIFACT
      - if: always()
        run: docker compose down
      - if: failure()
        uses: actions/upload-artifact@v4
        with: { name: report, path: report/, retention-days: 7 }
```

Muốn **đa trình duyệt/đa OS** thì thêm `strategy.matrix`:

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
steps:
  - run: npx playwright test --project=${{ matrix.browser }}
```

---

## 5. SUT lấy đâu ra? — 4 tình huống thường gặp

Đây là chỗ khác nhau nhất giữa các project. Chọn đúng kiểu:

| Loại SUT                                      | Cách dựng trong CI                                                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **App có Docker image sẵn** (như project này) | `docker compose up -d` — đơn giản nhất                                                                                        |
| **App của chính bạn (có source)**             | `docker build` rồi run, HOẶC chạy trực tiếp (`npm start &`) + wait                                                            |
| **Cần DB/Redis kèm theo**                     | Dùng **`services:`** trong job (GitHub tự dựng container DB), vd `services: { postgres: { image: postgres:16, env: {...} } }` |
| **Test chống staging/prod có sẵn**            | KHÔNG dựng gì — chỉ cần `BASE_URL` (để trong **Secrets/Variables**), test chạy thẳng vào URL đó                               |

Nguyên tắc chung dù kiểu nào: **dựng xong phải CHỜ ready** (health/endpoint), rồi mới test.

---

## 6. Checklist setup CI cho project automation mới

- [ ] Tạo `.github/workflows/ci.yml` (bắt đầu từ recipe mục 4).
- [ ] Trigger: push/PR (nhanh) + `schedule` (sâu) + `workflow_dispatch` (chạy tay).
- [ ] `npm ci` (không `install`) + cache deps/browser.
- [ ] Dựng SUT theo đúng loại (mục 5) + **wait-for-ready**.
- [ ] Phân tầng phạm vi bằng **tag** (`@smoke` per-push, full khi nightly).
- [ ] `timeout-minutes` cho job (tránh treo đốt phút CI).
- [ ] Upload **artifact khi fail** (report/trace) để debug.
- [ ] Bí mật (token/URL) để trong **Settings → Secrets**, không hardcode.
- [ ] `permissions` tối thiểu; chỉ mở `pages/id-token` khi cần deploy.
- [ ] (Nếu có report) publish CD (Pages/artifact) + pattern `continue-on-error → publish → fail`.
- [ ] Thêm **badge** vào README để thấy trạng thái xanh/đỏ.

---

## 7. Cheat-sheet

- **CI** = tự chạy test trên cloud theo trigger; **CD** = tự publish artifact sau đó.
- File nằm ở `.github/workflows/*.yml`; cấu trúc **Workflow → Job → Step**; runner sạch mỗi lần.
- Project này: **smoke** (push, nhanh, chromium, @smoke) + **nightly** (cron, sâu, 3 browser, @regression, Allure→Pages).
- 6 câu hỏi lõi: **khi nào chạy / môi trường / lấy SUT / phạm vi / tốc độ / kết quả**.
- Tái dùng: copy recipe (mục 4), chọn cách dựng SUT (mục 5), theo checklist (mục 6).
- Vàng: `npm ci` + cache + wait-for-ready + tag + artifact-on-fail + secrets + least-privilege.

> Liên kết: cách CI này ra đời trong [Tuần 4](../processes/week4-process.md) & [Tuần 5](../processes/week5-process.md); môi trường Docker mà nó dựng ở [docker.md](./docker.md).
