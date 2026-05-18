/**
 * Project key filter for Bài tập 6.1.
 * Đổi giá trị này và expression tương ứng trong manifest.yml trước khi deploy.
 */
export const TARGET_PROJECT_KEY = 'SCRUM';

/** Tên hiển thị trong nội dung comment (tên author trên Jira = tên app trong Developer Console). */
export const COMMENT_AUTHOR_LABEL = 'Auto Report';

/** Bài 6.5: dedup key + TTL 24h cho at-least-once delivery. */
export const DEDUP_KEY_PREFIX = 'dedupe:comment:';
export const DEDUP_TTL = { ttl: { unit: 'HOURS', value: 24 } };
