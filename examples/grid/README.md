# Topology Protocol Example

This is an example that uses Topology Protocol to implement a 2D grid space where users appear to be circles and can move around the integer grid one grid at a time.

## Specifics

The Grid CRO has a mapping from user id (node id concacenated with a randomly assigned color string) to the user's position on the grid. The CRO leverages the underlying hash graph for conflict-free consistency. The mergeCallback function receives the linearised operations returned from the underlying hash graph, and recomputes the user-position mapping from those operations.

## How to run locally

After cloning the repository, run the following commands:

```bash
cd ts-topology/examples/grid
pnpm dev
```
