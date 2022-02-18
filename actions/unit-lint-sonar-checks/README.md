# `unit-lint-sonar-checks` - **Github Action**

This action checks out the commit, sets up Node, runs unit tests, linter and sonar cheks.

## Input

| Name          | Description                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `fetch-depth` | Number of commits to fetch during checkout. 0 indicates all history for all branches and tags. |
| `token`       | Personal access token (PAT) used to fetch the repository.                                      |

## Example Workflow File

```yaml
name: Checkout and install deps

on: [pull_request]

jobs:
    checkout-and-yarn:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout and yarn
              uses: icemobilelab/github-actions-pipeline/packages/unit-lint-sonar-checks@main
              with:
                  fetch-depth: '1'
```