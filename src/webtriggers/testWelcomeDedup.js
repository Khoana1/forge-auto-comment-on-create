import { TARGET_PROJECT_KEY } from '../config.js';
import { log } from '../lib/logger.js';
import { dedupKeyFor, processWelcomeComment } from '../lib/welcomeCommentService.js';
import { kvs } from '@forge/kvs';

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const getQueryParam = (request, name) => {
  const raw = request?.queryParameters?.[name];
  if (Array.isArray(raw)) return raw[0];
  return raw;
};

const buildEvent = (issueKey) => ({
  issue: {
    key: issueKey,
    fields: { project: { key: TARGET_PROJECT_KEY } },
  },
});

/**
 * Bài 6.5 — test idempotency: gọi handler 2 lần cùng issueKey (simulate at-least-once).
 *
 * forge tunnel +:
 *   forge webtrigger create -f test-welcome-dedup -s createforgeapp.atlassian.net -p Jira -e development
 *   curl -X POST "<url>?issueKey=SCRUM-XX"
 *
 * Kỳ vọng: run1=comment_added, run2=dedup_skip, Jira chỉ thêm tối đa 1 comment mới từ test này.
 *
 * Test rollback:
 *   curl -X POST "<url>?issueKey=SCRUM-XX&simulateCommentFail=true"
 * (issue chưa có dedup key; lần 1 fail + xóa key, gọi lại không có simulateCommentFail để retry)
 */
export const run = async (request, context) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  const issueKey = getQueryParam(request, 'issueKey');
  if (!issueKey) {
    return jsonResponse(400, { error: 'Missing query param: issueKey' });
  }

  const simulateCommentFail = getQueryParam(request, 'simulateCommentFail') === 'true';
  const resetDedup = getQueryParam(request, 'resetDedup') === 'true';
  const event = buildEvent(issueKey);

  if (resetDedup) {
    await kvs.delete(dedupKeyFor(issueKey));
    log('info', 'test-welcome-dedup: dedup key cleared for test', { issueKey });
  }

  log('info', 'test-welcome-dedup started', {
    issueKey,
    simulateCommentFail,
    resetDedup,
    dedupKey: dedupKeyFor(issueKey),
  });

  const invoke = async (runLabel) => {
    try {
      const result = await processWelcomeComment(event, {
        ...context,
        simulateCommentFail: simulateCommentFail && runLabel === 'run1',
      });
      return { ok: true, ...result };
    } catch (err) {
      return { ok: false, status: 'error', error: err.message, issueKey };
    }
  };

  const run1 = await invoke('run1');
  const run2 = await invoke('run2');

  const idempotentOk =
    run1.ok &&
    run1.status === 'comment_added' &&
    run2.ok &&
    run2.status === 'dedup_skip';

  const dedupKeyExists = Boolean(await kvs.get(dedupKeyFor(issueKey)));

  return jsonResponse(200, {
    issueKey,
    simulateCommentFail,
    run1,
    run2,
    idempotentOk,
    dedupKeyExists,
    hint: idempotentOk
      ? 'Đúng bài 6.5: lần 1 comment, lần 2 dedup_skip'
      : 'Nếu run1=dedup_skip: issue đã xử lý trước đó (tạo issue mới hoặc xóa dedup key trong KVS)',
  });
};
