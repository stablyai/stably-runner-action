import { getInput, type InputOptions, setFailed } from '@actions/core';

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

  // V2 inputs
  const projectId = getInput('project-id');
  const runGroupNames = getList('run-group-names').filter(Boolean);
  const envOverridesJson = getInput('env-overrides');
  const envOverrides = envOverridesJson
    ? parseObjectInput('env-overrides', envOverridesJson)
    : undefined;

  // V1 inputs (supporting deprecating of runGroupIds)
  const testSuiteIdInput = getInput('test-suite-id');
  const runGroupIdsInput = getList('run-group-ids');
  const testGroupIdInput = getInput('test-group-id');
  const testSuiteId =
    testSuiteIdInput || testGroupIdInput || runGroupIdsInput.at(0);

  // Validation: require either projectId (v2) OR testSuiteId (v1), but not both
  if (projectId && testSuiteId) {
    setFailed(
      'Cannot use both project-id (v2) and test-suite-id (v1). Please use one or the other.'
    );
    throw Error(
      'Cannot use both project-id (v2) and test-suite-id (v1). Please use one or the other.'
    );
  }

  if (!projectId && !testSuiteId) {
    setFailed(
      'Either project-id (v2) or test-suite-id (v1) is required. Please provide one.'
    );
    throw Error(
      'Either project-id (v2) or test-suite-id (v1) is required. Please provide one.'
    );
  }

  const version = projectId ? 'v2' : 'v1';

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
    version,
    apiKey,
    // V1 fields
    testSuiteId,
    urlReplacement,
    environment,
    variableOverrides,
    note,
    // V2 fields
    projectId,
    runGroupNames: runGroupNames.length > 0 ? runGroupNames : undefined,
    envOverrides,
    // Shared fields
    githubToken: githubToken || process.env.GITHUB_TOKEN,
    githubComment,
    runInAsyncMode
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
