# Bài tập CI — GitHub Actions

Project: `forge-auto-comment-on-create`

## Đã cấu hình

| Yêu cầu | File / lệnh |
|---------|-------------|
| Jest (≥5 tests) | `__tests__/validation.test.js` — **9 tests** |
| ESLint | `.eslintrc.cjs`, `npm run lint` |
| CI workflow | `.github/workflows/ci.yml` |
| 4 bước CI | Install → Lint → Unit tests → Build (`scripts/ci-forge-lint.js`) |

> App này **không có UI Kit frontend**. Bước **Build frontend** chạy Forge lint (validate `manifest.yml` + `src/`) qua `scripts/ci-forge-lint.js`.

> `npm run build:forge-cli` gọi `forge lint` trực tiếp (cần login + analytics consent). CI dùng script riêng để không cần Atlassian credentials.

## Chạy local

```bash
npm ci
npm run lint
npm test
npm run build
```

## Demo PR bị block khi test fail

1. Tạo branch mới từ PR đang pass:
   ```bash
   git checkout -b demo/ci-fail-test
   ```
2. Sửa tạm một test để fail, ví dụ trong `__tests__/validation.test.js`:
   ```js
   expect(validateIssueKey('SCRUM-42')).toEqual({ valid: false }); // cố ý sai
   ```
3. Push và mở PR — CI sẽ **fail** ở bước Unit tests.
4. Trên GitHub: bật **Require status checks** cho branch `main` → PR không merge được khi CI đỏ.
5. Revert test về đúng → CI pass lại.

## Branch protection (GitHub Settings)

Repository → Settings → Branches → Add rule cho `main`:

- Require a pull request before merging
- Require status checks to pass: **CI / quality**
