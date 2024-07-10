# ts-topology
The official TypeScript implementation of Topology Protocol

### Development

To build and run this project you'll need to have [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#debian-stable) installed.
If you don't have yarn installed, go ahead and install the latest version.

#### Build Project
Install the dependecies of every package of the project.

```sh

# build crdt
> cd packages/crdt
> yarn install
> yarn build

# build network
> cd packages/network
> yarn install
> yarn build

# build node
> cd packages/node
> yarn install
> yarn build

# build object
> cd packages/objects
> yarn install
> yarn build

# build examples-canvas
> cd packages/examples/canvas
> yarn install
> yarn build

```

#### Run Project
To run the exemple-canvas run:

```sh
>cd examples/canvas
# this will execute "webpack serve" 
> yarn dev
```

This command will ... TODO

