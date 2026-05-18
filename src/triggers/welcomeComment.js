import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { TARGET_PROJECT_KEY } from '../config.js';
import { log } from '../lib/logger.js';
import { buildWelcomeCommentAdf } from '../lib/welcomeCommentAdf.js';
import { resolveReporterDisplayName } from '../lib/reporter.js';

const dedupKeyFor = (issueKey) => `processed:welcome-comment:${issueKey}`;

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
 * Event trigger handler — avi:jira:created:issue
 * Bài tập 6.1: auto comment + idempotency
 */
export const run = async (event, context) => {
  const issueKey = event?.issue?.key;
  const projectKey = event?.issue?.fields?.project?.key;
  log('info', 'welcomeComment trigger fired', {
    issueKey,
    projectKey,
    accountId: context?.accountId,
  });

  if (!issueKey) {
    log('warn', 'Skipped: missing issueKey in event');
    return;
  }

  // Handler-side validation (bổ sung cho filter.expression server-side)
  if (projectKey !== TARGET_PROJECT_KEY) {
    log('info', 'Skipped: project does not match target', {
      issueKey,
      projectKey,
      targetProject: TARGET_PROJECT_KEY,
    });
    return;
  }

  const dedupKey = dedupKeyFor(issueKey);
  const alreadyProcessed = await kvs.get(dedupKey);

  if (alreadyProcessed) {
    log('info', 'Duplicate event, skipping (idempotent)', { issueKey });
    return;
  }

  await kvs.set(
    dedupKey,
    { processedAt: new Date().toISOString(), issueKey },
    { ttl: { unit: 'DAYS', value: 7 } },
  );

  try {
    const reporterDisplayName = await resolveReporterDisplayName(event, issueKey);
    await addWelcomeComment(issueKey, reporterDisplayName);
    log('info', 'Welcome comment added', { issueKey, reporterDisplayName });
  } catch (err) {
    await kvs.delete(dedupKey);
    log('error', 'Welcome comment failed, dedup key cleared for retry', {
      issueKey,
      error: err.message,
    });
    throw err;
  }
};
