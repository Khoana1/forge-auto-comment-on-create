import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { DEDUP_KEY_PREFIX, DEDUP_TTL, TARGET_PROJECT_KEY } from '../config.js';
import { log } from './logger.js';
import { buildWelcomeCommentAdf } from './welcomeCommentAdf.js';
import { resolveReporterDisplayName } from './reporter.js';

export const dedupKeyFor = (issueKey) => `${DEDUP_KEY_PREFIX}${issueKey}`;

const addWelcomeComment = async (issueKey, reporterDisplayName) => {
  const body = buildWelcomeCommentAdf({
    reporterDisplayName,
    createdAt: new Date().toISOString(),
  });

  const res = await api.asApp().requestJira(
    route`/rest/api/3/issue/${issueKey}/comment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(
      `Thêm comment thất bại: HTTP ${res.status} - ${errBody.slice(0, 200)}`,
    );
  }

  return res.json();
};

/**
 * Bài 6.5 — xử lý idempotent cho một event issue created.
 * @returns {'comment_added'|'dedup_skip'|'skipped'} status
 */
export const processWelcomeComment = async (event, context) => {
  const issueKey = event?.issue?.key;
  const projectKey = event?.issue?.fields?.project?.key;

  if (!issueKey) {
    log('warn', 'Skipped: missing issueKey in event');
    return { status: 'skipped', reason: 'missing_issue_key' };
  }

  if (projectKey !== TARGET_PROJECT_KEY) {
    log('info', 'Skipped: project does not match target', {
      issueKey,
      projectKey,
      targetProject: TARGET_PROJECT_KEY,
    });
    return { status: 'skipped', reason: 'wrong_project', issueKey };
  }

  const dedupKey = dedupKeyFor(issueKey);
  if (await kvs.get(dedupKey)) {
    log('info', 'Dedup hit — skip comment (idempotent)', { issueKey, dedupKey });
    return { status: 'dedup_skip', issueKey, dedupKey };
  }

  await kvs.set(
    dedupKey,
    { processedAt: new Date().toISOString(), issueKey },
    DEDUP_TTL,
  );

  try {
    if (context?.simulateCommentFail) {
      throw new Error('simulateCommentFail: test rollback dedup key');
    }

    const reporterDisplayName = await resolveReporterDisplayName(event, issueKey);
    await addWelcomeComment(issueKey, reporterDisplayName);
    log('info', 'Welcome comment added', { issueKey, reporterDisplayName });
    return { status: 'comment_added', issueKey, reporterDisplayName };
  } catch (err) {
    await kvs.delete(dedupKey);
    log('error', 'addComment failed — dedup key removed for retry', {
      issueKey,
      dedupKey,
      error: err.message,
    });
    throw err;
  }
};
