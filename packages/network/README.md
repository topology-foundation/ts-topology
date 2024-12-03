# DRP Network Stack

This package contains the network middleware to abstract libp2p for the DRP protocol.

To do so, we define a `DRPNetworkNode` where we can pass the configs that we want and it "magically" configures libp2p and gives connectivity to the DRP Network.

## Usage

This package is intended to be used as a dependency for the DRP protocol. However, you can use it as a standalone package. For that, you can install it using:

```bash
pnpm install @ts-drp/network
```

### Build

To build the package, you can run:

```bash
pnpm build
```

### Tests

To run the tests, you can run:

```bash
pnpm test
```
