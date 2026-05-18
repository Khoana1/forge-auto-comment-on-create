import { log } from '../lib/logger.js';
import { processWelcomeComment } from '../lib/welcomeCommentService.js';

/**
 * Event trigger — avi:jira:created:issue (Bài 6.1 + 6.5)
 */
export const run = async (event, context) => {
  const issueKey = event?.issue?.key;
  const projectKey = event?.issue?.fields?.project?.key;

  log('info', 'welcomeComment trigger fired', {
    issueKey,
    projectKey,
    accountId: context?.accountId,
  });

  await processWelcomeComment(event, context);
};
