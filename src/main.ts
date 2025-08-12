import { debug, setFailed, setOutput } from '@actions/core';
import { startTunnel } from '@stablyhq/runner-sdk';
import { startTestSuite, waitForTestSuiteRunResult } from './api';
import { fetchMetadata } from './fetch-metadata';
import { upsertGitHubComment } from './github_comment';
import { parseInput } from './input';
import { getSuiteRunDashboardUrl } from './url';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const {
      apiKey,
      urlReplacement,
      githubComment,
      githubToken,
      testSuiteId,
      runInAsyncMode,
      environment,
      variableOverrides,
      note
    } = parseInput();

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
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message);
  } finally {
    // Make sure the process exits
    // This is done to prevent the tunnel from hanging the thread
    process.exit();
  }
}
