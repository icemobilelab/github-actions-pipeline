# `3scale-deployment` - **Github Action**

This action deploys a project's OpenAPI/Swagger spec to 3scale

## Input

| Name             | Required | Description                                                                                                                                                     |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| swaggerDirectory | **true** | The path to the directory within the calling repository that contains the OpenAPI files. Defaults to `docs/swagger`                                             |
| internalSpecFile | **true** | Name of the OpenAPI internal spec file. Defaults to `<repo-name>.yml`                                                                                           |
| publicSpecFile   | **true** | Name of the OpenAPI public spec file. Defaults to `public.yml`                                                                                                  |
| cluster          | **true** | The cluster to deploy to. One of: `TST`, `ARO_ACC_CANADACENTRAL`, `ARO_PRD_CANADACENTRAL`, `ARO_PRD_CANADACENTRAL2`, `ARO_ACC_WESTEUROPE`, `ARO_PRD_WESTEUROPE` |
| threescaleRc     | **true** | The 3scale toolbox configuration (`.3scalerc.yaml`), base64-encoded                                                                                             |

## Example Workflow File

```yaml
on:
  push:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v2
      - name: Deploy to 3scale
        uses: 'icemobilelab/github-actions-pipeline/actions/3scale-deployment@main'
        with:
          cluster: TST
          threescaleRc: ${{ secrets.THREESCALE_RC }}
```
