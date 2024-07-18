# Conflict-free Replicated Data Types (CRDTs)

This package contains the CRDT implementations intended to use as builtins for the Topology Protocol.

## Usage

This package is intended to be used as a dependency for the Topology Protocol. However, you can use it as a standalone package. For that, you can install it using:

```bash
# yarn
yarn add @topology-foundation/crdt

# npm
npm install @topology-foundation/crdt
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

## CRDTs Implementations
- [x] G-Counter
- [x] PN-Counter
- [x] G-Set
- [x] 2P-Set
