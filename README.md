<div align="center">
  <img src="https://avatars.githubusercontent.com/u/157637200" height="128">
  <br />
  <h1>The TypeScript implementation of the Topology Protocol</h1>
</div>

<div align="center">

![Version](https://img.shields.io/github/package-json/v/topology-foundation/ts-topology)
[![Docs](https://img.shields.io/badge/docs-page-blue)](https://topology-foundation.github.io/ts-topology/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/topology-foundation/ts-topology/blob/main/LICENSE)
[![Issues](https://img.shields.io/badge/issues-report-red)](https://github.com/topology-foundation/ts-topology/issues)
[![Pull Requests](https://img.shields.io/badge/pull_requests-open-orange)](https://github.com/topology-foundation/ts-topology/pulls)

[![Website](https://img.shields.io/badge/Website-866678)](https://topology.gg)
[![GitHub](https://img.shields.io/badge/GitHub-ffffff)](https://github.com/topology-foundation)
[![X](https://img.shields.io/badge/X-000000)](https://x.com/topology_gg)
[![Telegram](https://img.shields.io/badge/Telegram-24A1DE)](https://t.me/topologyfrens)
[![Discord](https://img.shields.io/badge/Discord-7289da)](https://discord.gg/GUDGzBP5mn)
</div>

# Overview

This is the official TypeScript implementation of the Topology Protocol. The Topology Protocol is a local-first decentralized protocol for real-time applications. It introduces a new concept for Conflict-free Replicated Objects (CRO), that are built on top of libp2p and composed of CRDTs.

# Specifications

The specifications of the Topology Protocol are shared across different client implementations and can be found in the [specs repository](https://github.com/topology-foundation/specs). Currently the specifications are starting to be written based on this implementation.

# Packages

This repository is a monorepo that contains the following packages:

| Package | Description                                      |
|---------|--------------------------------------------------|
| crdt    | CRDT implementations intended to use as builtins |
| network | Network middleware to abstract libp2p            |
| node    | Topology Node library and CLI                    |
| object  | CRO objects structure implementation             |

# Examples

All the examples are located in the `examples` directory. Currently, there is only one example, which is a simple canvas where you can paint pixels. You can also look into the [counter-splash](https://github.com/topology-foundation/counter-splash) (demo for EthCC 2024) repository for a more complex example.

# Usage

This workspae has all packages and examples linked together, so you can run the following commands to start the development:

```bash
# pnpm
pnpm install
```

The postinstall script will build all the packages. In case you have errors, please manually build every package inside the folder `packages`.
