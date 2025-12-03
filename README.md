# Stably-runner-action

Use this GitHub action to run tests on [stably.ai](https://stably.ai)

> [!IMPORTANT]  
> 🔐 **Permission Issues?** If you encounter permission errors, see the [Permissions](#permissions) section below.

This action supports 2 versions: [Agents (v2)](#agents-v2) or [Classic (v1)](#classic-v1). The action automatically detects which version to use based on the inputs you provide.

## Agents (v2)

Run test suites using Stably's agent (v2) test runner.

### Inputs

| **Name**           | **Required** | **Default**           | **Description**                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| api-key            | ✅           |                       | Your API key                                                                                                                                                                                                                                                                                       |
| project-id         | ✅           |                       | Your Stably project ID                                                                                                                                                                                                                                                                             |
| run-group-name     |              |                       | The run group you wish to run - if not provided, all tests will run                                                                                                                                                                                                                               |
| env-overrides      |              |                       | A YAML string or JSON object containing environment variable overrides. Each key is a variable name and the value is a string.                                                                                                                                                                                    |
| github-comment     |              | true                  | When enabled, will leave a comment on either the commit or PR with relevant test results. Requires proper permissions (see [Permissions](#permissions) section below).                                                                                                                             |               |
| github-token       |              | `${{ github.token }}` | This token is used for leaving the comments on PRs/commits. By default, we'll use the GitHub actions bot token, but you can override this a repository scoped [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).          |
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
      - name: Stably Playwright Runner Action (v2)
        id: stably-runner
        uses: stablyai/stably-runner-action@v4
        with:
          api-key: ${{ secrets.API_KEY }}
          project-id: YOUR_PROJECT_ID
          # Optional: specify a specific run group to only run (instead of all tests)
          run-group-name: smoke-tests
          # Optional: override environment variables
          env-overrides: |
            BASE_URL: https://staging.example.com
            API_KEY: abc123

      - name: Print Output
        id: output
        run: echo "${{ steps.stably-runner.outputs.success }}"
```

### Testing Containerized/Local Applications

You can use the `env-overrides` option to enable containerized/local testing by replacing the original URL with a localhost URL:

```yaml
- name: Stably Playwright Runner Action (v2)
  id: stably-runner
  uses: stablyai/stably-runner-action@v4
  with:
    api-key: ${{ secrets.API_KEY }}
    project-id: YOUR_PROJECT_ID
    env-overrides: |
      BASE_URL: http://localhost:3000
```

### Using Dynamic URLs from Previous Steps

If your preview/deployment URL is generated dynamically (e.g., from Vercel, Netlify, or a custom deployment step), you can capture it from a previous step and pass it to Stably.

> [!IMPORTANT]  
> You must export the dynamic URL from your deployment step using `$GITHUB_OUTPUT`. This makes the value available to subsequent steps.

```yaml
name: Stably with Dynamic URL

on:
  pull_request:

permissions:
  pull-requests: write
  contents: write

jobs:
  deploy-and-test:
    runs-on: ubuntu-latest
    steps:
      # Step 1: Deploy and capture the dynamic URL
      - name: Deploy Preview
        id: deploy
        run: |
          # Your deployment script here - this is just an example
          # The URL could come from Vercel, Netlify, or any deployment tool
          PREVIEW_URL="https://my-app-${{ github.sha }}.vercel.app"
          
          # ⚠️ IMPORTANT: You MUST export the URL using $GITHUB_OUTPUT
          # This makes it available to later steps
          echo "preview_url=$PREVIEW_URL" >> $GITHUB_OUTPUT

      # Step 2: Pass the dynamic URL to Stably
      - name: Run Stably Tests
        uses: stablyai/stably-runner-action@v4
        with:
          api-key: ${{ secrets.API_KEY }}
          project-id: YOUR_PROJECT_ID
          env-overrides: |
            BASE_URL: ${{ steps.deploy.outputs.preview_url }}
```

#### Real-World Example with Vercel

```yaml
jobs:
  deploy-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        id: vercel-deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

      # The Vercel action automatically outputs the preview URL
      - name: Run Stably Tests on Preview
        uses: stablyai/stably-runner-action@v4
        with:
          api-key: ${{ secrets.API_KEY }}
          project-id: YOUR_PROJECT_ID
          env-overrides: |
            BASE_URL: ${{ steps.vercel-deploy.outputs.preview-url }}
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
      - name: Stably Runner Action (v1)
        id: stably-runner
        uses: stablyai/stably-runner-action@v4
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
  uses: stablyai/stably-runner-action@v4
  with:
    api-key: ${{ secrets.API_KEY }}
    test-suite-id: TEST_SUITE_ID
    variable-overrides: |
      {
        "APP_URL": "http://localhost:3000"
      }
```

### Using Dynamic URLs from Previous Steps

If your preview/deployment URL is generated dynamically, you can capture it from a previous step and pass it to Stably.

> [!IMPORTANT]  
> You must export the dynamic URL from your deployment step using `$GITHUB_OUTPUT`. This makes the value available to subsequent steps.

```yaml
name: Stably with Dynamic URL

on:
  pull_request:

permissions:
  pull-requests: write
  contents: write

jobs:
  deploy-and-test:
    runs-on: ubuntu-latest
    steps:
      # Step 1: Deploy and capture the dynamic URL
      - name: Deploy Preview
        id: deploy
        run: |
          # Your deployment script here - this is just an example
          PREVIEW_URL="https://my-app-${{ github.sha }}.example.com"
          
          # ⚠️ IMPORTANT: You MUST export the URL using $GITHUB_OUTPUT
          # This makes it available to later steps
          echo "preview_url=$PREVIEW_URL" >> $GITHUB_OUTPUT

      # Step 2: Pass the dynamic URL to Stably
      - name: Run Stably Tests
        uses: stablyai/stably-runner-action@v4
        with:
          api-key: ${{ secrets.API_KEY }}
          test-suite-id: TEST_SUITE_ID
          variable-overrides: |
            {
              "APP_URL": "${{ steps.deploy.outputs.preview_url }}"
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

