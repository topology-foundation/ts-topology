import { GSet, gset_add, gset_create, gset_merge } from "@topology-foundation/crdt/src/builtins/GSet/index";

class Chat {
  // store messages as strings in the format (timestamp, message, peerId)
  messages: GSet<string>;

  constructor() {
    this.messages = gset_create<string>();
  }
}

export function createChat(): Chat {
  return new Chat();
}

export function addMessage(chat: Chat, timestamp: string, message: string, node_id: string): void {
  gset_add(chat.messages, `(${timestamp}, ${message}, ${node_id})`)
}

export function getMessages(chat: Chat): GSet<string> {
  return chat.messages;
}

export function merge(chat: Chat, other: Chat): void {
  gset_merge(chat.messages, other.messages);
}
