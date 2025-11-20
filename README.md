# Stably-runner-action

Use this GitHub action to run tests on [stably.ai](https://stably.ai)

This action supports two versions:

- **v1**: Test Suite Runner (our original test runner)
- **v2**: Playwright Runner (run Playwright tests from your repository)

The action automatically detects which version to use based on the inputs you
provide.

## Inputs

| **Name**           | **Required** | **Default**           | **Version** | **Description**                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------ | --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| api-key            | ✅           |                       | Both        | Your API key                                                                                                                                                                                                                                                                                       |
| test-suite-id      | ✅ (v1 only) |                       | v1          | Identifier for the test suite to execute. Use this for v1 Test Suite Runner.                                                                                                                                                                                                                       |
| project-id         | ✅ (v2 only) |                       | v2          | Your project ID. Use this for v2 Playwright Runner.                                                                                                                                                                                                                                                |
| run-group-names    |              |                       | v2          | Newline-separated list of Playwright project names to run. Optional - if not provided, all projects will run.                                                                                                                                                                                      |
| github-comment     |              | true                  | Both        | When enabled, will leave a comment on either the commit or PR with relevant test results. Requires proper permissions (see #Permissions section below).                                                                                                                                            |
| github-token       |              | `${{ github.token }}` | Both        | This token is used for used for leaving the comments on PRs/commits. By default, we'll use the GitHub actions bot token, but you can override this a repository scoped [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). |
| async              |              | false                 | Both        | If set, will launch the tests but not wait for them to finish and the action will always output success. Note: Github comments will not function if this is set                                                                                                                                    |
| environment        |              | PRODUCTION            | v1          | The environment to inherit variables from (v1 only).                                                                                                                                                                                                                                               |
| variable-overrides |              |                       | Both        | A JSON object containing variable overrides. Each key is a variable name and the value can be either a string or an object with `value` and optional `sensitive` properties.                                                                                                                       |
| note               |              |                       | v1          | Optional note to add to the test run to help identify it. This note will be included in the test run metadata (v1 only).                                                                                                                                                                           |

## Outputs

| **Name**       | **Description**                                       |
| -------------- | ----------------------------------------------------- |
| success        | Bool if run was successful                            |
| testSuiteRunId | The test suite run ID (v1) or run ID (v2) for the run |

## Example Usage

### V1 - Test Suite Runner

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

### V2 - Playwright Runner

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
          # Optional: specify which Playwright projects to run
          run-group-names: |
            chromium
            firefox
          # Optional: override environment variables
          variable-overrides: |
            {
              "BASE_URL": "https://staging.example.com"
            }

      - name: Print Output
        id: output
        run: echo "${{ steps.stably-runner.outputs.success }}"
```

## Testing containerized/localized applications

You can use the `variable-overrides` option to enable containerized/local
testing by replacing the original URL with a localhost URL.

### V1 Example

Considering we have an existing test suite that we run in production with tests
using an environment variable `APP_URL`, you can test your local application
running in your CI at `http://localhost:3000` using this configuration:

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

### V2 Example

For Playwright tests, you can override environment variables the same way:

```yaml
- name: Stably Playwright Runner Action (v2)
  id: stably-runner
  uses: stablyai/stably-runner-action@v3
  with:
    api-key: ${{ secrets.API_KEY }}
    project-id: YOUR_PROJECT_ID
    variable-overrides: |
      {
        "BASE_URL": "http://localhost:3000"
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

<details>

<summary>Development</summary>

## Setup

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

2. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

3. :white_check_mark: Run the tests

   ```bash
   npm test
   ```

## Publishing

1. Create a new branch

   ```bash
   git checkout -b releases/v1
   ```

2. Format, test, and build the action

   ```bash
   npm run all
   ```

3. Commit your changes

4. Push them to your repository

   ```bash
   git push -u origin releases/v1
   ```

5. Merge the pull request into the `master` branch

6. Release

   1. Draft a release via the GitHub UI and ensure you select to also publish to
      the marketplace. Use SEMVAR
   2. Make the new release available to those binding to the major version tag:
      Move the major version tag (v1, v2, etc.) to point to the ref of the
      current releas

      ```bash
      git tag -fa v3 -m "Update v3 tag"
      git push origin v3 --force
      ```

   For information more info see
   [Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validating the Action

[`ci.yml`](./.github/workflows/ci.yml) is a workflow that runs and validates the
action

</details>
