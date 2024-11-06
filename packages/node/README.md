# Topology Node

This package provides the implementation of a Topology Node, which is a node in a network that can be connected to other nodes and exchange messages with them. The Topology Node is the entrypoint for interacting with the Topology Protocol in the Topology Network.

## Usage

Topology Node can be used using the CLI or integrated into an existing application.

### CLI

The CLI provides a simple way to start a Topology Node and connect it to other nodes in the network. It can be installed globally using:

```bash
# yarn
yarn global add @topology-foundation/node

# npm
npm install -g @topology-foundation/node
```

> This part is a lie, the cli is being developed.

For more information on what are the commands available, run:

```bash
topology-node --help
```

#### Running a bootstrap node
You can run a bootstrap node using the following command:

```bash
pnpm cli bootstrap --config configs/bootstrap.json
```

If you want to run a local bootstrap node, you can use the following command:

```bash
pnpm cli bootstrap --config configs/local-bootstrap.json
```

### Integration

To integrate the Topology Node into an existing application, you can install it using:

```bash
# yarn
yarn add @topology-foundation/node

# npm
npm install @topology-foundation/node
```

Then, you can import the Topology Node class and create a new instance:

```javascript
import { TopologyNode } from '@topology-foundation/node';

const node = new TopologyNode();

// Start the node
node.start();
```
