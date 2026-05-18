import api, { route } from '@forge/api';

/**
 * Event payload thường chỉ có reporter.accountId, không có displayName.
 */
export const resolveReporterDisplayName = async (event, issueKey) => {
  const reporter = event?.issue?.fields?.reporter;
  const creator = event?.issue?.fields?.creator;

  if (reporter?.displayName) return reporter.displayName;
  if (creator?.displayName) return creator.displayName;

  if (issueKey) {
    const fromIssueApi = await fetchReporterFromIssue(issueKey);
    if (fromIssueApi) return fromIssueApi;
  }

  return 'Không xác định';
};

const fetchReporterFromIssue = async (issueKey) => {
  try {
    const res = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}?fields=reporter`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields?.reporter?.displayName ?? null;
  } catch {
    return null;
  }
};
