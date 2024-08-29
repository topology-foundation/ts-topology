# LSeq CRDT

Implementation of the Linear Sequence (LSeq) Conflict-free Replicated Data Type (CRDT).

## Overview

LSeq is a data structure especially used in collaborative text editors by managing ordered sequences of elements across multiple replicas.
For this to be acomplished, each element has it's own unique identifier called "virtual pointer" (`vPointer`), composed by a byte sequence and the nodeId. The identifiers are used to track each element in the collection.

## Components

### vPointer Type

Represents the unique identifier associated with each `element` in the collection.
Since there's no guarantee that sequences produced on disconnected machines are 100% unique we associate the `nodeId` to create a unique identifier for the `element`.
It's composed by:

- **sequence**: byte sequence indentifier for the `element`
- **nodeId**: node identifier

### Vertex Type

It associates each `vPointer` with the correspondent `element`.
It's composed by:

- **vPointer** : `element's` identifier
- **element**: `element` to be stored

### LSeq Class

Class that manages the operations of the LSeq data structure. It's composed by the `nodeId` and the `vertices` array that stores all the `Vertex` types of the LSeq.
It has the following operations:

- **insert(index, element)**: inserts the `element` in the `vertices` array at the specified `index`
- **delete(index)**: deletes the `element` from the `vertices` array at the specified `index`
- **query()**: return an array with all the elements stored in the `vertices` array
- **merge(otherLSeq)**: merges the `otherLSeq` `vertices` array with the current one.

### Auxiliary functions
This implementation also has the following auxiliary functions:

- **compareSeq(seq1, seq2)**: compares two byte sequences to determine `index` positions
- **generateSeq(lo, hi)**: generates the byte sequence to be between `lo` and `hi`

## How it Works

**1.** When an element is inserted, a new virtual pointer (`vPointer`) is generated. It depends on the sequences of the neighbour elements in the collection. 

**2.** After the `vPointer` being created, a `vertex` ( {`vPointer`, `element`} ) is created. So this `element` is identified by this `vPointer`.

**3.** Then, the `vertex` is inserted at the given index in the `vertices` array.

**4.** To delete a `vertex` from the `vertices` array, just pass the index of the `vertex` to be delete.

**5.** When merging two LSeqs, the peer LSeq elements that the current LSeq doesn't contain are inserted into the 'vertices' array in the correct indexes.