import { GSet } from "@topology-foundation/crdt/src/builtins/GSet.js";
import { Set } from "assemblyscript/std/assembly/Set.js";

class Chat {
  // store messages as strings in the format (timestamp, message, peerId)
  messages: GSet<string>;

  constructor(peerId: string) {
    this.messages = new GSet<string>(new Set<string>());
  }
}

export function createChat(peerId: string): Chat {
  return new Chat(peerId);
}

export function addMessage(chat: Chat, timestamp: string, message: string, node_id: string): void {
  chat.messages.add(`(${timestamp}, ${message}, ${node_id})`);
}

export function getMessages(chat: Chat): GSet<string> {
  return chat.messages;
}

export function merge(chat: Chat, other: Chat): void {
  chat.messages.merge(other.messages);
}
