# LightGodwoken Workspaces

This is the monorepo for LightGodwoken and its official derived dapps.

LightGodwoken is an SDK written in TypeScript, it provides bridged functions that allows us to make specific transactions on Godwoken layer 2, but way easier. Based on the SDK, we can build up dapps' UI with higher level abstractions.

## Workspaces

- [LightGodwoken](packages/light-godwoken) - The base SDK with convenience functions on Godwoken
- [GodwokenBridge](apps/godwoken-bridge) - Asset bridge UI for transferring `CKB <=> Godwoken`

## Development

You can execute the following command to setup the local development environment.
For more detailed commands about each workspace, please check out `README.md` file of the certain workflow.

### Setup development environment
```bash
$ yarn install
$ yarn run prepare
``` 

### Build apps & packages
```bash
$ yarn run build
```

### Clean up environment
```bash
$ yarn run clean:pages
$ yarn run clean:packages
```


### Run development of Godwoken bridge
```bash
$ cd ./app/godwoken-bridge
$ yarn start
```
