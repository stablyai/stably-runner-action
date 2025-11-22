import { context, getOctokit } from '@actions/github';
import dedent from 'ts-dedent';
import type { ResultResponse } from '../stably/api/agent-api';
import type { PlaywrightResultResponse } from '../stably/api/playwright-api';
import { getSuiteRunDashboardUrl } from '../stably/url';

export async function upsertGitHubComment(
  testSuiteId: string,
  githubToken: string,
  resp: { result?: ResultResponse; error?: boolean }
) {
  const octokit = getOctokit(githubToken);

  const projectId = resp.result?.projectId || '';
  const testSuiteRunId = resp.result?.testSuiteRunId || '';
  const testSuiteName = resp.result?.testSuiteName || '';
  const results = resp.result?.results || [];
  const failedTests = results.filter(x => x.status === 'FAILED');
  const successTests = results.filter(
    x => x.status === 'PASSED' || x.status === 'FLAKY'
  );
  const undefinedTests = results.filter(x => x.status === 'ERROR');

  const commentIdentiifer = `<!-- stably_${testSuiteId} -->`;
  const suiteRunDashboardUrl = getSuiteRunDashboardUrl({
    projectId,
    testSuiteRunId
  });

  // prettier-ignore
  const body = dedent`${commentIdentiifer}
  # Stably Runner - [Test Suite - '${testSuiteName}'](https://app.stably.ai/project/${projectId}/testSuite/${testSuiteId})

  Test Suite Run Result: ${
    resp.error
      ? '❌ Error - The Action ran into an error while calling the Stably backend. Please re-run'
      : failedTests.length === 0
        ? `🟢 Success (${successTests.length}/${results.length} tests passed) [[dashboard]](${suiteRunDashboardUrl})`
        : `🔴 Failure (${failedTests.length}/${results.length} tests failed) [[dashboard]](${suiteRunDashboardUrl})`
  }
  

  ${
    failedTests.length > 0
      ? dedent`Failed Tests:
      ${listTestMarkDown({ testSuiteRunId, tests: failedTests, projectId })}`
      : ''
  }

  ${
    undefinedTests.length > 0
      ? dedent`Unable to run tests:
      ${listTestMarkDown({ testSuiteRunId, tests: undefinedTests, projectId })}`
      : ''
  }
  
  
  ---
  _This comment was generated from [stably-runner-action](https://github.com/marketplace/actions/stably-runner)_
`;

  // Check if existing comment exists
  const commitSha = context.payload.after || context.sha;
  const { data: comments } = context.payload.pull_request
    ? await octokit.rest.issues
        .listComments({
          ...context.repo,
          issue_number: context.payload.pull_request.number
        })
        .catch(() => {
          return { data: [] };
        })
    : commitSha
      ? await octokit.rest.repos
          .listCommentsForCommit({
            ...context.repo,
            commit_sha: context.payload.after
          })
          .catch(() => {
            return { data: [] };
          })
      : { data: [] };
  const existingCommentId = comments.find(comment =>
    comment?.body?.startsWith(commentIdentiifer)
  )?.id;

  // Create or update commit/PR comment
  if (context.payload.pull_request) {
    if (existingCommentId) {
      await octokit.rest.issues.updateComment({
        ...context.repo,
        comment_id: existingCommentId,
        body
      });
    } else {
      await octokit.rest.issues.createComment({
        ...context.repo,
        body,
        issue_number: context.payload.pull_request.number
      });
    }
  } else if (commitSha) {
    if (existingCommentId) {
      await octokit.rest.repos.updateCommitComment({
        ...context.repo,
        comment_id: existingCommentId,
        body
      });
    } else {
      await octokit.rest.repos.createCommitComment({
        ...context.repo,
        body,
        commit_sha: commitSha
      });
    }
  }
}

function listTestMarkDown({
  testSuiteRunId,
  tests,
  projectId
}: {
  testSuiteRunId: string;
  tests: {
    runId: string;
    testName: string;
    testId: string;
    success?: boolean;
  }[];
  projectId: string;
}) {
  return tests
    .map(
      ({ runId, testName }) =>
        `  * [${testName}](http://app.stably.ai/project/${projectId}/history/g_${testSuiteRunId}/run/${runId})`
    )
    .join('\n');
}

export async function upsertGitHubCommentV2(
  projectId: string,
  runId: string,
  githubToken: string,
  resp: { result?: PlaywrightResultResponse; error?: boolean },
  runGroupNames?: string[]
) {
  const octokit = getOctokit(githubToken);

  const result = resp.result;
  const testCases = result?.results?.testCases || [];
  const failedTests = testCases.filter(x => x.status === 'FAILED');
  const passedTests = testCases.filter(x => x.status === 'PASSED');
  const skippedTests = testCases.filter(x => x.status === 'SKIPPED');

  const commentIdentiifer = `<!-- stably_playwright_${projectId} -->`;
  const dashboardUrl = `https://app.stably.ai/project/${projectId}/playwright/history/${runId}?tab=specs`;

  // prettier-ignore
  const body = dedent`${commentIdentiifer}
  # Stably Runner${runGroupNames?.length === 1 ? ` - Run Group '${runGroupNames[0]}'` : ''}

  Test Run Result: ${
    resp.error
      ? '❌ Error - The Action ran into an error while calling the Stably backend. Please re-run'
      : failedTests.length === 0 && result?.status === 'PASSED'
        ? `🟢 Success (${passedTests.length}/${testCases.length} tests passed) [[dashboard]](${dashboardUrl})`
        : `🔴 Failure (${failedTests.length}/${testCases.length} tests failed, status: ${result?.status}) [[dashboard]](${dashboardUrl})`
  }
  

  ${
    failedTests.length > 0
      ? dedent`Failed Tests:
      ${failedTests.map(t => `  * ${t.title} (${t.durationMs ? `${t.durationMs}ms` : 'N/A'})`).join('\n')}`
      : ''
  }

  ${
    skippedTests.length > 0
      ? dedent`Skipped Tests:
      ${skippedTests.map(t => `  * ${t.title}`).join('\n')}`
      : ''
  }
  
  
  ---
  _This comment was generated from [stably-runner-action](https://github.com/marketplace/actions/stably-runner)_
`;

  // Check if existing comment exists
  const commitSha = context.payload.after || context.sha;
  const { data: comments } = context.payload.pull_request
    ? await octokit.rest.issues
        .listComments({
          ...context.repo,
          issue_number: context.payload.pull_request.number
        })
        .catch(() => {
          return { data: [] };
        })
    : commitSha
      ? await octokit.rest.repos
          .listCommentsForCommit({
            ...context.repo,
            commit_sha: commitSha
          })
          .catch(() => {
            return { data: [] };
          })
      : { data: [] };
  const existingCommentId = comments.find(comment =>
    comment?.body?.startsWith(commentIdentiifer)
  )?.id;

  // Create or update commit/PR comment
  if (context.payload.pull_request) {
    if (existingCommentId) {
      await octokit.rest.issues.updateComment({
        ...context.repo,
        comment_id: existingCommentId,
        body
      });
    } else {
      await octokit.rest.issues.createComment({
        ...context.repo,
        body,
        issue_number: context.payload.pull_request.number
      });
    }
  } else if (commitSha) {
    if (existingCommentId) {
      await octokit.rest.repos.updateCommitComment({
        ...context.repo,
        comment_id: existingCommentId,
        body
      });
    } else {
      await octokit.rest.repos.createCommitComment({
        ...context.repo,
        body,
        commit_sha: commitSha
      });
    }
  }
}
