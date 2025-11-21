import { debug } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/lib/auth';
import type { GithubMetadata } from './fetch-metadata';

export type TestStatus =
  | 'PASSED'
  | 'FAILED'
  | 'RUNNING'
  | 'ERROR'
  | 'FLAKY'
  | 'CANCELLED'
  | 'SKIPPED';

type RunResponse = {
  projectId: string;
  testSuiteRunId: string;
  testSuiteName: string;
};

export type ResultResponse = RunResponse & {
  results: {
    runId: string;
    testId: string;
    testName: string;
    status?: TestStatus;
  }[];
};

// V2 Playwright Runner Types
type PlaywrightRunResponse = {
  runId: string;
};

type PlaywrightRunStatus =
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'TIMEDOUT'
  | 'CANCELLED'
  | 'INTERRUPTED';

type PlaywrightTestCaseStatus =
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'TIMEDOUT'
  | 'SKIPPED'
  | 'INTERRUPTED';

export type PlaywrightResultResponse = {
  status: PlaywrightRunStatus;
  startedAt: string;
  finishedAt?: string;
  results?: {
    testCases: {
      title: string;
      status: PlaywrightTestCaseStatus;
      durationMs?: number;
    }[];
  };
};

type StatusResponse = {
  status: 'RUNNING' | 'FINISHED';
};

const API_ENDPOINT = process.env.STABLY_API_ENDPOINT || 'https://api.stably.ai';
const POLLING_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

const unpackOrThrow = <T>(
  { statusCode, result }: { statusCode: number; result: T | null },
  apiName?: string
) => {
  debug(`${apiName || 'API call'} Response StatusCode: ${statusCode}`);

  // Check for invalid status code or no result
  if (statusCode < 200 || statusCode >= 300 || !result) {
    // Throw nicer message for auth issues
    if (statusCode === 401) {
      throw new Error('Invalid API key (unable to authenticate)');
    }
    throw new Error(
      `${apiName || 'API call'} failed with status code ${statusCode}`
    );
  }

  return result;
};

export async function startTestSuite({
  testSuiteId,
  apiKey,
  options,
  githubMetadata
}: {
  testSuiteId: string;
  apiKey: string;
  options: {
    urlReplacement?: { original: string; replacement: string };
    environment?: string;
    variableOverrides?: Record<
      string,
      string | { value: string | object; sensitive?: boolean }
    >;
    note?: string;
  };
  githubMetadata?: GithubMetadata;
}): Promise<RunResponse> {
  const httpClient = new HttpClient('github-action', [
    new BearerCredentialHandler(apiKey)
  ]);

  debug(`Github Metadata: ${JSON.stringify(githubMetadata)}`);

  const body = {
    urlReplacements: options.urlReplacement
      ? [options.urlReplacement]
      : undefined,
    metadata: githubMetadata
      ? { git: { branch: githubMetadata.branch }, note: options.note }
      : undefined,
    environment: options.environment ? options.environment : undefined,
    variableOverrides: options.variableOverrides
      ? options.variableOverrides
      : undefined
  };

  const runUrl = new URL(`/v1/testSuite/${testSuiteId}/run`, API_ENDPOINT).href;
  const runResponse = await httpClient.postJson<RunResponse>(runUrl, body, {
    'Content-Type': 'application/json'
  });
  return unpackOrThrow(runResponse, 'testSuiteRun');
}

export async function waitForTestSuiteRunResult({
  testSuiteRunId,
  apiKey
}: {
  testSuiteRunId: string;
  apiKey: string;
}): Promise<ResultResponse> {
  const httpClient = new HttpClient('github-action', [
    new BearerCredentialHandler(apiKey)
  ]);

  debug(`Starting to poll for testSuiteRunId: ${testSuiteRunId}`);

  const statusUrl = new URL(
    `/v1/testSuiteRun/${testSuiteRunId}/status`,
    API_ENDPOINT
  ).href;

  // Start polling for status
  const pollStartEpochMs = Date.now(); // Record the start time
  while (true) {
    // Check for timeout
    if (Date.now() - pollStartEpochMs > POLLING_TIMEOUT_MS) {
      throw new Error(
        `Polling for test suite run status timed out after 24 hours for testSuiteRunId: ${testSuiteRunId}`
      );
    }

    const testSuiteRunStatusResponse =
      await httpClient.getJson<StatusResponse>(statusUrl);
    const testSuiteRunStatus = unpackOrThrow(
      testSuiteRunStatusResponse,
      'testSuiteRunStatus'
    );

    if (testSuiteRunStatus.status === 'FINISHED') {
      break; // Exit loop if finished
    }

    // Wait for 5 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 5000));
    debug(`Polling status for testSuiteRunId: ${testSuiteRunId}`);
  }
  // At this point, testSuiteRunStatus.status is 'FINISHED'

  const resultUrl = new URL(
    `/v1/testSuiteRun/${testSuiteRunId}/result`,
    API_ENDPOINT
  ).href;
  const testSuiteRunResultResponse =
    await httpClient.getJson<ResultResponse>(resultUrl);
  return unpackOrThrow(testSuiteRunResultResponse, 'testSuiteRunResult');
}

// V2 Playwright Runner API Functions

export async function startPlaywrightRun({
  projectId,
  apiKey,
  options
}: {
  projectId: string;
  apiKey: string;
  options: {
    runGroupNames?: string[];
    envOverrides?: Record<string, string>;
  };
}): Promise<PlaywrightRunResponse> {
  const httpClient = new HttpClient('github-action', [
    new BearerCredentialHandler(apiKey)
  ]);

  const body = {
    runGroupName: options.runGroupNames,
    envOverrides: options.envOverrides
  };

  const runUrl = new URL(`/v1/projects/${projectId}/runs`, API_ENDPOINT).href;
  const runResponse = await httpClient.postJson<PlaywrightRunResponse>(
    runUrl,
    body,
    {
      'Content-Type': 'application/json'
    }
  );
  return unpackOrThrow(runResponse, 'playwrightRun');
}

export async function waitForPlaywrightRunResult({
  projectId,
  runId,
  apiKey
}: {
  projectId: string;
  runId: string;
  apiKey: string;
}): Promise<PlaywrightResultResponse> {
  const httpClient = new HttpClient('github-action', [
    new BearerCredentialHandler(apiKey)
  ]);

  debug(`Starting to poll for playwright runId: ${runId}`);

  const statusUrl = new URL(
    `/v1/projects/${projectId}/runs/${runId}`,
    API_ENDPOINT
  ).href;

  // Start polling for status
  const pollStartEpochMs = Date.now();
  while (true) {
    // Check for timeout
    if (Date.now() - pollStartEpochMs > POLLING_TIMEOUT_MS) {
      throw new Error(
        `Polling for playwright run status timed out after 24 hours for runId: ${runId}`
      );
    }

    const runStatusResponse =
      await httpClient.getJson<PlaywrightResultResponse>(statusUrl);
    const runStatus = unpackOrThrow(runStatusResponse, 'playwrightRunStatus');

    if (runStatus.status !== 'RUNNING') {
      return runStatus; // Return the full result when finished
    }

    // Wait for 5 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 5000));
    debug(`Polling status for playwright runId: ${runId}`);
  }
}
