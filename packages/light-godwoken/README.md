# LightGodwoken

An Godwoken SDK written in TypeScript.

LightGodwoken provides convenient functions that allow us to make specific transactions on Godwoken layer 2, for example deposit from Nervos layer 1 to Godwoken layer 2, or withdrawal from layer 2 to layer 1.

## Installation
```bash
# Install via NPM
$ npm install light-godwoken

# Install via Yarn
$ yarn add light-godwoken

# Install via PNPM
$ pnpm add light-godwoken
```

## Local development
You can 

The `light-godwoken` package works under the `light-godwoken-workspaces` monorepo. To get it working, we recommend you to setup the local development environment for the monorepo first.

### Setup development environment
```bash
$ yarn install
$ yarn run prepare
```

### Build for production
Work as a monorepo:
```bash
$ yarn workspace light-godwoken run build
```

Work in packages/light-godwoken directly:
```bash
$ yarn run build
```

### Test & coverage
Work as a monorepo:
```bash
# test only
$ yarn workspace light-godwoken run test

# test and generate coverage report
$ yarn workspace light-godwoken run test:coverage
```

Work in packages/light-godwoken directly:
```bash
# test only
$ yarn run test

# test and generate coverage report
$ yarn run test:coverage
```
