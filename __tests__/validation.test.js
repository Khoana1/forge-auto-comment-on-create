import {
  parseQueryParam,
  validateDedupTestRequest,
  validateIssueCreatedEvent,
  validateIssueKey,
  validateProjectKey,
} from '../src/lib/validation.js';
import { TARGET_PROJECT_KEY } from '../src/config.js';

describe('validateIssueKey', () => {
  test('rejects empty issue key', () => {
    expect(validateIssueKey('')).toEqual({ valid: false, reason: 'missing_issue_key' });
    expect(validateIssueKey('   ')).toEqual({ valid: false, reason: 'missing_issue_key' });
  });

  test('accepts trimmed issue key', () => {
    // DEMO: cố ý fail để verify PR bị block khi CI đỏ — revert sau khi demo xong.
    expect(validateIssueKey('  SCRUM-42  ')).toEqual({
      valid: false,
      reason: 'missing_issue_key',
    });
  });
});

describe('validateProjectKey', () => {
  test('rejects wrong project', () => {
    expect(validateProjectKey('DEV', TARGET_PROJECT_KEY)).toEqual({
      valid: false,
      reason: 'wrong_project',
      projectKey: 'DEV',
      targetProjectKey: TARGET_PROJECT_KEY,
    });
  });

  test('accepts target project', () => {
    expect(validateProjectKey(TARGET_PROJECT_KEY, TARGET_PROJECT_KEY)).toEqual({
      valid: true,
      projectKey: TARGET_PROJECT_KEY,
    });
  });
});

describe('validateIssueCreatedEvent', () => {
  const validEvent = {
    issue: {
      key: 'SCRUM-1',
      fields: { project: { key: TARGET_PROJECT_KEY } },
    },
  };

  test('rejects event without issue key', () => {
    expect(validateIssueCreatedEvent({ issue: { fields: {} } }, TARGET_PROJECT_KEY)).toEqual({
      valid: false,
      reason: 'missing_issue_key',
    });
  });

  test('accepts valid issue created event', () => {
    expect(validateIssueCreatedEvent(validEvent, TARGET_PROJECT_KEY)).toEqual({
      valid: true,
      issueKey: 'SCRUM-1',
      projectKey: TARGET_PROJECT_KEY,
    });
  });
});

describe('validateDedupTestRequest', () => {
  test('rejects non-POST methods', () => {
    expect(validateDedupTestRequest('GET', 'SCRUM-1')).toEqual({
      valid: false,
      statusCode: 405,
      error: 'Method Not Allowed',
    });
  });

  test('rejects POST without issueKey', () => {
    expect(validateDedupTestRequest('POST', undefined)).toEqual({
      valid: false,
      statusCode: 400,
      error: 'Missing query param: issueKey',
    });
  });
});

describe('parseQueryParam', () => {
  test('returns first value when param is array', () => {
    expect(
      parseQueryParam({ queryParameters: { issueKey: ['SCRUM-9', 'ignored'] } }, 'issueKey'),
    ).toBe('SCRUM-9');
  });
});
