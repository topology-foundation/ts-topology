// if it can't compile, append src/index.asc to the import path on runtime
import { GSet, gset_create, gset_add, gset_merge } from "@topology-foundation/crdt";

export class Chat {
  // store messages as strings in the format (timestamp, message, peerId)
  messages: GSet<string>;
  constructor() {
    this.messages = gset_create<string>();
  }

  addMessage(timestamp: string, message: string, node_id: string): void {
    this.messages.add(`(${timestamp}, ${message}, ${node_id})`)
  }

  getMessages(): GSet<string> {
    return this.messages;
  }

  merge(other: Chat): void {
    this.messages.merge(other.messages);
  }
}

export function createChat(): Chat {
  return new Chat();
}

// @ts-ignore
export function addMessage(chat: Chat, timestamp: string, message: string, node_id: string): void {
  gset_add(chat.messages, `(${timestamp}, ${message}, ${node_id})`)
}

// @ts-ignore
export function getMessages(chat: Chat): GSet<string> {
  return chat.messages;
}

// @ts-ignore
export function merge(chat: Chat, other: Chat): void {
  gset_merge(chat.messages, other.messages);
}
