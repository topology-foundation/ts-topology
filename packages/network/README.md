# Topology Network Stack

This package contains the network middleware to abstract libp2p for the Topology Protocol.

To do so, we define a `TopologyNetworkNode` where we can pass the configs that we want and it "magically" configures libp2p and gives connectivity to the Topology Network.

## Usage

This package is intended to be used as a dependency for the Topology Protocol. However, you can use it as a standalone package. For that, you can install it using:

```bash
# yarn
yarn add @topology-foundation/network

# npm
npm install @topology-foundation/network
```

### Build

To build the package, you can run:

```bash
yarn build
```

### Tests

To run the tests, you can run:

```bash
yarn test
```
