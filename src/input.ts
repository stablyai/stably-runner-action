import { getInput, type InputOptions, setFailed } from '@actions/core';
import { load } from 'js-yaml';

const NEWLINE_REGEX = /\r|\n/;
const TRUE_VALUES = new Set(['true', 'yes', '1']);

function getBoolInput(name: string, options?: InputOptions) {
  return TRUE_VALUES.has(getInput(name, options).toLowerCase().trim());
}

function getList(name: string, options?: InputOptions) {
  return getInput(name, options).split(NEWLINE_REGEX).filter(Boolean);
}

type BaseInput = {
  apiKey: string;
  githubToken: string | undefined;
  githubComment: boolean;
  runInAsyncMode: boolean;
};

type V2Input = BaseInput & {
  version: 'v2';
  projectId: string;
  playwrightProjectName: string | undefined;
  envOverrides: Record<string, string> | undefined;
};

type V1Input = BaseInput & {
  version: 'v1';
  testSuiteId: string;
  urlReplacement:
    | {
        original: string;
        replacement: string;
      }
    | undefined;
  environment: string;
  variableOverrides: Record<
    string,
    string | { value: string | object; sensitive?: boolean }
  >;
  note: string;
};

export type ParsedInput = V1Input | V2Input;

export function parseInput(): ParsedInput {
  const apiKey = getInput('api-key', { required: true });

  // V2 inputs
  const projectId = getInput('project-id');
  // playwright-project-name is the new preferred input, run-group-name is deprecated
  const playwrightProjectNameInput = getInput('playwright-project-name').trim();
  const runGroupNameInput = getInput('run-group-name').trim();
  const playwrightProjectName = playwrightProjectNameInput || runGroupNameInput;
  const envOverridesJson = getInput('env-overrides');
  const envOverrides = envOverridesJson
    ? (parseObjectInput('env-overrides', envOverridesJson) as Record<
        string,
        string
      >)
    : undefined;

  // V1 inputs (supporting deprecating of runGroupIds)
  const testSuiteIdInput = getInput('test-suite-id');
  const testGroupIdInput = getInput('test-group-id');
  const testSuiteId = testSuiteIdInput || testGroupIdInput;

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
  const variableOverrides = variableOverridesJson
    ? (parseObjectInput('variable-overrides', variableOverridesJson) as Record<
        string,
        string | { value: string | object; sensitive?: boolean }
      >)
    : {};

  const note = getInput('note');

  return {
    apiKey,
    githubToken: githubToken || process.env.GITHUB_TOKEN,
    githubComment,
    runInAsyncMode,
    ...(projectId
      ? {
          version: 'v2' as const,
          projectId,
          playwrightProjectName: playwrightProjectName || undefined,
          envOverrides
        }
      : {
          version: 'v1' as const,
          testSuiteId,
          urlReplacement,
          environment,
          variableOverrides,
          note
        })
  } as const;
}

// This method also works with JSON as JSON is is valid YAML
function parseObjectInput(fieldName: string, yaml: string) {
  try {
    const result = load(yaml);
    if (
      typeof result !== 'object' ||
      result === null ||
      Array.isArray(result)
    ) {
      throw new Error(
        `Expected a key-value object, but got ${
          Array.isArray(result) ? 'array' : typeof result
        }`
      );
    }
    return result;
  } catch (e) {
    setFailed(`${fieldName} contains an invalid object: ${e}`);
    throw e;
  }
}
