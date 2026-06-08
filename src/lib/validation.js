/**
 * Pure validation helpers — unit-testable, dùng trong trigger handler và webtrigger.
 */

export const validateIssueKey = (issueKey) => {
  if (typeof issueKey !== 'string' || !issueKey.trim()) {
    return { valid: false, reason: 'missing_issue_key' };
  }
  return { valid: true, issueKey: issueKey.trim() };
};

export const validateProjectKey = (projectKey, targetProjectKey) => {
  if (!projectKey) {
    return { valid: false, reason: 'missing_project_key' };
  }
  if (projectKey !== targetProjectKey) {
    return {
      valid: false,
      reason: 'wrong_project',
      projectKey,
      targetProjectKey,
    };
  }
  return { valid: true, projectKey };
};

/** Validate event avi:jira:created:issue trước khi xử lý comment. */
export const validateIssueCreatedEvent = (event, targetProjectKey) => {
  const issueKey = event?.issue?.key;
  const projectKey = event?.issue?.fields?.project?.key;

  const keyCheck = validateIssueKey(issueKey);
  if (!keyCheck.valid) {
    return keyCheck;
  }

  const projectCheck = validateProjectKey(projectKey, targetProjectKey);
  if (!projectCheck.valid) {
    return projectCheck;
  }

  return {
    valid: true,
    issueKey: keyCheck.issueKey,
    projectKey: projectCheck.projectKey,
  };
};

/** Validate webtrigger test dedup (POST + issueKey bắt buộc). */
export const validateDedupTestRequest = (method, issueKey) => {
  if (method !== 'POST') {
    return { valid: false, statusCode: 405, error: 'Method Not Allowed' };
  }

  const keyCheck = validateIssueKey(issueKey);
  if (!keyCheck.valid) {
    return {
      valid: false,
      statusCode: 400,
      error: 'Missing query param: issueKey',
    };
  }

  return { valid: true, issueKey: keyCheck.issueKey };
};

/** Parse query param từ Forge webtrigger request. */
export const parseQueryParam = (request, name) => {
  const raw = request?.queryParameters?.[name];
  if (Array.isArray(raw)) return raw[0];
  return raw;
};
