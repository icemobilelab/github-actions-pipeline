# `run-unit-tests` - **Github Action**

This action runs unit tests and optionally checks test coverage

## Inputs

| Name                    | Required  | Description                                                                                      |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `minimum-code-coverage` | **false** | The minimum percentage of code that must be covered to succeed. If unset, coverage isn't checked |

## Example Workflow File

```yaml
name: Run unit tests
on: [pull_request]
jobs:
  run-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run unit tests
        uses: icemobilelab/github-actions-pipeline/actions/run-unit-tests@v1
        with:
          minimum-code-coverage: 90
```
