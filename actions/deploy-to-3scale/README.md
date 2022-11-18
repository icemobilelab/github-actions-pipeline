# `deploy-to-3scale` - **Github Action**

This action deploys a project's OpenAPI/Swagger spec to 3scale

## Inputs

| Name             | Required  | Default           | Description                                                                              |
| ---------------- | --------- | ----------------- | ---------------------------------------------------------------------------------------- |
| swaggerDirectory | **false** | `docs/swagger`    | The path to the directory within the calling repository that contains the OpenAPI files. |
| internalSpecFile | **false** | `<repo-name>.yml` | Name of the OpenAPI internal spec file. Defaults to                                      |
| publicSpecFile   | **false** | `public.yml`      | Name of the OpenAPI public spec file. Defaults to                                        |
| cluster          | **false** | `TST`             | The cluster to deploy to. See [`clusterMap` here][clusters] for acceptable values        |

## Example Workflow File

```yaml
on:
  push:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v3
      - name: Deploy to 3scale
        uses: 'icemobilelab/github-actions-pipeline/actions/deploy-to-3scale@main'
```

[clusters]: ./src/extract-3scale-config.mjs
