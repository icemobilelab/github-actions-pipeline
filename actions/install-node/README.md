# `install-node` - **Github Action**

## Description

Installs node at whatever version is specified in the repository's `.nvmrc` file

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
      - name: Install node
        uses: icemobilelab/github-actions-pipeline/actions/install-node@v1
```
