# DRP Objects

This package provides a simple implementation of Conflict-free Replicated Objects (CROs) as defined in the Topology Protocol. CROs are a type of composable object that can be replicated across multiple nodes in a network, and can be updated concurrently by multiple clients without the need for coordination.

## Usage

This package is intended to implement a basic abstract class that can be extended for the creation of custom CROs. Basic operations for synchronization are provided, but the implementation of the actual object behavior is left to the app developer.

For starting, you can install it using:

```bash
pnpm install @ts-drp/object
```
