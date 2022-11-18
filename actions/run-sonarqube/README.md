# `run-sonarqube` - **Github Action**

This action runs Sonarqube over your code.

## Example Workflow File

```yaml
name: Run Sonarqube
on: [pull_request]
jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - name: Run sonarqube
        uses: icemobilelab/github-actions-pipeline/actions/run-sonarqube@v1
```
