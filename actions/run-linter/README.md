# `run-linter` - **Github Action**

This action runs the configured linter over your code.

## Example Workflow File

```yaml
name: Lint code
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Run linter
        uses: icemobilelab/github-actions-pipeline/actions/run-linter@v1
```
