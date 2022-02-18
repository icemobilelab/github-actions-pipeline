# `unit-lint-sonar-checks` - **Github Action**

This action checks out the commit, sets up Node (14), runs unit tests, linter and sonar checks.

## Input

| Name  | Required  |  Description |
| ------------ | ------------ | ------------ |
| ` icemobile-pat-token` |  **true**  |  Pass ${{ secrets.IM_CI_GUTHUB_TOKEN }} here |
| ` sonar-token` |   **true** | Pass ${{ secrets.SONAR_TOKEN }} here |
| `fetch-depth`  | false  | Number of commits to fetch during checkout. 0 indicates all history for all branches and tags.  |
|  `ref`  |  false | The branch, tag or SHA to checkout. When checking out the repository that triggered a workflow, this defaults to the reference or SHA for that event. Otherwise, uses the default branch. |
| `pat-token`  |  false | Personal access token (PAT) used to fetch the repository. Defaults to  ${{ secrets.GITHUB_TOKEN }}.  |
| ` sonar-sources` |  false | Sourse folder to scan. Defaults to `lib/util` |

## Example Workflow File

```yaml
name: Run unit tests, lint and sonar checks

on: [pull_request]

jobs:
    run-checks:
        runs-on: ubuntu-latest
        steps:
            - name: unit-lint-sonar-checks
              uses: icemobilelab/github-actions-pipeline/actions/unit-lint-sonar-checks@main
              with:
                  fetch-depth: '1'
                  icemobile-pat-token: ${{ secrets.IM_CI_GITHUB_TOKEN }}
                  sonar-token: ${{ secrets.SONAR_TOKEN }}
```
