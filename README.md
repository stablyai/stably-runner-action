# Stably-runner-action

Use this GitHub action to run tests on [stably.ai](https://stably.ai)

## Inputs

| **Name**           | **Required** | **Default**           | **Description**                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| api-key            | ✅           |                       | Your API key                                                                                                                                                                                                                                                                                       |
| test-suite-id      | ✅           |                       | Identifier for the test suite to execute.                                                                                                                                                                                                                                                          |
| url-replacement    |              |                       | Newline-separated tuple (pair) with original first as first line and the replacement second. Use to replace website URLs when running tests.                                                                                                                                                       |
| github-comment     |              | true                  | When enabled, will leave a comment on either the commit or PR with relevant test results. Requires proper permissions (see #Permissions section below).                                                                                                                                            |
| github-token       |              | `${{ github.token }}` | This token is used for used for leaving the comments on PRs/commits. By default, we'll use the GitHub actions bot token, but you can override this a repository scoped [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). |
| async              |              | false                 | If set, will launch the tests but not wait for them to finish and the action will always output success. Note: Github comments will not function if this is set                                                                                                                                    |
| environment        |              | PRODUCTION            | The environment to inherit variables from.                                                                                                                                                                                                                                                         |
| variable-overrides |              |                       | A JSON object containing variable overrides. Each key is a variable name and the value can be either a string or an object with `value` and optional `sensitive` properties.                                                                                                                       |
| note              |              |                       | Optional note to add to the test run to help identify it. This note will be included in the test run metadata.                                                                                                                                                                               |

## Outputs

| **Name**       | **Description**            |
| -------------- | -------------------------- |
| success        | Bool if run was successful |
| testSuiteRunId | The test suite run id      |

## Example Usage

```yaml
name: Stably Test Runner Example

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
    name: Stably Test Runner
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Stably Runner Action
        id: stably-runner
        uses: stablyhq/stably-runner-action@v3
        with:
          api-key: ${{ secrets.API_KEY }}
          test-suite-id: TEST_SUITE_ID
          # setting a URL replacement is optional
          url-replacement: |-
            ORIGINAL_WEBSITE_URL
            REPLACEMENT_WEBSITE_URL

      - name: Print Output
        id: output
        run: echo "${{ steps.test-action.outputs.success }}"
```

## Testing containerized/localized applications

You can use the `url-replacement` option to enable containrized/local testing by
replacing the original URL with a localhost URL.

Considering we have an existing test suite that we run in production
(`https://example.com`), you can test your local application running in your CI
at `http://localhost:3000` using this configuration:

```yaml
- name: Stably Runner Action
   id: stably-runner
   uses: stablyhq/stably-runner-action@v3
   with:
      api-key: ${{ secrets.API_KEY }}
      test-suite-id: TEST_SUITE_ID
      url-replacement: |-
         https://example.com
         http://localhost:3000
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
