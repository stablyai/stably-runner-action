# Stably-runner-action

Use this GitHub action to run tests on [stably.ai](https://stably.ai)

> 🔐 **Permission Issues?** If you encounter permission errors, see the [Permissions](#permissions) section below.

This action supports two versions: [Agents (v2)](#agents-v2) for Playwright tests or [Classic (v1)](#classic-v1) for test suites. The action automatically detects which version to use based on the inputs you provide.

## Agents (v2)

Run Playwright tests from your repository using Stably's agent-based runner.

### Inputs

| **Name**           | **Required** | **Default**           | **Description**                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| api-key            | ✅           |                       | Your API key                                                                                                                                                                                                                                                                                       |
| project-id         | ✅           |                       | Your project ID                                                                                                                                                                                                                                                                                    |
| run-group-name     |              |                       | The Playwright project name to run. Optional - if not provided, all projects will run.                                                                                                                                                                                                             |
| env-overrides      |              |                       | A JSON object containing environment variable overrides. Each key is a variable name and the value is a string.                                                                                                                                                                                   |
| github-comment     |              | true                  | When enabled, will leave a comment on either the commit or PR with relevant test results. Requires proper permissions (see [Permissions](#permissions) section below).                                                                                                                                            |
| github-token       |              | `${{ github.token }}` | This token is used for leaving the comments on PRs/commits. By default, we'll use the GitHub actions bot token, but you can override this a repository scoped [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). |
| async              |              | false                 | If set, will launch the tests but not wait for them to finish and the action will always output success. Note: Github comments will not function if this is set                                                                                                                                    |

### Outputs

| **Name**       | **Description**                                       |
| -------------- | ----------------------------------------------------- |
| success        | Bool if run was successful                            |
| testSuiteRunId | The run ID for the test execution |

### Example Usage

```yaml
name: Stably Playwright Runner Example

on:
  pull_request:
  push:
    branches:
      - master
# You need to set these permissions if using the `github-comment` option
permissions:
  pull-requests: write
  contents: write
jobs:
  stably-playwright-action:
    name: Stably Playwright Runner
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Stably Playwright Runner Action (v2)
        id: stably-runner
        uses: stablyai/stably-runner-action@v3
        with:
          api-key: ${{ secrets.API_KEY }}
          project-id: YOUR_PROJECT_ID
          # Optional: specify a specific run group to only run (instead of all tests)
          run-group-name: smoke-tests
          # Optional: override environment variables
          env-overrides: |
            {
              "BASE_URL": "https://staging.example.com"
            }

      - name: Print Output
        id: output
        run: echo "${{ steps.stably-runner.outputs.success }}"
```

### Testing Containerized/Local Applications

You can use the `env-overrides` option to enable containerized/local testing by replacing the original URL with a localhost URL:

```yaml
- name: Stably Playwright Runner Action (v2)
  id: stably-runner
  uses: stablyai/stably-runner-action@v3
  with:
    api-key: ${{ secrets.API_KEY }}
    project-id: YOUR_PROJECT_ID
    env-overrides: |
      {
        "BASE_URL": "http://localhost:3000"
      }
```

## Classic (v1)

Run test suites using Stably's classic test runner.

### Inputs

| **Name**           | **Required** | **Default**           | **Description**                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| api-key            | ✅           |                       | Your API key                                                                                                                                                                                                                                                                                       |
| test-suite-id      | ✅           |                       | Identifier for the test suite to execute                                                                                                                                                                                                                                                          |
| github-comment     |              | true                  | When enabled, will leave a comment on either the commit or PR with relevant test results. Requires proper permissions (see [Permissions](#permissions) section below).                                                                                                                                            |
| github-token       |              | `${{ github.token }}` | This token is used for leaving the comments on PRs/commits. By default, we'll use the GitHub actions bot token, but you can override this a repository scoped [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). |
| async              |              | false                 | If set, will launch the tests but not wait for them to finish and the action will always output success. Note: Github comments will not function if this is set                                                                                                                                    |
| environment        |              | PRODUCTION            | The environment to inherit variables from                                                                                                                                                                                                                                               |
| variable-overrides |              |                       | A JSON object containing variable overrides. Each key is a variable name and the value can be either a string or an object with `value` and optional `sensitive` properties.                                                                                                                       |
| note               |              |                       | Optional note to add to the test run to help identify it. This note will be included in the test run metadata                                                                                                                                                                           |

### Outputs

| **Name**       | **Description**                                       |
| -------------- | ----------------------------------------------------- |
| success        | Bool if run was successful                            |
| testSuiteRunId | The test suite run ID |

### Example Usage

```yaml
name: Stably Test Suite Runner Example

# Define when you want the action to run
on:
  pull_request:
  push:
    branches:
      - master
# You need to set these permissions if using the `github-comment` option
permissions:
  pull-requests: write
  contents: write
jobs:
  stably-test-action:
    name: Stably Test Suite Runner
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Stably Runner Action (v1)
        id: stably-runner
        uses: stablyai/stably-runner-action@v3
        with:
          api-key: ${{ secrets.API_KEY }}
          test-suite-id: TEST_SUITE_ID
          # setting variable overrides is optional
          variable-overrides: |
            {
              "APP_URL": "https://example.com"
            }

      - name: Print Output
        id: output
        run: echo "${{ steps.stably-runner.outputs.success }}"
```

### Testing Containerized/Local Applications

You can use the `variable-overrides` option to enable containerized/local testing by replacing the original URL with a localhost URL. For example, if you have an existing test suite that uses an environment variable `APP_URL`, you can test your local application running in your CI at `http://localhost:3000`:

```yaml
- name: Stably Runner Action (v1)
  id: stably-runner
  uses: stablyai/stably-runner-action@v3
  with:
    api-key: ${{ secrets.API_KEY }}
    test-suite-id: TEST_SUITE_ID
    variable-overrides: |
      {
        "APP_URL": "http://localhost:3000"
      }
```

## Permissions

This action requires write permission to leave PR or commit comments.

You'll want to have the follow permissions:

```yaml
permissions:
  pull-requests: write
  contents: write
```

You can declare these at the top of your workflow.

Alternativly, you can modify all workflow permissions by going to
`Settings > Actions > General > Workflow permissions` and enabling read and
write permissions.

Note: For organizations, you'll have to first set this set/allow these
permissions at the organization level

See more info here:
https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs