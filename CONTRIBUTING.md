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
      git tag -fa v4 -m "Update v4 tag"
      git push origin v4 --force
      ```

   For information more info see
   [Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validating the Action

[`ci.yml`](./.github/workflows/ci.yml) is a workflow that runs and validates the
action