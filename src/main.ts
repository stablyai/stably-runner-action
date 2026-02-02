import { debug, setFailed, setOutput } from '@actions/core';
import { startTunnel } from '@stablyhq/runner-sdk';
import { fetchMetadata } from './github/fetch-metadata';
import {
  upsertGitHubComment,
  upsertGitHubCommentV2
} from './github/github_comment';
import { type ParsedInput, parseInput } from './input';
import {
  startTestSuite,
  waitForTestSuiteRunResult
} from './stably/api/agent-api';
import {
  startPlaywrightRun,
  waitForPlaywrightRunResult
} from './stably/api/playwright-api';
import { getSuiteRunDashboardUrl } from './stably/url';

type V1Input = Extract<ParsedInput, { version: 'v1' }>;
type V2Input = Extract<ParsedInput, { version: 'v2' }>;

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const input = parseInput();
    const { version } = input;

    await (version === 'v1' ? runV1(input) : runV2(input));
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message);
  } finally {
    // Make sure the process exits
    // This is done to prevent the tunnel from hanging the thread
    process.exit();
  }
}

async function runV1({
  apiKey,
  urlReplacement,
  githubComment,
  githubToken,
  testSuiteId,
  runInAsyncMode,
  environment,
  variableOverrides,
  note
}: V1Input): Promise<void> {
  const shouldTunnel =
    urlReplacement &&
    new URL(urlReplacement.replacement).hostname === 'localhost';

  if (urlReplacement && shouldTunnel) {
    const tunnel = await startTunnel(urlReplacement.replacement);
    urlReplacement.replacement = tunnel.url;
  }

  const githubMetadata = githubToken
    ? await fetchMetadata(githubToken)
    : undefined;
  const { testSuiteRunId } = await startTestSuite({
    testSuiteId,
    apiKey,
    options: {
      urlReplacement,
      environment,
      variableOverrides,
      note
    },
    githubMetadata
  });
  setOutput('testSuiteRunId', testSuiteRunId);

  if (runInAsyncMode) {
    return;
  }

  try {
    const runResult = await waitForTestSuiteRunResult({
      testSuiteRunId,
      apiKey
    });
    const numFailedTests = runResult.results.filter(
      ({ status }) => status === 'FAILED'
    ).length;
    setOutput('success', numFailedTests === 0);
    if (numFailedTests > 0) {
      const suiteRunDashboardUrl = getSuiteRunDashboardUrl({
        projectId: runResult.projectId,
        testSuiteRunId
      });

      setFailed(
        `Test suite run failed (${numFailedTests}/${runResult.results.length} tests). [Dashboard](${suiteRunDashboardUrl})`
      );
    }

    // Github Comment Code
    if (githubComment && githubToken) {
      await upsertGitHubComment(testSuiteId, githubToken, {
        result: runResult
      });
    }
  } catch (e) {
    debug(`API call error: ${e}`);
    setFailed(e instanceof Error ? e.message : `An unknown error occurred`);
  }
}

async function runV2({
  apiKey,
  projectId,
  playwrightProjectName,
  githubComment,
  githubToken,
  runInAsyncMode,
  envOverrides
}: V2Input): Promise<void> {
  const { runId } = await startPlaywrightRun({
    projectId,
    apiKey,
    options: {
      playwrightProjectName,
      envOverrides
    }
  });
  setOutput('testSuiteRunId', runId);

  if (runInAsyncMode) {
    return;
  }

  try {
    const runResult = await waitForPlaywrightRunResult({
      projectId,
      runId,
      apiKey
    });

    const numFailedTests =
      runResult.results?.testCases.filter(({ status }) => status === 'FAILED')
        .length ?? 0;
    const totalTests = runResult.results?.testCases.length ?? 0;

    setOutput('success', numFailedTests === 0 && runResult.status === 'PASSED');

    if (numFailedTests > 0 || runResult.status !== 'PASSED') {
      setFailed(
        `Playwright test run failed (${numFailedTests}/${totalTests} tests failed, status: ${runResult.status}). [Dashboard](https://app.stably.ai/project/${projectId}/playwright/history/${runId}?tab=specs)`
      );
    }

    // Github Comment Code
    if (githubComment && githubToken) {
      await upsertGitHubCommentV2(
        projectId,
        runId,
        githubToken,
        {
          result: runResult
        },
        playwrightProjectName
      );
    }
  } catch (e) {
    debug(`API call error: ${e}`);
    setFailed(e instanceof Error ? e.message : `An unknown error occurred`);
  }
}
