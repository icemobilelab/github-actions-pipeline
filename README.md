# IceMobile GitHub Actions and Workflows

- [Description](#description)
- [Setup](#setup)
- [Creating actions](#creating-actions)
  - [Composite and Docker Actions](#composite-and-docker-actions)
  - [NodeJS Actions](#nodejs-actions)

## Description

This repository contains a collection of GitHub Actions and Workflows used in IceMobile's CI/CD pipelines

## Setup

Run

```shell
npm install
```

## Creating actions

All new Actions should exist in the `actions` directory. Please add a `README.md` file detailing how to use your action.

The special directory `actions/common` is used for storing utilities, classes, etc. that are usueful across multiple actions.

In general, the folder structure should look something like this (for details on each type of action, see each section below):

```txt
actions
├── my-commonjs-nodejs-action
│   ├── README.md
│   ├── action.yaml
│   ├── dist
│   │   └── index.cjs
│   └── src
│       ├── do-more-stuff.cjs
│       ├── do-stuff.cjs
│       └── index.cjs
├── my-esm-nodejs-action
│   ├── README.md
│   ├── action.yaml
│   ├── dist
│   │   └── index.mjs
│   └── src
│       ├── do-more-stuff.mjs
│       ├── do-stuff.mjs
│       └── index.mjs
├── my-docker-action
│   ├── Dockerfile
│   ├── README.md
│   └── action.yaml
└── my-composite-action
    ├── README.md
    ├── action.yaml
    └── some-script.sh
```

### Composite and Docker Actions

There are no specific requirements, other than making sure to include all your dependencies within the same directory. Examples:

Composite:

```yaml
name: My Composite Action
description: Does composite stuff
runs:
  using: composite
  steps:
    - name: Do stuff
      shell: bash
      run: |
        echo "I'm doing stuff!"
        echo "Ok, stuff done!"
    - name: Run something
      shell: bash
      run: ${{ github.action_path }}/some-script.sh
```

Docker:

```yaml
name: My Docker Action
description: Runs Docker, saves the whales
runs:
  using: docker
  image: Dockerfile
```

### NodeJS Actions

Per [the documentation][gha_nodejs], these need to be bundled into a single distributable
module. While the GHA docs recommend using [ncc][ncc] for this, ncc has some trouble dealing with ES Modules, so
we've opted instead for [esbuild][esbuild]. A convenience script has been added to `package.json`, named `build`:

```shell
npm run build
```

Before running the script, make sure you have added all your `npm` dependencies to the `package.json`
file in the repo's root directory. The script automatically builds and packages any nodejs actions
found. **This script works only if your action has a `src` directory, as seen in the tree diagram above**.
The following is an example `action.yml`:

```yaml
name: My NodeJS Action
description: Does some magic NodeJS stuff and summons unicorns
inputs:
  unicornCount:
    description: The number of unicorns to summon
    default: 1
    required: true
  unicornHairColor:
    description: |
      Color of the unicorn's hair. One of:
          - Rainbow
          - Silver
          - Gold
    required: false
    default: Rainbow
runs:
  using: node16
  main: dist/index.js
```

Notice the last line. By default, the build script will output a single `index.[m|c]js` file to `action/<action_name>/dist/`, and this is the file that your action needs to run. The output file's extension will depend on whether your `src/index` module is an ES Module (`.mjs`) or a CommonJS module (`.cjs` or `.js`).

[gha_nodejs]: https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github
[ncc]: https://www.npmjs.com/package/@vercel/ncc
[esbuild]: https://esbuild.github.io/
