# RGA (Replicated Growable Array) CRDT

This is an implementation of a Replicated Growable Array (RGA) Conflict-free Replicated Data Type (CRDT). RGA is a data structure that allows for concurrent editing of an array by multiple nodes, while automatically resolving most conflicts.

## Overview

The structure is designed to maintain a consistent state across multiple replicas, even when they receive operations in different orders. It achieves this by using unique identifiers for each element and a tombstone mechanism for deletions.

## Key Components

### RGAElement

Each element in the RGA is represented by an `RGAElement` object with the following properties:

-   `vid`: A unique identifier for the element, consisting of a counter and a node ID.
-   `value`: The actual value stored in the element (or null if the element is deleted).
-   `parent`: The identifier of the element that precedes this one in the logical order.
-   `isDeleted`: A flag indicating whether the element has been deleted.

### RGA Class

The `RGA` class manages the sequencer, which generates new identifiers, and the array of `RGAElement` objects providing methods for manipulating the array.

## Main Operations

1. **Insert**: Adds a new element at a specified index.
2. **Delete**: Marks an element as deleted (tombstone) at a specified index.
3. **Update**: Changes the value of an element at a specified index.
4. **Merge**: Combines the current RGA with another RGA, resolving conflicts automatically.
5. **getArray**: Serialises the current state of the RGA to an array of values.

## How It Works

1. **Unique Identifiers**: Each element has a unique identifier (`vid`) generated using a sequencer.

2. **Logical Ordering**: Elements are ordered based on their `parent` references and `vid` comparisons.

3. **Tombstones**: Deleted elements are not removed but marked as tombstones with the isDeleted property.

4. **Conflict Resolution**:

    - For concurrent inserts at the same position (same parent element), the element with the higher `vid` is placed first.
    - If the parent elements are different, the elements are inserted in the order of their parent's index.
    - Deletions are preserved due to the tombstone mechanism.

5. **Merging**: When merging two RGAs, elements from the peer RGA are inserted into the current RGA, maintaining the correct order and resolving the conflicts.

## Limitations

The RGA may not be able to resolve complex backward interleaving scenarios. The insertElement method primarily relies on the parent index and a simple comparison of virtual IDs (vids) to determine the insertion position. This may lead to conflicts in some edge cases.
