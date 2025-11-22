import { debug } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/lib/auth';

type PlaywrightRunResponse = {
  runId: string;
};

type PlaywrightRunStatus =
  | 'QUEUED'
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

    if (runStatus.status !== 'RUNNING' && runStatus.status !== 'QUEUED') {
      return runStatus; // Return the full result when finished
    }

    // Wait for 5 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 5000));
    debug(`Polling status for playwright runId: ${runId}`);
  }
}
