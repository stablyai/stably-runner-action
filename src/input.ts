import { InputOptions, getInput, setFailed } from '@actions/core';
import { debug } from 'console';

const NEWLINE_REGEX = /\r|\n/;
const TRUE_VALUES = new Set(['true', 'yes', '1']);

function getBoolInput(name: string, options?: InputOptions) {
  return TRUE_VALUES.has(getInput(name, options).toLowerCase().trim());
}

function getList(name: string, options?: InputOptions) {
  return getInput(name, options).split(NEWLINE_REGEX).filter(Boolean);
}

export function parseInput() {
  const apiKey = getInput('api-key', { required: true });

  // Supporting deprecating of runGroupIds
  const testSuiteIdInput = getInput('test-suite-id');
  const runGroupIdsInput = getList('run-group-ids');
  const testGroupIdInput = getInput('test-group-id');
  const testSuiteId =
    testSuiteIdInput || testGroupIdInput || runGroupIdsInput.at(0);
  if (!testSuiteId) {
    debug(`testGroupId: ${testSuiteId}`);
    debug(`testSuiteId: ${testSuiteIdInput}`);
    debug(`runGroupIdsInput: ${runGroupIdsInput}`);
    debug(`testGroupIdInput: ${testGroupIdInput}`);
    setFailed('the `testGroupId` input is required');
    throw Error('the `testGroupId` input is required');
  }

  // @deprecated
  const deprecatedRawUrlReplacementInput = getList('domain-override');
  const newRawUrlReplacementInput = getList('url-replacement');
  const rawUrlReplacementInput =
    newRawUrlReplacementInput.length > 0
      ? newRawUrlReplacementInput
      : deprecatedRawUrlReplacementInput;
  if (
    rawUrlReplacementInput.length > 0 &&
    rawUrlReplacementInput.length !== 2
  ) {
    setFailed(
      `URL replacment can only be given as a single pair. Given: ${JSON.stringify(
        rawUrlReplacementInput
      )}`
    );
  }
  const [urlReplacementOriginal, urlReplacementNew] = rawUrlReplacementInput;
  const urlReplacement =
    rawUrlReplacementInput.length === 2
      ? {
          original: urlReplacementOriginal,
          replacement: urlReplacementNew
        }
      : undefined;

  const githubToken = getInput('github-token');
  const githubComment = getBoolInput('github-comment');

  const runInAsyncMode = getBoolInput('async');
  const environment = getInput('environment');
  const variableOverridesJson = getInput('variable-overrides');
  const variableOverrides = parseObjectInput(
    'variable-overrides',
    variableOverridesJson
  );

  const note = getInput('note');

  return {
    apiKey,
    testSuiteId,
    urlReplacement,
    githubToken: githubToken || process.env.GITHUB_TOKEN,
    githubComment,
    runInAsyncMode,
    environment,
    variableOverrides,
    note
  };
}

function parseObjectInput(fieldName: string, json: string) {
  try {
    return JSON.parse(json);
  } catch (e) {
    setFailed(`${fieldName} contains an invalid object: ${e}`);
    throw e;
  }
}
