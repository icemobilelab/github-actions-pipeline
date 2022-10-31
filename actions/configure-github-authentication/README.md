# `configure-github-authentication` - **Github Action**

## Description

Configures git to authenticate to GitHub using personal access token (PAT)

## Inputs

| Name         | Required | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `github-pat` | true     | he GitHub personal access token (PAT) to use |

## Example

```yaml
on:
  push:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v3
      - name: Configure git
        uses: icemobilelab/github-actions-pipeline/actions/configure-github-authentication@v1
      - name: Install npm deps
        uses: ...
```
