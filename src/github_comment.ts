import { context, getOctokit } from '@actions/github';
import dedent from 'ts-dedent';
import { ResultResponse } from './api';
import { getSuiteRunDashboardUrl } from './url';

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
  # [Stably](https://stably.ai/) Runner - [Test Suite - '${testSuiteName}'](https://app.stably.ai/project/${projectId}/testSuite/${testSuiteId})

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
  const existingCommentId = comments.find(
    comment => comment?.body?.startsWith(commentIdentiifer)
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
    success?: boolean | undefined;
  }[];
  projectId: string;
}) {
  return tests
    .map(
      ({ runId, testName }) =>
        `  * [${testName}](http://app.stably.ai/project/${projectId}/g_${testSuiteRunId}/run/${runId})`
    )
    .join('\n');
}
